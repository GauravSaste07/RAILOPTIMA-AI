import csv
import os
import sys
import json
import requests

SUPABASE_URL = "https://qjrpuzbmkontriuyylcl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcnB1emJta29udHJpdXl5bGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MzYyODUsImV4cCI6MjEwNDIxMjI4NX0.yym7zLjJ7gnM7_EPZ_JwgoTS7XBA51fvwks6ZOpg08I"
RPC_URL = f"{SUPABASE_URL}/rest/v1/rpc/exec_seed_sql"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def execute_sql(sql_query, description=""):
    response = requests.post(RPC_URL, headers=HEADERS, json={"query_text": sql_query}, timeout=60)
    if response.status_code != 200:
        print(f"Error {response.status_code}: {response.text}")
        sys.exit(1)
    res_json = response.json()
    if not res_json.get("success", False):
        print(f"SQL Error: {json.dumps(res_json, indent=2)}")
        sys.exit(1)
    return True

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_csv_path = os.path.join(base_dir, "data", "processed", "assets_seed.csv")

    with open(assets_csv_path, mode="r", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    print(f"Seeding {len(rows)} assets into Supabase...")
    batch_size = 100
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        vals = []
        for r in batch:
            aid = r["asset_id"].replace("'", "''")
            dept = r["department"].replace("'", "''")
            sec = r["section_id"].replace("'", "''")
            atype = r["type"].replace("'", "''")
            crit = r["criticality"].replace("'", "''")
            vals.append(f"('{aid}', '{dept}', '{sec}', '{atype}', '{crit}')")

        sql = f"""
INSERT INTO public.assets (id, department_id, section_id, type, criticality)
SELECT v.asset_id, d.id, v.section_id, v.type, v.criticality
FROM (VALUES {','.join(vals)}) AS v(asset_id, dept_name, section_id, type, criticality)
JOIN public.departments d ON d.name = v.dept_name
ON CONFLICT (id) DO UPDATE SET
  department_id = EXCLUDED.department_id,
  section_id = EXCLUDED.section_id,
  type = EXCLUDED.type,
  criticality = EXCLUDED.criticality;
"""
        execute_sql(sql, f"Batch {i // batch_size + 1}")
        print(f"  [OK] Batch {i // batch_size + 1} ({len(batch)} assets) successfully seeded.")

    print("\nAll 180 assets successfully upserted into database!")

if __name__ == "__main__":
    main()
