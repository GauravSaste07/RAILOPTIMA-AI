import os
import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

SECTIONS = [
    "NDLS-GZB", "CSMT-KYN", "HWH-BWN", "SBC-JTJ", "MAS-AJJ",
    "PUNE-DD", "ADI-BRC", "LKO-CNB", "BPL-ET", "JP-AII",
    "ALD-MGS", "GHY-NJP", "TVC-QLN", "BZA-VSKP", "NGP-BSL"
]

# Base relative traffic multiplier for Indian Railways sections
SECTION_TRAFFIC_WEIGHTS = {
    "NDLS-GZB": 1.4,  # High density Delhi suburban/trunk
    "CSMT-KYN": 1.45, # High density Mumbai suburban/trunk
    "HWH-BWN": 1.35,  # High density Howrah trunk
    "ALD-MGS": 1.3,   # Busy Northern/Eastern corridor
    "MAS-AJJ": 1.25,  # Chennai trunk
    "ADI-BRC": 1.15,  # Western trunk
    "BZA-VSKP": 1.1,  # East Coast trunk
    "BPL-ET": 1.1,    # Central trunk
    "PUNE-DD": 1.0,   # Central route
    "LKO-CNB": 1.05,  # Northern route
    "SBC-JTJ": 1.0,   # Southern route
    "NGP-BSL": 1.0,   # Central route
    "JP-AII": 0.85,   # North Western route
    "TVC-QLN": 0.85,  # Southern coastal route
    "GHY-NJP": 0.8    # Northeast frontier route
}

