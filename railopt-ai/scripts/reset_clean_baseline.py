"""
RailOpt AI - Fast Clean Baseline Reset Utility (One-Off Cleanup)
================================================================
Lightweight utility for rapid in-place status resets without re-reading
the CSV source files. 

NOTE: For full official re-seeding from source data, use the canonical script:
      scripts/reset_demo_data.py
"""

import os
import sys
import json

# Ensure stdout supports unicode on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ml_dir = os.path.join(base_dir, "ml-service")
sys.path.insert(0, ml_dir)

from conflict_detection import detect_conflicts, get_supabase_client, fetch_all_maintenance_requests
from optimizer import optimize_maintenance_blocks
import main as ml_main

def main():
    print("==================================================")
    print("      RailOpt AI - Clean Baseline Reset Pipeline   ")
    print("==================================================")

    sb = get_supabase_client()

    # Step 1: Delete the 3 extra Engineering test requests
    print("\n[Step 1] Ensuring 3 extra test requests are deleted...")
    sb.table("maintenance_requests").delete().in_("id", ["REQ-913372", "REQ-239522", "REQ-321120"]).execute()
    print("✓ Deleted extra rows.")

    # Step 2: Clear foreign keys & reset non-test maintenance requests to 'pending'
    print("\n[Step 2] Resetting non-test maintenance requests to clean 'pending' state...")
    reset_sql = """
    UPDATE public.maintenance_requests
    SET status = 'pending',
        conflict_flag = false,
        conflicting_with = null,
        conflicting_approved_block_id = null;
    """
    sb.rpc("exec_seed_sql", {"query_text": reset_sql}).execute()
    print("✓ All standard maintenance requests reset to 'pending' state.")

    # Step 3: Delete ALL rows from blocks
    print("\n[Step 3] Deleting ALL rows from blocks...")
    sb.table("blocks").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("✓ Cleaned blocks table.")

    # Step 4: Delete ALL rows from audit_log
    print("\n[Step 4] Deleting ALL rows from audit_log...")
    sb.table("audit_log").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("✓ Cleaned audit_log table.")

    # Step 5a: Run ML Scoring (score-all force_all=True)
    print("\n[Step 5a] Running XGBoost /score-all across all 2,002 requests...")
    score_result = ml_main.score_all_requests(force_all=True)
    print(f"✓ Total requests scored: {score_result['total_scored']}")
    print(f"  Score stats: min={score_result['score_distribution']['min']}, avg={score_result['score_distribution']['average']}, max={score_result['score_distribution']['max']}")

    # Step 5b: Run ML Conflict Detection
    print("\n[Step 5b] Running ML Conflict Detection (/detect-conflicts)...")
    conflict_result = detect_conflicts(update_supabase=True)
    print(f"✓ Conflict detection completed.")
    print(f"  Total requests analyzed: {conflict_result['total_requests']}")
    print(f"  Conflicts detected: {conflict_result['conflicts_count']} ({round(conflict_result['conflict_percentage'], 2)}%)")
    print(f"  Cross-department co-allocation pairs: {conflict_result['co_allocation_pairs_count']}")

    # Step 6: Run ONE clean optimization run
    print("\n[Step 6] Running CP-SAT Optimizer (horizon=weekly, start_date=2026-09-07)...")
    opt_result = optimize_maintenance_blocks(
        horizon="weekly",
        start_date="2026-09-07",
        sb=sb,
        persist_to_db=True
    )
    print(f"✓ Optimization completed with status: {opt_result['status']}")
    print(f"  Total proposed blocks: {len(opt_result.get('proposed_blocks', []))}")
    print(f"  Total requests scheduled: {opt_result.get('total_requests_scheduled', 0)}")

    # Step 7: Final verification & row counts
    print("\n==================================================")
    print("               FINAL VERIFICATION COUNTS          ")
    print("==================================================")

    req_count_res = sb.table("maintenance_requests").select("id", count="exact", head=True).execute()
    blocks_res = sb.table("blocks").select("id, status, section_id, request_ids", count="exact").execute()
    audit_res = sb.table("audit_log").select("id", count="exact", head=True).execute()

    print(f"maintenance_requests row count: {req_count_res.count} (Expected: exactly 2002)")
    print(f"blocks row count: {blocks_res.count} (Expected: ~10-15 proposed blocks)")
    print(f"audit_log row count: {audit_res.count} (Expected: exactly 0)")

    # Status distribution of maintenance requests
    all_reqs = fetch_all_maintenance_requests(sb)
    status_counts = {}
    conflict_counts = {"true": 0, "false": 0}
    for r in all_reqs:
        st = r.get("status") or "pending"
        status_counts[st] = status_counts.get(st, 0) + 1
        if r.get("conflict_flag"):
            conflict_counts["true"] += 1
        else:
            conflict_counts["false"] += 1

    print("\nmaintenance_requests status breakdown:")
    for st, count in sorted(status_counts.items()):
        print(f"  - {st}: {count}")

    print(f"\nmaintenance_requests conflict breakdown:")
    print(f"  - conflict_flag = true: {conflict_counts['true']}")
    print(f"  - conflict_flag = false: {conflict_counts['false']}")

    print("\nblocks summary:")
    block_status_counts = {}
    for b in (blocks_res.data or []):
        st = b.get("status") or "unknown"
        block_status_counts[st] = block_status_counts.get(st, 0) + 1
        print(f"  - Block {b['id'][:8]}... | Section: {b['section_id']} | Status: {b['status']} | Requests: {len(b.get('request_ids') or [])} {b.get('request_ids')}")

    print("\nblocks status breakdown:")
    for st, count in sorted(block_status_counts.items()):
        print(f"  - {st}: {count}")

    print("\n✓ Baseline reset completed successfully!")

if __name__ == "__main__":
    main()
