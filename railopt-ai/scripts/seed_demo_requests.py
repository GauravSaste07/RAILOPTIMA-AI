import os
import sys
from datetime import datetime, timezone, timedelta

# Dynamic cross-platform path resolution to ml-service
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ML_SERVICE_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "ml-service"))
if ML_SERVICE_DIR not in sys.path:
    sys.path.insert(0, ML_SERVICE_DIR)

from conflict_detection import get_supabase_client

sb = get_supabase_client()

ENG_ID = '1ef66a28-7465-4ed5-98b7-a5e91f64ed61'
SNT_ID = 'c710bd13-541c-4dcc-9ecb-14b2059649de'
TRD_ID = '86916be9-bf38-4db6-b606-09a53d78bf3c'

now = datetime.now(timezone.utc)
today_str = now.strftime('%Y-%m-%d')
tomorrow_str = (now + timedelta(days=1)).strftime('%Y-%m-%d')

demo_requests = [
    # 1. Fresh Scored Requests for Today (Ready to Optimize & Bundle)
    {
        "id": "REQ-DEMO-01",
        "asset_id": "AST-ENG-001",
        "department_id": ENG_ID,
        "section_id": "NDLS-GZB",
        "defect_type": "track_defect",
        "criticality": "High",
        "overdue_days": 3,
        "risk_score": 0.8920,
        "requested_window_start": f"{today_str}T14:00:00+00:00",
        "requested_window_end": f"{today_str}T16:00:00+00:00",
        "status": "scored",
        "conflict_flag": False,
        "asset_stress_index": 0.88,
        "section_traffic_density": 65.0,
    },
    {
        "id": "REQ-DEMO-02",
        "asset_id": "AST-SNT-003",
        "department_id": SNT_ID,
        "section_id": "NDLS-GZB",
        "defect_type": "signal_fault",
        "criticality": "High",
        "overdue_days": 2,
        "risk_score": 0.8415,
        "requested_window_start": f"{today_str}T14:00:00+00:00",
        "requested_window_end": f"{today_str}T16:00:00+00:00",
        "status": "scored",
        "conflict_flag": False,
        "asset_stress_index": 0.82,
        "section_traffic_density": 65.0,
    },
    {
        "id": "REQ-DEMO-03",
        "asset_id": "AST-TRD-005",
        "department_id": TRD_ID,
        "section_id": "NDLS-GZB",
        "defect_type": "traction_fault",
        "criticality": "High",
        "overdue_days": 1,
        "risk_score": 0.7850,
        "requested_window_start": f"{today_str}T14:00:00+00:00",
        "requested_window_end": f"{today_str}T16:00:00+00:00",
        "status": "scored",
        "conflict_flag": False,
        "asset_stress_index": 0.75,
        "section_traffic_density": 65.0,
    },

    # 2. Approved & Scheduled Requests for Today (Ready to click 'Take Possession')
    {
        "id": "REQ-DEMO-04",
        "asset_id": "AST-ENG-002",
        "department_id": ENG_ID,
        "section_id": "NDLS-GZB",
        "defect_type": "track_defect",
        "criticality": "High",
        "overdue_days": 2,
        "risk_score": 0.7420,
        "requested_window_start": f"{today_str}T10:00:00+00:00",
        "requested_window_end": f"{today_str}T12:00:00+00:00",
        "status": "scheduled",
        "conflict_flag": False,
        "asset_stress_index": 0.71,
        "section_traffic_density": 60.0,
    },
    {
        "id": "REQ-DEMO-05",
        "asset_id": "AST-SNT-004",
        "department_id": SNT_ID,
        "section_id": "NDLS-GZB",
        "defect_type": "signal_fault",
        "criticality": "Medium",
        "overdue_days": 1,
        "risk_score": 0.6810,
        "requested_window_start": f"{today_str}T10:00:00+00:00",
        "requested_window_end": f"{today_str}T12:00:00+00:00",
        "status": "scheduled",
        "conflict_flag": False,
        "asset_stress_index": 0.65,
        "section_traffic_density": 60.0,
    },

    # 3. Active on Track Request (In Progress right now with live possession timer)
    {
        "id": "REQ-DEMO-06",
        "asset_id": "AST-TRD-009",
        "department_id": TRD_ID,
        "section_id": "NDLS-GZB",
        "defect_type": "traction_fault",
        "criticality": "High",
        "overdue_days": 4,
        "risk_score": 0.8150,
        "requested_window_start": f"{today_str}T08:00:00+00:00",
        "requested_window_end": f"{today_str}T11:00:00+00:00",
        "possession_start_time": (now - timedelta(minutes=35)).isoformat(),
        "status": "in_progress",
        "conflict_flag": False,
        "asset_stress_index": 0.85,
        "section_traffic_density": 65.0,
    },

    # 4. Completed (Track Fit Certified) Request
    {
        "id": "REQ-DEMO-07",
        "asset_id": "AST-ENG-055",
        "department_id": ENG_ID,
        "section_id": "NDLS-GZB",
        "defect_type": "track_defect",
        "criticality": "High",
        "overdue_days": 0,
        "risk_score": 0.7200,
        "requested_window_start": f"{today_str}T04:00:00+00:00",
        "requested_window_end": f"{today_str}T06:30:00+00:00",
        "possession_start_time": f"{today_str}T04:05:00+00:00",
        "track_fit_status": "Fit for Normal Speed (Memo: FIT/NDLS/2026/09/042)",
        "status": "completed",
        "conflict_flag": False,
        "asset_stress_index": 0.60,
        "section_traffic_density": 50.0,
    }
]

print(f"Upserting {len(demo_requests)} demo requests for today ({today_str})...")
for req in demo_requests:
    # Delete existing if any, then insert
    sb.table('maintenance_requests').delete().eq('id', req['id']).execute()
    res = sb.table('maintenance_requests').insert(req).execute()
    print(f"  [OK] {req['id']} ({req['status']}) - {req['defect_type']} on {req['section_id']}")

print("All demo requests successfully seeded!")
