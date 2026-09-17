import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date

def compute_asset_stress_index(row):
    """
    Compute a dynamic, railway-domain-accurate asset_stress_index (0.0 - 1.0)
    based on:
      - Asset age (installation_year)
      - Days since last inspection vs RDSO schedule
      - Failure count in last year
      - Cumulative MGT (track load proxy)
    Replaces the hardcoded 0.65 constant.
    """
    today = datetime(2026, 9, 14)

    # Age component (0-1): assets older than 25 years → 1.0 stress
    age_years = today.year - int(row.get("installation_year", today.year - 10))
    age_component = min(1.0, age_years / 25.0)

    # Inspection overdue component (0-1)
    last_insp_str = str(row.get("last_inspection_date", ""))
    dept = str(row.get("department", "Engineering"))
    # RDSO intervals per dept
    rdso_interval = {"Engineering": 30, "Signal & Telecom": 30, "Traction Distribution": 90}
    interval_days = rdso_interval.get(dept, 30)
    try:
        last_insp = datetime.strptime(last_insp_str[:10], "%Y-%m-%d")
        days_since_insp = (today - last_insp).days
    except Exception:
        days_since_insp = interval_days
    insp_component = min(1.0, days_since_insp / (interval_days * 2.0))

    # Failure history component (0-1): ≥ 5 failures/year → 1.0
    failures = int(row.get("failure_count_last_year", 0))
    failure_component = min(1.0, failures / 5.0)

    # MGT component (0-1): ≥ 500 MGT cumulative → 1.0
    mgt = float(row.get("cumulative_mgt_approx", 50.0))
    mgt_component = min(1.0, mgt / 500.0)

    # Weighted combination (matches domain knowledge priorities)
    stress = (
        0.30 * age_component +
        0.35 * insp_component +
        0.20 * failure_component +
        0.15 * mgt_component
    )
    return round(min(1.0, max(0.0, stress)), 3)


def is_monsoon_month(dt: datetime) -> int:
    """
    Returns 1 if the date falls in Indian Railways monsoon season (June–September),
    else 0. Monsoon dramatically increases track and OHE defect rates.
    """
    return 1 if dt.month in (6, 7, 8, 9) else 0


def compute_days_since_last_inspection(row, request_start: datetime) -> int:
    """Compute days between last inspection date and the maintenance request date."""
    last_insp_str = str(row.get("last_inspection_date", ""))
    try:
        last_insp = datetime.strptime(last_insp_str[:10], "%Y-%m-%d")
        return max(0, (request_start - last_insp).days)
    except Exception:
        return 30  # fallback default