def generate_corridor_timetable():
    random.seed(42)
    np.random.seed(42)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    processed_dir = os.path.join(base_dir, "processed")
    os.makedirs(processed_dir, exist_ok=True)

    timetable_output_path = os.path.join(processed_dir, "corridor_timetable_seed.csv")
    density_output_path = os.path.join(processed_dir, "section_density.csv")
    requests_path = os.path.join(processed_dir, "maintenance_requests_seed.csv")

    start_date = datetime(2026, 9, 7, 0, 0, 0)
    horizon_days = 30

    timetable_records = []
    slot_id_counter = 1

    daily_counts = {sec: {"passenger": 0, "goods": 0} for sec in SECTIONS}

    for section in SECTIONS:
        weight = SECTION_TRAFFIC_WEIGHTS[section]

        # Generate slots across the 30-day horizon
        for day in range(horizon_days):
            current_day_start = start_date + timedelta(days=day)

            # 1. Passenger Timetable Slots (high confidence, frequent daytime 06:00-22:00, sparser at night)
            # Daytime slots
            current_time = current_day_start + timedelta(hours=6)
            daytime_end = current_day_start + timedelta(hours=22)
            
            while current_time < daytime_end:
                # Interval between 20-40 minutes scaled by section weight
                interval_mins = int(random.randint(20, 40) / weight)
                slot_duration_mins = random.randint(15, 25)
                slot_end = current_time + timedelta(minutes=slot_duration_mins)

                timetable_records.append({
                    "slot_id": f"SLOT-{slot_id_counter:06d}",
                    "section_id": section,
                    "slot_type": "passenger_timetable",
                    "train_category": random.choice(["Express", "Superfast", "Passenger", "Vande Bharat"]),
                    "start_time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "end_time": slot_end.strftime("%Y-%m-%d %H:%M:%S"),
                    "confidence": 0.98
                })
                slot_id_counter += 1
                daily_counts[section]["passenger"] += 1
                current_time += timedelta(minutes=interval_mins + slot_duration_mins)

            # Nighttime slots (22:00 to 06:00 next day)
            night_start = current_day_start + timedelta(hours=22)
            night_end = current_day_start + timedelta(days=1, hours=6)
            current_time = night_start

            while current_time < night_end:
                interval_mins = int(random.randint(60, 100) / weight)
                slot_duration_mins = random.randint(15, 25)
                slot_end = current_time + timedelta(minutes=slot_duration_mins)

                timetable_records.append({
                    "slot_id": f"SLOT-{slot_id_counter:06d}",
                    "section_id": section,
                    "slot_type": "passenger_timetable",
                    "train_category": random.choice(["Mail/Express", "Special Express"]),
                    "start_time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "end_time": slot_end.strftime("%Y-%m-%d %H:%M:%S"),
                    "confidence": 0.95
                })
                slot_id_counter += 1
                daily_counts[section]["passenger"] += 1
                current_time += timedelta(minutes=interval_mins + slot_duration_mins)

            # 2. Goods Forecast Slots (FOIS freight forecast: lower confidence, denser at night 22:00-06:00)
            # Nighttime freight
            current_time = night_start
            while current_time < night_end:
                interval_mins = int(random.randint(35, 65) / weight)
                slot_duration_mins = random.randint(25, 40)
                slot_end = current_time + timedelta(minutes=slot_duration_mins)

                timetable_records.append({
                    "slot_id": f"SLOT-{slot_id_counter:06d}",
                    "section_id": section,
                    "slot_type": "goods_forecast",
                    "train_category": random.choice(["Container Freight", "Coal/Mineral Rake", "BoxN Freight", "Auto Rake"]),
                    "start_time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "end_time": slot_end.strftime("%Y-%m-%d %H:%M:%S"),
                    "confidence": round(random.uniform(0.70, 0.85), 2)
                })
                slot_id_counter += 1
                daily_counts[section]["goods"] += 1
                current_time += timedelta(minutes=interval_mins + slot_duration_mins)

            # Daytime freight (sparser)
            current_time = current_day_start + timedelta(hours=6)
            while current_time < daytime_end:
                interval_mins = int(random.randint(80, 150) / weight)
                slot_duration_mins = random.randint(25, 40)
                slot_end = current_time + timedelta(minutes=slot_duration_mins)

                timetable_records.append({
                    "slot_id": f"SLOT-{slot_id_counter:06d}",
                    "section_id": section,
                    "slot_type": "goods_forecast",
                    "train_category": random.choice(["Goods Freight", "Parcel Cargo"]),
                    "start_time": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "end_time": slot_end.strftime("%Y-%m-%d %H:%M:%S"),
                    "confidence": round(random.uniform(0.65, 0.80), 2)
                })
                slot_id_counter += 1
                daily_counts[section]["goods"] += 1
                current_time += timedelta(minutes=interval_mins + slot_duration_mins)

    # Save corridor timetable seed
    timetable_df = pd.DataFrame(timetable_records)
    timetable_df.to_csv(timetable_output_path, index=False)
    print(f"Saved {len(timetable_df)} corridor timetable slots to {timetable_output_path}")

    # 3. Compute Section Traffic Density
    density_records = []
    for section in SECTIONS:
        avg_daily_pax = int(round(daily_counts[section]["passenger"] / horizon_days))
        avg_daily_goods = int(round(daily_counts[section]["goods"] / horizon_days))
        # Total daily train movements through that section (passenger + goods combined)
        density_records.append({
            "section_id": section,
            "daily_passenger_slots": avg_daily_pax,
            "daily_goods_slots": avg_daily_goods,
            "section_traffic_density": avg_daily_pax + avg_daily_goods
        })

    density_df = pd.DataFrame(density_records)
    density_df.to_csv(density_output_path, index=False)
    print(f"Saved {len(density_df)} section density records to {density_output_path}")

    # 4. Merge section_traffic_density into maintenance_requests_seed.csv
    if os.path.exists(requests_path):
        requests_df = pd.read_csv(requests_path)
        # Drop existing section_traffic_density if present before merge
        if "section_traffic_density" in requests_df.columns:
            requests_df = requests_df.drop(columns=["section_traffic_density"])
        
        merged_df = requests_df.merge(
            density_df[["section_id", "section_traffic_density"]],
            on="section_id",
            how="left"
        )
        merged_df.to_csv(requests_path, index=False)
        print(f"Merged section_traffic_density into {requests_path} ({len(merged_df)} rows)")

    # Print summary output
    print("\n--- Summary Outputs ---")
    print(f"\n1. Corridor Timetable ({len(timetable_df)} rows):")
    print(timetable_df.head(5).to_string())

    print(f"\n2. Section Density ({len(density_df)} rows):")
    print(density_df.head(5).to_string())

    if os.path.exists(requests_path):
        updated_req_df = pd.read_csv(requests_path)
        print(f"\n3. Updated Maintenance Requests ({len(updated_req_df)} rows):")
        print(f"Columns: {list(updated_req_df.columns)}")
        print(updated_req_df.head(5).to_string())

if __name__ == "__main__":
    generate_corridor_timetable()
