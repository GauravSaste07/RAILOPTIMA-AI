import os
import sys

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ml_dir = os.path.join(base_dir, "ml-service")
sys.path.insert(0, ml_dir)

from conflict_detection import get_supabase_client

def delete_test_requests():
    sb = get_supabase_client()
    
    # 1. Find all requests with ID matching REQ-TEST
    res = sb.table("maintenance_requests").select("id, section_id, asset_id").ilike("id", "REQ-TEST%").execute()
    data = res.data or []
    print(f"Found {len(data)} test requests matching 'REQ-TEST%':")
    for r in data:
        print(f"  - {r['id']} ({r.get('section_id')}, {r.get('asset_id')})")
        
    if not data:
        print("No REQ-TEST requests found in database.")
        return

    test_ids = [r["id"] for r in data]

    # 2. Check if any blocks reference these test IDs in request_ids array or conflicting references
    # Clear any conflicting_with references pointing to these test IDs
    for tid in test_ids:
        sb.table("maintenance_requests").update({"conflicting_with": None, "conflict_flag": False}).eq("conflicting_with", tid).execute()
        
    # 3. Delete the test requests from maintenance_requests
    del_res = sb.table("maintenance_requests").delete().in_("id", test_ids).execute()
    print(f"Successfully deleted {len(test_ids)} test request(s) from database.")

if __name__ == "__main__":
    delete_test_requests()