def generate_synthetic_railway_data():
    np.random.seed(42)
    random.seed(42)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    raw_csv_path = os.path.join(base_dir, "raw", "ai4i2020.csv")
    assets_csv_path = os.path.join(base_dir, "processed", "assets_seed.csv")
    output_csv_path = os.path.join(base_dir, "processed", "maintenance_requests_seed.csv")

    if not os.path.exists(raw_csv_path):
        raise FileNotFoundError(f"Missing {raw_csv_path}")
    if not os.path.exists(assets_csv_path):
        raise FileNotFoundError(f"Missing {assets_csv_path}")

    # 1. Load data
    ai4i_df = pd.read_csv(raw_csv_path)
    assets_df = pd.read_csv(assets_csv_path)

    # Group assets by department for quick reference
    dept_assets = {
        dept: assets_df[assets_df["department"] == dept].to_dict("records")
        for dept in ["Engineering", "Signal & Telecom", "Traction Distribution"]
    }

    # Ensure good representation of failure cases: 339 failure + sample non-failure → 2000 rows
    failure_df = ai4i_df[ai4i_df["Machine failure"] == 1]
    non_failure_df = ai4i_df[ai4i_df["Machine failure"] == 0].sample(
        n=2000 - len(failure_df), random_state=42
    )
    sample_df = pd.concat([failure_df, non_failure_df]).sample(
        frac=1.0, random_state=42
    ).reset_index(drop=True)

    # 2. Remappings
    type_map = {"L": "Low", "M": "Medium", "H": "High"}
    sample_df["criticality"] = sample_df["Type"].map(type_map).fillna("Medium")

    # Overdue days scaled to 0-90 from tool wear data
    max_tool_wear = ai4i_df["Tool wear [min]"].max()
    sample_df["overdue_days"] = ((sample_df["Tool wear [min]"] / max_tool_wear) * 90).round().astype(int)

    # Defect type and Department mapping
    departments = []
    defect_types = []
    depts_list = ["Engineering", "Signal & Telecom", "Traction Distribution"]
    dept_routine_defects = {
        "Engineering": "track_defect",
        "Signal & Telecom": "signal_fault",
        "Traction Distribution": "traction_fault"
    }

    for _, row in sample_df.iterrows():
        if row["TWF"] == 1:
            departments.append("Engineering")
            defect_types.append("track_defect")
        elif row["HDF"] == 1 or row["PWF"] == 1:
            departments.append("Signal & Telecom")
            defect_types.append("signal_fault")
        elif row["OSF"] == 1 or row["RNF"] == 1:
            departments.append("Traction Distribution")
            defect_types.append("traction_fault")
        else:
            d = random.choice(depts_list)
            departments.append(d)
            defect_types.append(dept_routine_defects[d])

    sample_df["department"] = departments
    sample_df["defect_type"] = defect_types
    sample_df["is_critical_defect"] = sample_df["Machine failure"] == 1

    # 3. Asset, section, and requested windows
    asset_ids = []
    section_ids = []
    start_times = []
    end_times = []
    asset_stress_indices = []
    is_monsoon_flags = []
    days_since_inspection_vals = []
    failure_count_vals = []

    base_time = datetime(2026, 9, 7, 0, 0, 0)

    for i, row in sample_df.iterrows():
        dept = row["department"]
        matching_assets = dept_assets[dept]
        chosen_asset = random.choice(matching_assets)

        asset_ids.append(chosen_asset["asset_id"])
        section_ids.append(chosen_asset["section_id"])

        # Random window within next 30 days
        day_offset = random.randint(0, 29)
        hour_start = random.choice([0, 2, 4, 11, 13, 15, 22, 23])
        duration_hours = random.choice([2, 3, 4, 5])
        req_start = base_time + timedelta(days=day_offset, hours=hour_start)
        req_end = req_start + timedelta(hours=duration_hours)
        start_times.append(req_start.strftime("%Y-%m-%d %H:%M:%S"))
        end_times.append(req_end.strftime("%Y-%m-%d %H:%M:%S"))

        # --- IMPROVED: Dynamic feature computation from asset temporal data ---

        # 1. asset_stress_index — computed from real asset data, NOT hardcoded
        stress = compute_asset_stress_index(chosen_asset)
        # Apply small random noise per request (same asset can have slightly different readings)
        stress_noised = round(min(1.0, max(0.0, stress + random.uniform(-0.05, 0.05))), 3)
        asset_stress_indices.append(stress_noised)

        # 2. is_monsoon — binary: June-Sept = 1 (Indian Railways monsoon spike)
        is_monsoon_flags.append(is_monsoon_month(req_start))

        # 3. days_since_last_inspection — real domain metric
        dsi = compute_days_since_last_inspection(chosen_asset, req_start)
        days_since_inspection_vals.append(dsi)

        # 4. failure_count_last_year — from asset history
        failure_count_vals.append(int(chosen_asset.get("failure_count_last_year", 0)))

    sample_df["asset_id"] = asset_ids
    sample_df["section_id"] = section_ids
    sample_df["requested_window_start"] = start_times
    sample_df["requested_window_end"] = end_times

    # New computed features replacing hardcoded constants
    sample_df["asset_stress_index"] = asset_stress_indices
    sample_df["is_monsoon"] = is_monsoon_flags
    sample_df["days_since_last_inspection"] = days_since_inspection_vals
    sample_df["failure_count_last_year"] = failure_count_vals

    # Final columns ordering
    sample_df["request_id"] = [f"REQ-{i+1:05d}" for i in range(len(sample_df))]

    final_cols = [
        "request_id",
        "asset_id",
        "department",
        "section_id",
        "defect_type",
        "criticality",
        "overdue_days",
        "asset_stress_index",
        "is_monsoon",
        "days_since_last_inspection",
        "failure_count_last_year",
        "is_critical_defect",
        "requested_window_start",
        "requested_window_end"
    ]

    output_df = sample_df[final_cols]
    output_df.to_csv(output_csv_path, index=False)

    print(f"Generated {len(output_df)} maintenance requests saved to {output_csv_path}")
    print("\nColumns:", list(output_df.columns))
    print("\nFeature summary (new dynamic features):")
    print(f"  asset_stress_index  : min={output_df['asset_stress_index'].min():.3f}, "
          f"max={output_df['asset_stress_index'].max():.3f}, "
          f"mean={output_df['asset_stress_index'].mean():.3f}")
    print(f"  is_monsoon          : {output_df['is_monsoon'].sum()} monsoon-season requests "
          f"({output_df['is_monsoon'].mean()*100:.1f}%)")
    print(f"  days_since_insp     : min={output_df['days_since_last_inspection'].min()}, "
          f"max={output_df['days_since_last_inspection'].max()}, "
          f"mean={output_df['days_since_last_inspection'].mean():.1f}")
    print(f"  failure_count_yr    : min={output_df['failure_count_last_year'].min()}, "
          f"max={output_df['failure_count_last_year'].max()}, "
          f"mean={output_df['failure_count_last_year'].mean():.2f}")
    print("\nFirst 3 Rows:")
    print(output_df.head(3).to_string())


if __name__ == "__main__":
    generate_synthetic_railway_data()
