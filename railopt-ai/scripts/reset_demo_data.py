"""
RailOpt AI - Canonical Demo Database Reset Pipeline
===================================================
Canonical reset script for RailOpt AI:
1. Wipes maintenance_requests, blocks, and audit_log.
2. Re-seeds all 2,002 maintenance requests from source CSV + test requests.
3. Runs ML risk scoring (XGBoost) and conflict detection across all records.
4. Generates initial weekly proposed blocks (15 blocks, 0 audit_log entries).
"""

import os
import sys
import csv
import json

# Ensure stdout supports unicode on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Setup module path to ml-service
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ml_dir = os.path.join(base_dir, "ml-service")
sys.path.insert(0, ml_dir)

from conflict_detection import detect_conflicts, get_supabase_client, fetch_all_maintenance_requests
from optimizer import optimize_maintenance_blocks
import main as ml_main

BATCH_SIZE = 200

def reset_demo_data():
    print("==================================================")
    print("     RailOpt AI - Demo Database Reset Pipeline    ")
    print("==================================================")

    sb = get_supabase_client()
    processed_dir = os.path.join(base_dir, "data", "processed")
    requests_csv_path = os.path.join(processed_dir, "maintenance_requests_seed.csv")

    if not os.path.exists(requests_csv_path):
        print(f"[ERROR] Cannot find seed file at: {requests_csv_path}")
        sys.exit(1)

    # 1. Truncate / Delete maintenance_requests, blocks, audit_log tables
    print("\n[Step 1] Wiping maintenance_requests, blocks, and audit_log tables...")
    
    # Clear FKs first to avoid constraint violation
    sb.table("maintenance_requests").update({"conflicting_approved_block_id": None}).neq("id", "NONE").execute()
    sb.table("blocks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    sb.table("audit_log").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    sb.table("maintenance_requests").delete().neq("id", "NONE").execute()
    print("✓ Tables wiped clean (maintenance_requests, blocks, audit_log).")

    # 2. Re-seed maintenance_requests from CSV
    print(f"\n[Step 2] Re-seeding maintenance_requests from {requests_csv_path}...")
    with open(requests_csv_path, mode="r", encoding="utf-8") as f:
        req_rows = list(csv.DictReader(f))

    total_reqs = len(req_rows)
    total_batches = (total_reqs + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Total maintenance requests in CSV: {total_reqs} across {total_batches} batches ({BATCH_SIZE} rows/batch)")

    for i in range(0, total_reqs, BATCH_SIZE):
        batch = req_rows[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1

        vals = []
        for r in batch:
            rid = r["request_id"].replace("'", "''")
            aid = r["asset_id"].replace("'", "''")
            dept = r["department"].replace("'", "''")
            sec_id = r["section_id"].replace("'", "''")
            dtype = r["defect_type"].replace("'", "''")
            overdue = int(r["overdue_days"]) if r["overdue_days"] else 0
            density = float(r["section_traffic_density"]) if r.get("section_traffic_density") else 40.0
            wstart = r["requested_window_start"].replace("'", "''")
            wend = r["requested_window_end"].replace("'", "''")
            vals.append(f"('{rid}', '{aid}', '{dept}', '{sec_id}', '{dtype}', {overdue}, {density}, '{wstart}'::timestamptz, '{wend}'::timestamptz, 'pending')")

        sql = f"""
INSERT INTO public.maintenance_requests (
  id, asset_id, department_id, section_id, defect_type, overdue_days, section_traffic_density, requested_window_start, requested_window_end, status
)
SELECT
  v.id, v.asset_id, d.id, v.section_id, v.defect_type, v.overdue_days, v.section_traffic_density, v.requested_window_start, v.requested_window_end, v.status
FROM (VALUES {','.join(vals)}) AS v(id, asset_id, dept_name, section_id, defect_type, overdue_days, section_traffic_density, requested_window_start, requested_window_end, status)
JOIN public.departments d ON d.name = v.dept_name
ON CONFLICT (id) DO UPDATE SET
  asset_id = EXCLUDED.asset_id,
  department_id = EXCLUDED.department_id,
  section_id = EXCLUDED.section_id,
  defect_type = EXCLUDED.defect_type,
  overdue_days = EXCLUDED.overdue_days,
  section_traffic_density = EXCLUDED.section_traffic_density,
  requested_window_start = EXCLUDED.requested_window_start,
  requested_window_end = EXCLUDED.requested_window_end,
  status = EXCLUDED.status;
"""
        sb.rpc("exec_seed_sql", {"query_text": sql}).execute()
        if batch_num % 3 == 0 or batch_num == total_batches:
            print(f"  → Seeded Batch {batch_num}/{total_batches} ({min(i + BATCH_SIZE, total_reqs)}/{total_reqs} rows)")

    # Also seed the 2 demo test requests (REQ-TEST-0859A and REQ-TEST-3460B)
    print("\n  → Seeding special demo feature requests (REQ-TEST-0859A, REQ-TEST-3460B)...")
    demo_test_sql = """
INSERT INTO public.maintenance_requests (
  id, asset_id, department_id, section_id, defect_type, overdue_days, criticality, asset_stress_index, section_traffic_density, requested_window_start, requested_window_end, status
)
SELECT
  v.id, v.asset_id, d.id, v.section_id, v.defect_type, v.overdue_days, v.criticality, v.asset_stress_index, v.section_traffic_density, v.requested_window_start, v.requested_window_end, 'pending'
FROM (VALUES
  ('REQ-TEST-0859A', 'AST-ENG-001', 'Engineering', 'NDLS-GZB', 'track_defect', 12, 'Medium', 0.62, 48.0, '2026-10-15T02:00:00+00:00'::timestamptz, '2026-10-15T05:30:00+00:00'::timestamptz),
  ('REQ-TEST-3460B', 'AST-ENG-002', 'Engineering', 'NDLS-GZB', 'track_defect', 48, 'High', 0.77, 48.0, '2026-09-07T01:00:00+00:00'::timestamptz, '2026-09-07T02:30:00+00:00'::timestamptz)
) AS v(id, asset_id, dept_name, section_id, defect_type, overdue_days, criticality, asset_stress_index, section_traffic_density, requested_window_start, requested_window_end)
JOIN public.departments d ON d.name = v.dept_name
ON CONFLICT (id) DO UPDATE SET
  asset_id = EXCLUDED.asset_id,
  department_id = EXCLUDED.department_id,
  section_id = EXCLUDED.section_id,
  defect_type = EXCLUDED.defect_type,
  overdue_days = EXCLUDED.overdue_days,
  criticality = EXCLUDED.criticality,
  asset_stress_index = EXCLUDED.asset_stress_index,
  section_traffic_density = EXCLUDED.section_traffic_density,
  requested_window_start = EXCLUDED.requested_window_start,
  requested_window_end = EXCLUDED.requested_window_end,
  status = EXCLUDED.status;
"""
    sb.rpc("exec_seed_sql", {"query_text": demo_test_sql}).execute()
    print("✓ All 2,002 maintenance requests seeded.")

    # 3. Re-run bulk /score-all
    print("\n[Step 3a] Running ML /score-all across all requests...")
    score_res = ml_main.score_all_requests(force_all=True)
    print(f"✓ Total scored: {score_res['total_scored']} requests.")
    print(f"  Distribution: min={score_res['score_distribution']['min']}, avg={score_res['score_distribution']['average']}, max={score_res['score_distribution']['max']}")

    # 3b. Re-run /detect-conflicts
    print("\n[Step 3b] Running ML Conflict Detection (/detect-conflicts)...")
    conflict_res = detect_conflicts(update_supabase=True)
    print(f"✓ Conflict detection complete.")
    print(f"  Conflicts detected: {conflict_res['conflicts_count']} ({round(conflict_res['conflict_percentage'], 2)}%)")
    print(f"  Cross-department co-allocation pairs: {conflict_res['co_allocation_pairs_count']}")

    # 4. Generate fresh weekly proposed blocks
    print("\n[Step 4] Running initial weekly optimization to populate proposed blocks for demo...")
    opt_res = optimize_maintenance_blocks(
        horizon="weekly",
        start_date="2026-09-07",
        sb=sb,
        persist_to_db=True
    )
    print(f"✓ Optimization complete. Status: {opt_res['status']}")

    # 5. Final verification of tables
    print("\n==================================================")
    print("           POST-RESET TABLE VERIFICATIONS         ")
    print("==================================================")

    req_count = sb.table("maintenance_requests").select("id", count="exact", head=True).execute().count
    blocks_count = sb.table("blocks").select("id", count="exact", head=True).execute().count
    audit_count = sb.table("audit_log").select("id", count="exact", head=True).execute().count

    # Untouched tables verification
    assets_count = sb.table("assets").select("id", count="exact", head=True).execute().count
    sections_count = sb.table("corridor_sections").select("id", count="exact", head=True).execute().count
    timetable_count = sb.table("timetable_slots").select("id", count="exact", head=True).execute().count
    depts_count = sb.table("departments").select("id", count="exact", head=True).execute().count
    profiles_count = sb.table("users_profile").select("id", count="exact", head=True).execute().count

    print(f"Reset Tables:")
    print(f"  - maintenance_requests : {req_count} rows (Expected: exactly 2002, fully scored)")
    print(f"  - blocks               : {blocks_count} rows (Expected: 15 proposed blocks)")
    print(f"  - audit_log            : {audit_count} rows (Expected: 0)")

    print(f"\nUntouched Tables:")
    print(f"  - assets               : {assets_count} rows (Untouched)")
    print(f"  - corridor_sections    : {sections_count} rows (Untouched)")
    print(f"  - timetable_slots      : {timetable_count} rows (Untouched)")
    print(f"  - departments          : {depts_count} rows (Untouched)")
    print(f"  - users_profile        : {profiles_count} rows (Untouched)")

    print("\n✓ Demo reset script finished successfully!")

if __name__ == "__main__":
    reset_demo_data()
