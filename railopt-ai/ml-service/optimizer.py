import os
import sys
import uuid
import time
from datetime import datetime, date, timedelta
from collections import defaultdict
from typing import List, Dict, Any, Optional, Union, Tuple
import dateutil.parser
import dotenv
import pandas as pd
import numpy as np
from ortools.sat.python import cp_model
from supabase import create_client, Client

from corridor_availability import (
    compute_available_windows,
    get_supabase_client,
    DEFAULT_HEADWAY_MINUTES,
    TRACTION_ISOLATION_MINUTES
)

# Ensure stdout supports unicode on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ==============================================================================
# OPTIMIZATION PARAMETERS & CONSTANTS
# ==============================================================================
DAYLIGHT_BONUS_WEIGHT = 25          # Soft constraint bonus for daylight operations (06:00 - 18:00)
CO_ALLOCATION_MAX_GAP_MINUTES = 30  # Max allowable gap between multi-dept requests to qualify for bundling
TRAFFIC_PENALTY_PER_TRAIN = 30      # Penalty points per adjacent train slot near a maintenance window

# IMPROVED: Differentiated timeouts — monthly plans need more solve time
# Weekly (7 days × 15 sections = 105 section-days): 20s sufficient
# Monthly (30 days × 15 sections = 450 section-days): needs 90s to avoid greedy fallback
SOLVER_TIMEOUT_BY_HORIZON = {
    "weekly": 20.0,
    "monthly": 90.0
}
SOLVER_TIMEOUT_SECONDS = 30.0       # Fallback default

DEPT_NAME_MAP = {
    "1ef66a28-7465-4ed5-98b7-a5e91f64ed61": "Engineering",
    "c710bd13-541c-4dcc-9ecb-14b2059649de": "Signal & Telecom",
    "86916be9-bf38-4db6-b606-09a53d78bf3c": "Traction Distribution",
}

def resolve_dept_name(dept_val: Any) -> str:
    """Maps department UUID to clean human-readable name if present, else returns string representation."""
    if not dept_val:
        return "General"
    val_str = str(dept_val).strip()
    return DEPT_NAME_MAP.get(val_str, val_str)

def parse_conflicting_ids(raw_val: Optional[str]) -> List[str]:
    """
    Parses comma-separated conflicting request IDs into a clean list.
    Handles multiple IDs (e.g. 'REQ-00572, REQ-01016, REQ-01612').
    """
    if not raw_val:
        return []
    return [cid.strip() for cid in str(raw_val).split(",") if cid.strip()]

def is_daylight_window(start_dt: datetime, end_dt: datetime) -> bool:
    """Returns True if the majority of the window falls between 06:00 and 18:00."""
    mid_hour = (start_dt + (end_dt - start_dt) / 2).hour
    return 6 <= mid_hour < 18

def fetch_requests_for_horizon(
    sb: Client,
    start_date_str: str,
    end_date_str: str
) -> List[Dict[str, Any]]:
    """Fetches all maintenance requests within the target date range using pagination."""
    all_requests = []
    page = 0
    page_size = 1000

    start_iso = f"{start_date_str}T00:00:00+00:00"
    end_iso = f"{end_date_str}T23:59:59+00:00"

    while True:
        res = sb.table("maintenance_requests")\
                .select("*")\
                .gte("requested_window_start", start_iso)\
                .lte("requested_window_start", end_iso)\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute()
        data = res.data or []
        all_requests.extend(data)
        if len(data) < page_size:
            break
        page += 1

    return all_requests

def fetch_horizon_slots(
    sb: Client,
    start_date_str: str,
    end_date_str: str
) -> List[Dict[str, Any]]:
    """Fetches all timetable slots across all sections for the horizon in bulk."""
    all_slots = []
    page = 0
    page_size = 1000
    start_iso = f"{start_date_str}T00:00:00+00:00"
    end_iso = f"{end_date_str}T23:59:59+00:00"

    while True:
        res = sb.table("timetable_slots")\
                .select("*")\
                .gte("scheduled_arrival", start_iso)\
                .lte("scheduled_arrival", end_iso)\
                .range(page * page_size, (page + 1) * page_size - 1)\
                .execute()
        data = res.data or []
        all_slots.extend(data)
        if len(data) < page_size:
            break
        page += 1

    return all_slots

