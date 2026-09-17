import csv
import os
import random
from datetime import date, timedelta

# Fixed sections and departments as specified
SECTIONS = [
    "NDLS-GZB", "CSMT-KYN", "HWH-BWN", "SBC-JTJ", "MAS-AJJ",
    "PUNE-DD", "ADI-BRC", "LKO-CNB", "BPL-ET", "JP-AII",
    "ALD-MGS", "GHY-NJP", "TVC-QLN", "BZA-VSKP", "NGP-BSL"
]

DEPARTMENTS = [
    "Engineering",
    "Signal & Telecom",
    "Traction Distribution"
]

DEPARTMENT_ASSET_TYPES = {
    "Engineering": [
        ("Track Segment", 0.75),
        ("Turnout Switch", 0.85),
        ("Bridge Structure", 0.90),
        ("Level Crossing Track", 0.65)
    ],
    "Signal & Telecom": [
        ("Electronic Interlocking", 0.95),
        ("Point Machine", 0.85),
        ("Digital Axle Counter", 0.80),
        ("Track Circuit", 0.70)
    ],
    "Traction Distribution": [
        ("OHE Catenary Wire", 0.85),
        ("Traction Substation", 0.95),
        ("Section Insulator", 0.75),
        ("Cantilever Assembly", 0.70)
    ]
}

# RDSO standard inspection intervals by department (days)
INSPECTION_INTERVALS_DAYS = {
    "Engineering": 30,           # Monthly SSE inspection
    "Signal & Telecom": 30,      # Monthly interlocking test
    "Traction Distribution": 90  # Quarterly OHE inspection
}

# Section-level traffic multipliers for MGT estimation
SECTION_MGT_DAILY = {
    "NDLS-GZB": 1.8,   # High density — ~1.8 MGT/month estimate
    "CSMT-KYN": 1.9,
    "HWH-BWN": 1.7,
    "ALD-MGS": 1.5,
    "MAS-AJJ": 1.4,
    "ADI-BRC": 1.3,
    "BZA-VSKP": 1.2,
    "BPL-ET": 1.2,
    "PUNE-DD": 1.1,
    "LKO-CNB": 1.1,
    "SBC-JTJ": 1.0,
    "NGP-BSL": 1.0,
    "JP-AII": 0.85,
    "TVC-QLN": 0.85,
    "GHY-NJP": 0.75
}

TODAY = date(2026, 9, 14)

def generate_assets():
    random.seed(42)
    output_dir = os.path.join(os.path.dirname(__file__), "processed")
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "assets_seed.csv")

    assets = []
    existing_keys = set()
    asset_counter = 1

    # Generate all asset types for every section and department
    for section in SECTIONS:
        for dept in DEPARTMENTS:
            types_available = DEPARTMENT_ASSET_TYPES[dept]
            for asset_type, base_crit in types_available:
                if (section, dept, asset_type) in existing_keys:
                    continue

                crit_val = round(min(1.0, max(0.1, base_crit + random.uniform(-0.05, 0.05))), 2)
                dept_code = "ENG" if dept == "Engineering" else ("SNT" if dept == "Signal & Telecom" else "TRD")
                asset_id = f"AST-{dept_code}-{asset_counter:03d}"

                # --- NEW: Temporal fields for dynamic stress computation ---

                # Installation year: high-criticality assets tend to be newer replacements
                age_years = random.randint(2, 25) if base_crit < 0.85 else random.randint(1, 15)
                installation_year = TODAY.year - age_years

                # Last inspection: somewhat overdue relative to RDSO schedule
                interval_days = INSPECTION_INTERVALS_DAYS[dept]
                days_overdue_on_inspection = random.randint(-10, int(interval_days * 0.8))
                last_inspection_date = (TODAY - timedelta(days=interval_days + days_overdue_on_inspection)).isoformat()

                # Failure count in last year: higher for older or high-crit assets
                failure_base = max(0, age_years // 5)
                failure_count_last_year = random.randint(failure_base, failure_base + 4)

                # Cumulative MGT approximation: age * daily_mgt * 30 days/month
                mgt_per_month = SECTION_MGT_DAILY.get(section, 1.0)
                cumulative_mgt_approx = round(age_years * 12 * mgt_per_month, 1)

                assets.append({
                    "asset_id": asset_id,
                    "department": dept,
                    "section_id": section,
                    "type": asset_type,
                    "criticality": crit_val,
                    "installation_year": installation_year,
                    "last_inspection_date": last_inspection_date,
                    "failure_count_last_year": failure_count_last_year,
                    "cumulative_mgt_approx": cumulative_mgt_approx
                })
                existing_keys.add((section, dept, asset_type))
                asset_counter += 1

    fieldnames = [
        "asset_id", "department", "section_id", "type", "criticality",
        "installation_year", "last_inspection_date", "failure_count_last_year",
        "cumulative_mgt_approx"
    ]
    with open(output_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(assets)

    print(f"Generated {len(assets)} assets into {output_file}")
    print(f"New columns added: installation_year, last_inspection_date, failure_count_last_year, cumulative_mgt_approx")
    print("\nSample row:")
    if assets:
        for k, v in list(assets[0].items()):
            print(f"  {k}: {v}")


if __name__ == "__main__":
    generate_assets()
