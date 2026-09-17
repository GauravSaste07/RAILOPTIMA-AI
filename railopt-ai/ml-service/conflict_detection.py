import os
import sys
from datetime import datetime
from collections import defaultdict
from typing import List, Dict, Any, Optional
import dateutil.parser
import dotenv
from supabase import create_client, Client

# Ensure stdout supports unicode on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def get_supabase_client() -> Client:
    """Initialize and return Supabase client using service role key from .env"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, ".env")
    if os.path.exists(env_path):
        dotenv.load_dotenv(env_path)
    else:
        dotenv.load_dotenv()

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in ml-service/.env"
        )

    return create_client(supabase_url, supabase_key)

def fetch_all_maintenance_requests(sb: Client, section_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch all maintenance requests from Supabase handling pagination."""
    all_rows = []
    page = 0
    page_size = 1000

    query = sb.table("maintenance_requests").select("*")
    if section_id:
        query = query.eq("section_id", section_id)

    while True:
        res = query.range(page * page_size, (page + 1) * page_size - 1).execute()
        data = res.data or []
        all_rows.extend(data)
        if len(data) < page_size:
            break
        page += 1

    return all_rows

def fetch_approved_blocks(sb: Client, section_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Fetch all approved blocks from Supabase blocks table."""
    try:
        query = sb.table("blocks").select("id, section_id, start_time, end_time, status").eq("status", "approved")
        if section_id:
            query = query.eq("section_id", section_id)
        res = query.execute()
        return res.data or []
    except Exception as e:
        print(f"[WARN] Could not fetch approved blocks: {e}")
        return []

def get_department_map(sb: Client) -> Dict[str, str]:
    """Fetch mapping of department_id to department name from Supabase."""
    try:
        res = sb.table("departments").select("id, name").execute()
        return {d["id"]: d["name"] for d in (res.data or [])}
    except Exception as e:
        print(f"[WARN] Could not fetch departments mapping: {e}")
        return {}

def detect_conflicts(
    requests: Optional[List[Dict[str, Any]]] = None,
    section_id: Optional[str] = None,
    target_request_id: Optional[str] = None,
    update_supabase: bool = True,
    batch_size: int = 200
) -> Dict[str, Any]:
    """
    Detects section schedule conflicts among maintenance requests and against approved blocks.

    Rules:
    1. Approved Block Overlap:
       Same section_id, overlapping time window with an approved block in 'blocks' table
       -> TRUE conflict (flags conflict_flag=True, conflicting_approved_block_id={block_uuid}, conflicting_with=null)
    2. Request-vs-Request Same Department:
       Same section_id, overlapping time window, SAME department
       -> TRUE conflict (flags conflict_flag=True, conflicting_with="{comma-separated other_req_ids}")
    3. Request-vs-Request Cross Department:
       Same section_id, overlapping time window, DIFFERENT departments
       -> Co-allocation candidate (leaves conflict_flag=False unless conflicting with approved block/same-dept)
    """
    sb = get_supabase_client()
    dept_map = get_department_map(sb)

    if requests is None:
        requests = fetch_all_maintenance_requests(sb, section_id=section_id)

    approved_blocks = fetch_approved_blocks(sb, section_id=section_id)

    total_count = len(requests)
    if total_count == 0:
        return {
            "total_requests": 0,
            "conflicts_count": 0,
            "non_conflicts_count": 0,
            "conflict_percentage": 0.0,
            "co_allocation_pairs_count": 0,
            "conflicts_map": {}
        }

    # Parse approved blocks by section
    approved_blocks_by_section = defaultdict(list)
    for blk in approved_blocks:
        sec = blk.get("section_id")
        start_val = blk.get("start_time")
        end_val = blk.get("end_time")
        if not sec or not start_val or not end_val:
            continue
        start_dt = start_val if isinstance(start_val, datetime) else dateutil.parser.parse(str(start_val))
        end_dt = end_val if isinstance(end_val, datetime) else dateutil.parser.parse(str(end_val))
        approved_blocks_by_section[sec].append({
            "id": str(blk.get("id")),
            "section_id": sec,
            "start": start_dt,
            "end": end_dt
        })

    # Group requests by section_id
    section_groups = defaultdict(list)
    parsed_requests = []

    for req in requests:
        req_id = req.get("id") or req.get("request_id")
        sec_id = req.get("section_id")
        start_val = req.get("requested_window_start")
        end_val = req.get("requested_window_end")
        dept_id = req.get("department_id")
        dept_name = req.get("department") or dept_map.get(dept_id) or str(dept_id)

        if not req_id or not sec_id or not start_val or not end_val:
            continue

        start_dt = start_val if isinstance(start_val, datetime) else dateutil.parser.parse(str(start_val))
        end_dt = end_val if isinstance(end_val, datetime) else dateutil.parser.parse(str(end_val))

        item = {
            "id": str(req_id),
            "section_id": sec_id,
            "start": start_dt,
            "end": end_dt,
            "department": dept_name,
            "department_id": dept_id
        }
        section_groups[sec_id].append(item)
        parsed_requests.append(item)

    request_conflicts_map = defaultdict(set)
    approved_block_conflicts = {}
    co_allocation_pairs = []

    # 1. Check conflicts against Approved Blocks
    for item in parsed_requests:
        sec = item["section_id"]
        blocks_in_sec = approved_blocks_by_section.get(sec, [])
        for blk in blocks_in_sec:
            # Interval overlap: start_a < end_b AND start_b < end_a
            if item["start"] < blk["end"] and blk["start"] < item["end"]:
                approved_block_conflicts[item["id"]] = blk["id"]
                break  # Record the primary conflicting approved block UUID

    # 2. Check conflicts among maintenance requests
    for sec_id, items in section_groups.items():
        n = len(items)
        for i in range(n):
            for j in range(i + 1, n):
                req_a = items[i]
                req_b = items[j]

                if req_a["start"] < req_b["end"] and req_b["start"] < req_a["end"]:
                    is_same_dept = (
                        (req_a["department_id"] and req_a["department_id"] == req_b["department_id"]) or
                        (req_a["department"] and req_a["department"] == req_b["department"])
                    )

                    if is_same_dept:
                        request_conflicts_map[req_a["id"]].add(req_b["id"])
                        request_conflicts_map[req_b["id"]].add(req_a["id"])
                    else:
                        co_allocation_pairs.append((req_a, req_b))

    # Prepare updates
    update_records = []
    for req in requests:
        req_id = str(req.get("id") or req.get("request_id"))
        if not req_id:
            continue

        if target_request_id and req_id != target_request_id:
            continue

        has_req_conflicts = (req_id in request_conflicts_map and len(request_conflicts_map[req_id]) > 0)
        has_block_conflict = (req_id in approved_block_conflicts)

        has_conflict = has_req_conflicts or has_block_conflict
        conflicting_with_val = ", ".join(sorted(list(request_conflicts_map[req_id]))) if has_req_conflicts else None
        conflicting_block_val = approved_block_conflicts.get(req_id, None)

        update_records.append({
            "id": req_id,
            "conflict_flag": has_conflict,
            "conflicting_with": conflicting_with_val,
            "conflicting_approved_block_id": conflicting_block_val
        })

    # Write back to Supabase
    if update_supabase and update_records:
        total_batches = (len(update_records) + batch_size - 1) // batch_size
        for i in range(0, len(update_records), batch_size):
            batch = update_records[i:i + batch_size]
            sb.table("maintenance_requests").upsert(batch).execute()

    all_conflicted_ids = set(request_conflicts_map.keys()) | set(approved_block_conflicts.keys())
    conflicts_count = len(all_conflicted_ids)
    non_conflicts_count = total_count - conflicts_count
    conflict_pct = (conflicts_count / total_count) * 100 if total_count > 0 else 0.0

    conflicts_map_summary = {}
    for r_id in all_conflicted_ids:
        items_desc = []
        if r_id in request_conflicts_map:
            items_desc.extend(sorted(list(request_conflicts_map[r_id])))
        if r_id in approved_block_conflicts:
            items_desc.append(f"Approved Block ({approved_block_conflicts[r_id][:8]})")
        conflicts_map_summary[r_id] = items_desc

    return {
        "total_requests": total_count,
        "conflicts_count": conflicts_count,
        "non_conflicts_count": non_conflicts_count,
        "conflict_percentage": conflict_pct,
        "co_allocation_pairs_count": len(co_allocation_pairs),
        "conflicts_map": conflicts_map_summary,
        "request_conflicts_map": {k: sorted(list(v)) for k, v in request_conflicts_map.items()},
        "approved_block_conflicts": approved_block_conflicts,
        "records": update_records
    }