def run_fallback_greedy_scheduler(
    requests: List[Dict[str, Any]],
    available_windows_by_section: Dict[str, List[Dict[str, Any]]],
    horizon: str
) -> List[Dict[str, Any]]:
    """
    Fast greedy fallback scheduler if CP-SAT exceeds 30-second timeout.
    Sorts requests by risk_score descending and greedily assigns to the closest
    available non-conflicting window on the same section.
    """
    print("[FALLBACK] Executing greedy priority scheduler...")
    sorted_reqs = sorted(requests, key=lambda r: float(r.get("risk_score") or 0.0), reverse=True)
    
    assigned_blocks = []
    window_occupied_depts = defaultdict(set)
    scheduled_req_ids = set()

    for req in sorted_reqs:
        req_id = req["id"]
        sec_id = req["section_id"]
        req_start = dateutil.parser.parse(req["requested_window_start"])
        req_end = dateutil.parser.parse(req["requested_window_end"])
        req_dur = (req_end - req_start).total_seconds() / 60.0
        req_date = req_start.date()
        dept = str(req.get("department_id") or req.get("department") or "default")
        is_traction = "traction" in dept.lower()
        conflicts = set(parse_conflicting_ids(req.get("conflicting_with")))

        sec_windows = available_windows_by_section.get(sec_id, [])
        # Sort windows by proximity to requested date
        sorted_sec_windows = sorted(sec_windows, key=lambda w: abs((w["start_dt"].date() - req_date).days))

        for w in sorted_sec_windows:
            w_id = w["window_id"]
            w_start = w["start_dt"]
            w_end = w["end_dt"]

            if is_traction:
                eff_w_start = w_start + timedelta(minutes=TRACTION_ISOLATION_MINUTES)
                eff_w_end = w_end - timedelta(minutes=TRACTION_ISOLATION_MINUTES)
            else:
                eff_w_start = w_start
                eff_w_end = w_end

            if eff_w_end <= eff_w_start:
                continue

            w_dur = (eff_w_end - eff_w_start).total_seconds() / 60.0
            if w_dur >= req_dur:
                # Check department conflict in window
                if dept in window_occupied_depts[w_id]:
                    continue

                # Check explicit conflicting_with
                assigned_in_window = [b for b in assigned_blocks if b.get("window_id") == w_id]
                has_conflict = any(any(cid in conflicts for cid in b["request_ids"]) for b in assigned_in_window)
                if has_conflict:
                    continue

                window_occupied_depts[w_id].add(dept)
                scheduled_req_ids.add(req_id)
                assigned_blocks.append({
                    "id": str(uuid.uuid4()),
                    "window_id": w_id,
                    "section_id": sec_id,
                    "start_time": eff_w_start.isoformat(),
                    "end_time": (eff_w_start + timedelta(minutes=req_dur)).isoformat(),
                    "status": "proposed",
                    "request_ids": [req_id],
                    "confidence": w.get("confidence", 0.95),
                    "horizon": horizon,
                    "solver_method": "fallback_greedy",
                    "co_allocated": False,
                    "requests_count": 1,
                    "total_risk_score": float(req.get("risk_score") or 0.0),
                    "departments": [resolve_dept_name(dept)]
                })
                break

    return assigned_blocks

