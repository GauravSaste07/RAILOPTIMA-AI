import csv
import os
import sys
import json
import requests

# Ensure stdout supports unicode on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Supabase REST endpoint and key
SUPABASE_URL = "https://qjrpuzbmkontriuyylcl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcnB1emJta29udHJpdXl5bGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MzYyODUsImV4cCI6MjEwNDIxMjI4NX0.yym7zLjJ7gnM7_EPZ_JwgoTS7XBA51fvwks6ZOpg08I"
RPC_URL = f"{SUPABASE_URL}/rest/v1/rpc/exec_seed_sql"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

BATCH_SIZE = 200

def execute_sql(sql_query, description=""):
    try:
        response = requests.post(RPC_URL, headers=HEADERS, json={"query_text": sql_query}, timeout=60)
        if response.status_code != 200:
            print(f"\n[ERROR] HTTP {response.status_code} during {description}")
            print(f"Response: {response.text}")
            sys.exit(1)
        res_json = response.json()
        if not res_json.get("success", False):
            print(f"\n[ERROR] SQL Execution failed during {description}")
            print(f"Error detail: {json.dumps(res_json, indent=2)}")
            print(f"Query preview:\n{sql_query[:500]}...")
            sys.exit(1)
        return True
    except Exception as e:
        print(f"\n[EXCEPTION] Failed during {description}: {str(e)}")
        sys.exit(1)

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    processed_dir = os.path.join(base_dir, "data", "processed")

    assets_csv_path = os.path.join(processed_dir, "assets_seed.csv")
    timetable_csv_path = os.path.join(processed_dir, "corridor_timetable_seed.csv")
    requests_csv_path = os.path.join(processed_dir, "maintenance_requests_seed.csv")

    print("==================================================")
    print("           RailOpt AI Database Seeder             ")
    print("==================================================")

    # 1. Verify Departments
    print("\n[Step 1] Checking existing departments...")
    execute_sql("SELECT count(*) FROM public.departments;", "Check departments")
    print("✓ Departments verified.")

    # 2. Seed Assets in batches of <= 200 rows
    print("\n[Step 2] Seeding assets...")
    with open(assets_csv_path, mode="r", encoding="utf-8") as f:
        assets_rows = list(csv.DictReader(f))

    total_assets = len(assets_rows)
    print(f"Total assets to insert: {total_assets}")

    for i in range(0, total_assets, BATCH_SIZE):
        batch = assets_rows[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (total_assets + BATCH_SIZE - 1) // BATCH_SIZE

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
        execute_sql(sql, f"Assets Batch {batch_num}/{total_batches} (rows {i+1}-{i+len(batch)})")
        print(f"  → Assets Batch {batch_num}/{total_batches} ({len(batch)} rows) seeded.")

    # 3. Seed Corridor Sections
    print("\n[Step 3] Deriving and seeding corridor sections...")
    sections_metadata = {
        "NDLS-GZB": ("New Delhi - Ghaziabad", "Northern Railway (NR)"),
        "CSMT-KYN": ("Mumbai CSMT - Kalyan", "Central Railway (CR)"),
        "HWH-BWN": ("Howrah - Barddhaman", "Eastern Railway (ER)"),
        "SBC-JTJ": ("KSR Bengaluru - Jolarpettai", "South Western Railway (SWR)"),
        "MAS-AJJ": ("Chennai Central - Arakkonam", "Southern Railway (SR)"),
        "PUNE-DD": ("Pune - Daund", "Central Railway (CR)"),
        "ADI-BRC": ("Ahmedabad - Vadodara", "Western Railway (WR)"),
        "LKO-CNB": ("Lucknow - Kanpur", "Northern Railway (NR)"),
        "BPL-ET": ("Bhopal - Itarsi", "West Central Railway (WCR)"),
        "JP-AII": ("Jaipur - Ajmer", "North Western Railway (NWR)"),
        "ALD-MGS": ("Prayagraj - Pt. Deen Dayal Upadhyaya", "North Central Railway (NCR)"),
        "GHY-NJP": ("Guwahati - New Jalpaiguri", "Northeast Frontier Railway (NFR)"),
        "TVC-QLN": ("Thiruvananthapuram - Kollam", "Southern Railway (SR)"),
        "BZA-VSKP": ("Vijayawada - Visakhapatnam", "South Central Railway (SCR)"),
        "NGP-BSL": ("Nagpur - Bhusaval", "Central Railway (CR)")
    }

    # Extract unique sections from timetable and assets
    with open(timetable_csv_path, mode="r", encoding="utf-8") as f:
        tt_reader = csv.DictReader(f)
        unique_sections = sorted(list(set(r["section_id"] for r in tt_reader)))

    print(f"Discovered {len(unique_sections)} unique corridor sections: {', '.join(unique_sections)}")

    sec_vals = []
    for sec_id in unique_sections:
        name, zone = sections_metadata.get(sec_id, (f"Section {sec_id}", "Indian Railways"))
        sec_vals.append(f"('{sec_id}', '{name.replace("'", "''")}', '{zone.replace("'", "''")}')")

    sec_sql = f"""
INSERT INTO public.corridor_sections (id, section_name, zone)
VALUES {','.join(sec_vals)}
ON CONFLICT (id) DO UPDATE SET
  section_name = EXCLUDED.section_name,
  zone = EXCLUDED.zone;
"""
    execute_sql(sec_sql, "Corridor Sections Seed")
    print(f"✓ All {len(unique_sections)} corridor sections seeded.")

    # 4. Seed Timetable Slots in batches of <= 200 rows
    print("\n[Step 4] Seeding timetable slots (18,422 rows)...")
    with open(timetable_csv_path, mode="r", encoding="utf-8") as f:
        tt_rows = list(csv.DictReader(f))

    total_tt = len(tt_rows)
    total_tt_batches = (total_tt + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Total timetable slots to insert: {total_tt} across {total_tt_batches} batches (200 rows/batch)")

    for i in range(0, total_tt, BATCH_SIZE):
        batch = tt_rows[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1

        vals = []
        for r in batch:
            sid = r["slot_id"].replace("'", "''")
            sec_id = r["section_id"].replace("'", "''")
            stype = r["slot_type"]
            is_forecast = "true" if ("goods" in stype.lower() or "forecast" in stype.lower()) else "false"
            ttype = r["train_category"].replace("'", "''")
            sarr = r["start_time"].replace("'", "''")
            sdep = r["end_time"].replace("'", "''")
            conf = float(r["confidence"]) if r["confidence"] else 0.95
            tnum = f"TR-{sid}"
            vals.append(f"('{sid}', '{sec_id}', '{tnum}', '{ttype}', '{sarr}'::timestamptz, '{sdep}'::timestamptz, {is_forecast}, {conf})")

        sql = f"""
INSERT INTO public.timetable_slots (id, section_id, train_number, train_type, scheduled_arrival, scheduled_departure, is_forecast, confidence)
VALUES {','.join(vals)}
ON CONFLICT (id) DO UPDATE SET
  section_id = EXCLUDED.section_id,
  train_number = EXCLUDED.train_number,
  train_type = EXCLUDED.train_type,
  scheduled_arrival = EXCLUDED.scheduled_arrival,
  scheduled_departure = EXCLUDED.scheduled_departure,
  is_forecast = EXCLUDED.is_forecast,
  confidence = EXCLUDED.confidence;
"""
        execute_sql(sql, f"Timetable Slots Batch {batch_num}/{total_tt_batches} (rows {i+1}-{i+len(batch)})")
        if batch_num % 10 == 0 or batch_num == total_tt_batches:
            print(f"  → Timetable Slots: Progress {batch_num}/{total_tt_batches} batches completed ({min(i+BATCH_SIZE, total_tt)}/{total_tt} rows)")

    print("✓ All timetable slots seeded successfully.")

    # 5. Seed Maintenance Requests in batches of <= 200 rows
    print("\n[Step 5] Seeding maintenance requests (2,001 rows)...")
    with open(requests_csv_path, mode="r", encoding="utf-8") as f:
        req_rows = list(csv.DictReader(f))

    total_reqs = len(req_rows)
    total_req_batches = (total_reqs + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"Total maintenance requests to insert: {total_reqs} across {total_req_batches} batches (200 rows/batch)")

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
        execute_sql(sql, f"Maintenance Requests Batch {batch_num}/{total_req_batches} (rows {i+1}-{i+len(batch)})")
        print(f"  → Maintenance Requests Batch {batch_num}/{total_req_batches} ({len(batch)} rows) seeded.")

    print("✓ All maintenance requests seeded successfully.")
    print("\n Seeding completed!")

if __name__ == "__main__":
    main()
