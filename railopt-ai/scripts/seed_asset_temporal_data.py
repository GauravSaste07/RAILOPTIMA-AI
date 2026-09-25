"""
Seed the 4 new temporal columns into the Supabase assets table.
Matches assets by (section_id + type) since asset_id numbering differs between DB and CSV.
"""

import os, csv, sys, random
from datetime import date, timedelta
sys.stdout.reconfigure(encoding="utf-8")
import dotenv
from supabase import create_client

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, "ml-service", ".env")
dotenv.load_dotenv(env_path)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# -----------------------------------------------------------------------
# Load CSV lookup: (section_id, type) → temporal data
# -----------------------------------------------------------------------
assets_csv = os.path.join(base_dir, "data", "processed", "assets_seed.csv")
csv_lookup = {}
with open(assets_csv, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        key = (row["section_id"].strip(), row["type"].strip())
        csv_lookup[key] = {
            "installation_year":       int(row["installation_year"]),
            "last_inspection_date":    row["last_inspection_date"],
            "failure_count_last_year": int(row["failure_count_last_year"]),
            "cumulative_mgt_approx":   float(row["cumulative_mgt_approx"]),
        }

print(f"CSV lookup entries: {len(csv_lookup)}")

# -----------------------------------------------------------------------
# Fetch all DB assets
# -----------------------------------------------------------------------
db_res = sb.table("assets").select("id, section_id, type").execute()
db_assets = db_res.data or []
print(f"DB assets: {len(db_assets)}")

# -----------------------------------------------------------------------
# Department inspection intervals for fallback generation
# -----------------------------------------------------------------------
RDSO_INTERVALS = {"Engineering": 30, "Signal & Telecom": 30, "Traction Distribution": 90}
TODAY = date.today()
random.seed(42)

def generate_fallback(asset_type: str):
    """Generate realistic temporal data when CSV match not found."""
    age_years = random.randint(3, 20)
    dept = "Engineering"
    if "Interlocking" in asset_type or "Axle" in asset_type or "Point" in asset_type or "Circuit" in asset_type:
        dept = "Signal & Telecom"
    elif "OHE" in asset_type or "Catenary" in asset_type or "Substation" in asset_type or "Insulator" in asset_type or "Cantilever" in asset_type:
        dept = "Traction Distribution"
    interval = RDSO_INTERVALS.get(dept, 30)
    days_overdue = random.randint(0, int(interval * 0.7))
    last_insp = TODAY - timedelta(days=interval + days_overdue)
    failures = random.randint(0, 4)
    mgt = round(age_years * 12 * random.uniform(0.8, 1.8), 1)
    return {
        "installation_year":       TODAY.year - age_years,
        "last_inspection_date":    last_insp.isoformat(),
        "failure_count_last_year": failures,
        "cumulative_mgt_approx":   mgt,
    }

# -----------------------------------------------------------------------
# Update each DB asset
# -----------------------------------------------------------------------
updated_matched = 0
updated_fallback = 0
errors = 0

for asset in db_assets:
    asset_id = asset["id"]
    section_id = asset.get("section_id", "")
    asset_type = asset.get("type", "")

    key = (section_id.strip(), asset_type.strip())
    if key in csv_lookup:
        payload = csv_lookup[key]
        updated_matched += 1
    else:
        payload = generate_fallback(asset_type)
        updated_fallback += 1

    try:
        sb.table("assets").update(payload).eq("id", asset_id).execute()
    except Exception as e:
        print(f"  ERROR {asset_id}: {e}")
        errors += 1

print(f"\n✅ Done!")
print(f"  Matched from CSV:      {updated_matched}")
print(f"  Generated (fallback):  {updated_fallback}")
print(f"  Errors:                {errors}")

# Verify
print("\nVerification sample (5 rows):")
sample = sb.table("assets").select(
    "id, section_id, type, installation_year, last_inspection_date, failure_count_last_year, cumulative_mgt_approx"
).limit(5).execute()
for r in (sample.data or []):
    print(f"  {r['id']} | {r['section_id']} | {r['type'][:25]:<25} | year={r['installation_year']} | last_insp={r['last_inspection_date']} | failures={r['failure_count_last_year']} | MGT={r['cumulative_mgt_approx']}")

# Check for any remaining nulls
null_check = sb.table("assets").select("id").is_("installation_year", "null").execute()
print(f"\nAssets still with NULL installation_year: {len(null_check.data or [])}")