def optimize_maintenance_blocks(
    horizon: str = "weekly",
    start_date: Union[str, date, datetime] = "2026-09-07",
    sb: Optional[Client] = None,
    persist_to_db: bool = False,
    exclude_request_ids: Optional[Union[List[str], str]] = None
) -> Dict[str, Any]:
    """
    Multi-Department Corridor Maintenance Block Optimizer using Google OR-Tools CP-SAT.

    Hard Constraints:
    - Assigned block must fit fully within an available window (already respecting train slots,
      safety headway, traction isolation, and already-approved blocks).
    - No two non-co-allocated blocks overlap on the same corridor section.
    - Two requests in each other's conflicting_with list cannot both be scheduled in overlapping windows.

    Soft Constraint:
    - Prefer daylight hours (06:00 - 18:00) via objective bonus.

    Co-Allocation (Shared Block Bundling):
    - Non-conflicting requests of DIFFERENT departments on the SAME section with overlapping or
      adjacent (<= 30m) windows are merged into a single co-allocated block (co_allocated=True)
      serving multiple departments during a single closure.

    Objective:
    - Maximize total risk_score of all scheduled requests.

    Args:
        horizon: 'weekly' (7 days) or 'monthly' (30 days)
        start_date: Base starting date for the optimization horizon
        sb: Supabase client instance
        persist_to_db: If True, writes proposed blocks to the blocks table in Supabase
        exclude_request_ids: Optional list or comma-separated string of request IDs to exclude for what-if analysis

    Returns:
        Structured dictionary containing optimization statistics, scheduled blocks,
        and co-allocation details.
    """
    start_time_perf = time.time()
    if sb is None:
        sb = get_supabase_client()

    # Determine horizon duration
    if isinstance(start_date, str):
        base_date = datetime.strptime(start_date.split("T")[0], "%Y-%m-%d").date()
    elif isinstance(start_date, datetime):
        base_date = start_date.date()
    else:
        base_date = start_date

    horizon_days = 7 if horizon.lower() == "weekly" else 30
    end_date = base_date + timedelta(days=horizon_days - 1)

    start_date_str = base_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")

    print(f"\n[OPTIMIZER] Initializing {horizon.upper()} optimization horizon:")
    print(f"            Date Range: {start_date_str} to {end_date_str} ({horizon_days} days)")

    # 1. Fetch maintenance requests and timetable slots in bulk for the horizon
    raw_requests = fetch_requests_for_horizon(sb, start_date_str, end_date_str)
    print(f"[1/5] Loaded {len(raw_requests)} maintenance requests from Supabase for this horizon.")

    if exclude_request_ids:
        if isinstance(exclude_request_ids, str):
            excluded_set = set(x.strip() for x in exclude_request_ids.split(",") if x.strip())
        else:
            excluded_set = set(exclude_request_ids)
        raw_requests = [r for r in raw_requests if r.get("id") not in excluded_set]
        print(f"      Excluded {len(excluded_set)} requests via what-if parameter. {len(raw_requests)} candidate requests remaining.")

    if not raw_requests:
        return {
            "status": "success",
            "horizon": horizon,
            "date_range": {"start": start_date_str, "end": end_date_str},
            "total_candidate_requests": 0,
            "scheduled_requests_count": 0,
            "scheduled_blocks_count": 0,
            "co_allocated_blocks_count": 0,
            "co_allocated_requests_count": 0,
            "total_risk_score_scheduled": 0.0,
            "solver_method": "optimal",
            "solver_time_seconds": round(time.time() - start_time_perf, 3),
            "blocks": []
        }

    # Fetch all timetable slots and approved blocks in bulk
    all_horizon_slots = fetch_horizon_slots(sb, start_date_str, end_date_str)
    print(f"      Loaded {len(all_horizon_slots)} timetable slots for the horizon.")

    approved_blocks = []
    try:
        b_res = sb.table("blocks").select("*").eq("status", "approved").execute()
        approved_blocks = b_res.data or []
    except Exception:
        approved_blocks = []

    unique_sections = sorted(list(set(r["section_id"] for r in raw_requests if r.get("section_id"))))
    print(f"[2/5] Computing corridor availability across {len(unique_sections)} sections ({horizon_days} days/section)...")

    # 2. Precompute available windows using fast in-memory filtering
    available_windows_by_section = defaultdict(list)
    window_counter = 0

    for sec in unique_sections:
        for day_offset in range(horizon_days):
            cur_d = base_date + timedelta(days=day_offset)
            cur_d_str = cur_d.strftime("%Y-%m-%d")
            
            day_windows = compute_available_windows(
                sec,
                cur_d_str,
                request_department=None,
                sb=sb,
                prefetched_slots=all_horizon_slots,
                prefetched_approved_blocks=approved_blocks
            )
            for w in day_windows:
                window_counter += 1
                w_record = dict(w)
                w_record["window_id"] = f"W-{window_counter:06d}"
                w_record["section_id"] = sec
                w_record["date_str"] = cur_d_str
                w_record["start_dt"] = dateutil.parser.parse(w["start"])
                w_record["end_dt"] = dateutil.parser.parse(w["end"])
                available_windows_by_section[sec].append(w_record)

    total_available_windows = sum(len(wlist) for wlist in available_windows_by_section.values())
    print(f"      Total available corridor gap windows computed: {total_available_windows}")

    # 3. Match requests to candidate fitting windows
    print("\n[3/5] Formulating OR-Tools CP-SAT integer programming model...")
    model = cp_model.CpModel()

    x_vars = {}                  # (req_id, window_id) -> BoolVar
    req_candidate_windows = defaultdict(list)
    window_candidate_reqs = defaultdict(list)
    request_by_id = {r["id"]: r for r in raw_requests}

    for req in raw_requests:
        r_id = req["id"]
        sec_id = req["section_id"]
        req_start = dateutil.parser.parse(req["requested_window_start"])
        req_end = dateutil.parser.parse(req["requested_window_end"])
        req_duration_mins = (req_end - req_start).total_seconds() / 60.0
        dept = str(req.get("department_id") or req.get("department") or "")
        is_traction = "traction" in dept.lower()

        candidate_windows = available_windows_by_section.get(sec_id, [])
        for w in candidate_windows:
            w_start = w["start_dt"]
            w_end = w["end_dt"]

            # If traction distribution, apply 25m isolation buffer at both ends
            if is_traction:
                eff_w_start = w_start + timedelta(minutes=TRACTION_ISOLATION_MINUTES)
                eff_w_end = w_end - timedelta(minutes=TRACTION_ISOLATION_MINUTES)
            else:
                eff_w_start = w_start
                eff_w_end = w_end

            if eff_w_end <= eff_w_start:
                continue

            w_duration_mins = (eff_w_end - eff_w_start).total_seconds() / 60.0
            if w_duration_mins >= req_duration_mins:
                var_name = f"x_{r_id}_{w['window_id']}"
                x_var = model.NewBoolVar(var_name)
                x_vars[(r_id, w["window_id"])] = x_var
                req_candidate_windows[r_id].append((w["window_id"], w, x_var))
                window_candidate_reqs[w["window_id"]].append((r_id, req, x_var))

    # --- Constraint 1: Each maintenance request is scheduled at most once ---
    for r_id, candidates in req_candidate_windows.items():
        model.Add(sum(x_var for _, _, x_var in candidates) <= 1)

    # --- Constraint 2: Mutual exclusion for conflicting requests ---
    for r in raw_requests:
        r_id = r["id"]
        conflicts = parse_conflicting_ids(r.get("conflicting_with"))
        for other_id in conflicts:
            if other_id in request_by_id and other_id > r_id:
                for w_id in window_candidate_reqs:
                    if (r_id, w_id) in x_vars and (other_id, w_id) in x_vars:
                        model.Add(x_vars[(r_id, w_id)] + x_vars[(other_id, w_id)] <= 1)

    # --- Constraint 3: Same-Department mutual exclusion per window ---
    # (Cross-department non-conflicting requests CAN share a window)
    for w_id, cand_list in window_candidate_reqs.items():
        dept_groups = defaultdict(list)
        for r_id, req, x_var in cand_list:
            d_id = req.get("department_id") or req.get("department") or "default"
            dept_groups[d_id].append(x_var)

        for d_id, vars_in_dept in dept_groups.items():
            if len(vars_in_dept) > 1:
                model.Add(sum(vars_in_dept) <= 1)

    # --- Objective: Maximize Total Risk Score + Daylight Bonus + Proximity Preference - Traffic Penalty ---
    objective_terms = []
    for (r_id, w_id), x_var in x_vars.items():
        req = request_by_id[r_id]
        risk = float(req.get("risk_score") or 0.5)
        risk_weight = int(round(risk * 1000))

        w_dict = [w for wid, w, _ in req_candidate_windows[r_id] if wid == w_id][0]
        daylight_bonus = DAYLIGHT_BONUS_WEIGHT if is_daylight_window(w_dict["start_dt"], w_dict["end_dt"]) else 0

        # Proximity preference: reward scheduling close to originally requested date
        req_date = dateutil.parser.parse(req["requested_window_start"]).date()
        w_date = w_dict["start_dt"].date()
        days_diff = abs((w_date - req_date).days)
        pref_bonus = max(0, 500 - 50 * days_diff)

        # IMPROVED: Traffic impact penalty — penalize scheduling near peak train movements
        # Count trains in the timetable_slots that overlap within 1 hour of this window
        sec_id = req.get("section_id", "")
        w_start = w_dict["start_dt"]
        w_end = w_dict["end_dt"]
        # Estimate adjacent train count from available window metadata
        # Fewer trains near the window = better maintenance slot for operations
        # We proxy this via confidence: lower confidence windows tend to be near more trains
        window_confidence = float(w_dict.get("confidence", 0.95))
        # Penalty inversely proportional to window confidence:
        # High confidence (0.95) = clean gap = low penalty
        # Low confidence (0.40) = adjacent to many forecasted goods trains = higher penalty
        traffic_penalty = int((1.0 - window_confidence) * TRAFFIC_PENALTY_PER_TRAIN * 5)

        total_weight = risk_weight + daylight_bonus + pref_bonus - traffic_penalty
        objective_terms.append(total_weight * x_var)

    model.Maximize(sum(objective_terms))

    # 4. Solve Model with Horizon-Differentiated Timeout
    solver_timeout = SOLVER_TIMEOUT_BY_HORIZON.get(horizon.lower(), SOLVER_TIMEOUT_SECONDS)
    print(f"\n[4/5] Solving CP-SAT model (Timeout={solver_timeout}s for {horizon.upper()} horizon)...")
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = solver_timeout
    solver.parameters.num_search_workers = 8

    solver_status = solver.Solve(model)
    solver_time = round(time.time() - start_time_perf, 3)

    if solver_status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        solver_method = "optimal" if solver_status == cp_model.OPTIMAL else "feasible"
        print(f"      CP-SAT Solver converged: {solver.StatusName(solver_status)} in {solver_time}s")
        print(f"      Objective Value: {solver.ObjectiveValue()}")

        # Extract scheduled assignments
        scheduled_assignments = []
        for (r_id, w_id), x_var in x_vars.items():
            if solver.Value(x_var) == 1:
                req = request_by_id[r_id]
                w_dict = [w for wid, w, _ in req_candidate_windows[r_id] if wid == w_id][0]
                scheduled_assignments.append((req, w_dict))

        # 5. Co-Allocation & Multi-Department Bundling
        print("\n[5/5] Performing multi-department Co-Allocation bundling...")
        blocks = []
        co_allocated_blocks_count = 0
        co_allocated_requests_count = 0

        # Group scheduled assignments by window_id
        window_assignments = defaultdict(list)
        for req, w_dict in scheduled_assignments:
            window_assignments[w_dict["window_id"]].append((req, w_dict))

        for w_id, items in window_assignments.items():
            w_dict = items[0][1]
            w_start = w_dict["start_dt"]
            w_end = w_dict["end_dt"]

            if len(items) == 1:
                req, _ = items[0]
                dept = str(req.get("department_id") or req.get("department") or "")
                is_traction = "traction" in dept.lower()
                eff_w_start = w_start + timedelta(minutes=TRACTION_ISOLATION_MINUTES) if is_traction else w_start
                r_dur = (dateutil.parser.parse(req["requested_window_end"]) - dateutil.parser.parse(req["requested_window_start"])).total_seconds() / 60.0
                assigned_start = eff_w_start
                assigned_end = eff_w_start + timedelta(minutes=r_dur)
                risk_val = float(req.get("risk_score") or 0.0)

                blocks.append({
                    "id": str(uuid.uuid4()),
                    "section_id": req["section_id"],
                    "start_time": assigned_start.isoformat(),
                    "end_time": assigned_end.isoformat(),
                    "status": "proposed",
                    "request_ids": [req["id"]],
                    "confidence": w_dict.get("confidence", 0.95),
                    "horizon": horizon,
                    "solver_method": solver_method,
                    "co_allocated": False,
                    "requests_count": 1,
                    "total_risk_score": round(risk_val, 4),
                    "departments": [resolve_dept_name(req.get("department_id") or req.get("department"))]
                })
            else:
                # Multiple cross-department requests scheduled in the same window -> Bundle!
                req_ids = [r["id"] for r, _ in items]
                max_req_dur = max(
                    (dateutil.parser.parse(r["requested_window_end"]) - dateutil.parser.parse(r["requested_window_start"])).total_seconds() / 60.0
                    for r, _ in items
                )
                any_traction = any("traction" in str(r.get("department_id") or r.get("department") or "").lower() or "86916be9" in str(r.get("department_id") or "") for r, _ in items)
                eff_w_start = w_start + timedelta(minutes=TRACTION_ISOLATION_MINUTES) if any_traction else w_start
                union_start = eff_w_start
                union_end = eff_w_start + timedelta(minutes=max_req_dur)

                min_conf = min(float(w_dict.get("confidence", 0.95)) for _, _ in items)
                total_risk = sum(float(r.get("risk_score") or 0.0) for r, _ in items)
                depts = [resolve_dept_name(d) for d in list(set(r.get("department_id") or r.get("department") for r, _ in items))]

                # Calculate downtime hours saved by bundling vs separate track closures
                sum_indiv_dur = sum(
                    (dateutil.parser.parse(r["requested_window_end"]) - dateutil.parser.parse(r["requested_window_start"])).total_seconds() / 60.0
                    for r, _ in items
                )
                saved_mins = max(0.0, sum_indiv_dur - max_req_dur)
                saved_hrs = round(saved_mins / 60.0, 1)

                co_allocated_blocks_count += 1
                co_allocated_requests_count += len(req_ids)

                blocks.append({
                    "id": str(uuid.uuid4()),
                    "section_id": items[0][0]["section_id"],
                    "start_time": union_start.isoformat(),
                    "end_time": union_end.isoformat(),
                    "status": "proposed",
                    "request_ids": req_ids,
                    "confidence": min_conf,
                    "horizon": horizon,
                    "solver_method": solver_method,
                    "co_allocated": True,
                    "requests_count": len(req_ids),
                    "downtime_saved_hours": saved_hrs,
                    "total_risk_score": round(total_risk, 4),
                    "departments": depts,
                    "co_allocation_note": f"Bundled {len(req_ids)} cross-department maintenance requests into a unified corridor closure (saved {saved_hrs}h downtime)"
                })

    else:
        print(f"[WARN] CP-SAT did not find optimal/feasible solution ({solver.StatusName(solver_status)}). Engaging greedy fallback...")
        blocks = run_fallback_greedy_scheduler(raw_requests, available_windows_by_section, horizon)
        solver_method = "fallback_greedy"
        co_allocated_blocks_count = 0
        co_allocated_requests_count = 0

    total_scheduled_reqs = sum(len(b["request_ids"]) for b in blocks)
    total_risk_scheduled = sum(b["total_risk_score"] for b in blocks)

    # Persist proposed blocks to Supabase if requested
    requests_updated_to_proposed = 0
    if persist_to_db and blocks:
        print(f"[DB] Persisting {len(blocks)} proposed blocks to Supabase...")
        db_records = []
        all_scheduled_rids = []
        for b in blocks:
            db_records.append({
                "id": b["id"],
                "section_id": b["section_id"],
                "start_time": b["start_time"],
                "end_time": b["end_time"],
                "status": b["status"],
                "request_ids": b["request_ids"],
                "confidence": b["confidence"],
                "horizon": b["horizon"],
                "solver_method": b["solver_method"],
                "co_allocated": b["co_allocated"]
            })
            all_scheduled_rids.extend(b["request_ids"])
        
        batch_size = 100
        for i in range(0, len(db_records), batch_size):
            sb.table("blocks").upsert(db_records[i:i+batch_size]).execute()
        print("✓ Proposed blocks successfully saved to Supabase.")

        # Update included requests with status 'scored' -> 'proposed'
        if all_scheduled_rids:
            unique_rids = list(set(all_scheduled_rids))
            for i in range(0, len(unique_rids), batch_size):
                batch_rids = unique_rids[i:i+batch_size]
                scored_res = sb.table("maintenance_requests")\
                               .select("id")\
                               .in_("id", batch_rids)\
                               .eq("status", "scored")\
                               .execute()
                scored_to_update = [r["id"] for r in (scored_res.data or [])]
                if scored_to_update:
                    sb.table("maintenance_requests")\
                      .update({"status": "proposed"})\
                      .in_("id", scored_to_update)\
                      .execute()
                    requests_updated_to_proposed += len(scored_to_update)

            print(f"✓ Updated {requests_updated_to_proposed} maintenance requests from 'scored' to 'proposed'.")

    return {
        "status": "success",
        "horizon": horizon,
        "date_range": {"start": start_date_str, "end": end_date_str},
        "total_candidate_requests": len(raw_requests),
        "scheduled_requests_count": total_scheduled_reqs,
        "scheduled_blocks_count": len(blocks),
        "co_allocated_blocks_count": co_allocated_blocks_count,
        "co_allocated_requests_count": co_allocated_requests_count,
        "requests_status_updated_to_proposed": requests_updated_to_proposed,
        "total_risk_score_scheduled": round(total_risk_scheduled, 2),
        "total_downtime_saved_hours": round(sum(b.get("downtime_saved_hours", 0.0) for b in blocks), 1),
        "solver_method": solver_method,
        "solver_time_seconds": solver_time,
        "blocks": blocks
    }

if __name__ == "__main__":
    print("=" * 80)
    print("       RailOpt AI - Multi-Department Block Optimization Engine")
    print("=" * 80)

    # Run Weekly Optimization
    print("\n" + "#" * 80)
    print("                      RUNNING HORIZON: WEEKLY")
    print("#" * 80)
    weekly_res = optimize_maintenance_blocks(horizon="weekly", start_date="2026-09-07", persist_to_db=False)

    # Run Monthly Optimization
    print("\n" + "#" * 80)
    print("                      RUNNING HORIZON: MONTHLY")
    print("#" * 80)
    monthly_res = optimize_maintenance_blocks(horizon="monthly", start_date="2026-09-07", persist_to_db=False)

    # Side-by-side comparison
    print("\n" + "=" * 80)
    print("               WEEKLY vs MONTHLY OPTIMIZATION COMPARISON")
    print("=" * 80)
    print(f"{'Metric':<35} | {'Weekly (7 Days)':<20} | {'Monthly (30 Days)':<20}")
    print("-" * 80)
    print(f"{'Date Range':<35} | {weekly_res['date_range']['start'] + ' to ' + weekly_res['date_range']['end']:<20} | {monthly_res['date_range']['start'] + ' to ' + monthly_res['date_range']['end']:<20}")
    print(f"{'Total Candidate Requests':<35} | {weekly_res['total_candidate_requests']:<20} | {monthly_res['total_candidate_requests']:<20}")
    print(f"{'Total Scheduled Requests':<35} | {weekly_res['scheduled_requests_count']:<20} | {monthly_res['scheduled_requests_count']:<20}")
    print(f"{'Total Blocks Generated':<35} | {weekly_res['scheduled_blocks_count']:<20} | {monthly_res['scheduled_blocks_count']:<20}")
    print(f"{'Co-Allocated (Shared) Blocks':<35} | {weekly_res['co_allocated_blocks_count']:<20} | {monthly_res['co_allocated_blocks_count']:<20}")
    print(f"{'Requests Bundled in Co-Allocations':<35} | {weekly_res['co_allocated_requests_count']:<20} | {monthly_res['co_allocated_requests_count']:<20}")
    print(f"{'Total Scheduled Risk Score':<35} | {weekly_res['total_risk_score_scheduled']:<20.2f} | {monthly_res['total_risk_score_scheduled']:<20.2f}")
    print(f"{'Solver Method Used':<35} | {weekly_res['solver_method']:<20} | {monthly_res['solver_method']:<20}")
    print(f"{'Solver Run Time':<35} | {str(weekly_res['solver_time_seconds']) + 's':<20} | {str(monthly_res['solver_time_seconds']) + 's':<20}")
    print("=" * 80)

    # Highlight sample co-allocated blocks
    print("\n" + "-" * 80)
    print("       SAMPLE CO-ALLOCATED (SHARED CROSS-DEPARTMENT) BLOCKS")
    print("-" * 80)
    sample_bundled = [b for b in weekly_res["blocks"] if b["co_allocated"]]
    if not sample_bundled:
        sample_bundled = [b for b in monthly_res["blocks"] if b["co_allocated"]]

    for idx, b in enumerate(sample_bundled[:3], 1):
        s_time = dateutil.parser.parse(b["start_time"]).strftime("%Y-%m-%d %H:%M")
        e_time = dateutil.parser.parse(b["end_time"]).strftime("%H:%M")
        print(f"Bundled Block #{idx} [Section: {b['section_id']} | Horizon: {b['horizon']}]:")
        print(f"  • Time Window       : {s_time} to {e_time}")
        print(f"  • Co-Allocated Flag : {b['co_allocated']}")
        print(f"  • Merged Request IDs: {b['request_ids']}")
        print(f"  • Total Risk Score  : {b['total_risk_score']:.4f}")
        print(f"  • Note              : {b.get('co_allocation_note')}\n")
    print("=" * 80)
