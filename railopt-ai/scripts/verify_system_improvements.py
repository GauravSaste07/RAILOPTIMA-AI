"""
RailOpt AI - Complete System Improvements End-to-End Verification
==================================================================
Tests all 8 system improvements implemented across:
1. Model & Features (8 features, calibration, dynamic threshold)
2. Dynamic Feature Computation (stress index, live traffic, monsoon, inspection gap)
3. Supabase DB Schema & Asset Data (installation_year, last_inspection_date, failure_count_last_year, cumulative_mgt_approx)
4. Single-Request Scoring (/score endpoint logic)
5. Bulk Scoring (/score-all batch logic)
6. Corridor Availability (Signalling-aware headways, Goods confidence time-decay)
7. Optimizer (Differentiated solver timeouts, traffic penalties, co-allocation)
8. Frontend Cleanliness (No hardcoded stress/traffic values in submission payload)
"""

import os
import sys
from datetime import datetime, timezone, timedelta
import pandas as pd
import numpy as np

# Ensure stdout supports unicode on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Setup paths
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ml_dir = os.path.join(base_dir, "ml-service")
sys.path.insert(0, ml_dir)

import joblib
import corridor_availability as ca
import optimizer as opt
import main as ml_main

PASS = "[PASS]"
FAIL = "[FAIL]"
test_results = []

def record(name: str, passed: bool, detail: str = ""):
    status = PASS if passed else FAIL
    print(f"{status} {name}: {detail}")
    test_results.append((name, passed, detail))

print("=" * 70)
print("       RAILOPT AI - SYSTEM INTEGRITY & IMPROVEMENTS AUDIT")
print("=" * 70)

# ----------------------------------------------------------------------
# 1. MODEL BUNDLE & FEATURE COLUMNS VERIFICATION
# ----------------------------------------------------------------------
print("\n--- Test Suite 1: ML Model Bundle & Architecture ---")
try:
    model_path = os.path.join(ml_dir, "models", "risk_model.pkl")
    assert os.path.exists(model_path), f"Model file missing at {model_path}"
    bundle = joblib.load(model_path)
    
    expected_features = [
        "overdue_days",
        "days_since_last_inspection",
        "asset_stress_index",
        "failure_count_last_year",
        "criticality_encoded",
        "defect_type_encoded",
        "section_traffic_density",
        "is_monsoon"
    ]
    actual_features = bundle.get("feature_cols", [])
    record("Model Features (8 features)", actual_features == expected_features, f"Found {len(actual_features)}: {actual_features}")
    
    is_calibrated = hasattr(bundle["model"], "predict_proba") and "CalibratedClassifier" in type(bundle["model"]).__name__
    record("Model Calibration (Platt / Isotonic)", is_calibrated, f"Type: {type(bundle['model']).__name__}")
    
    thresh = bundle.get("decision_threshold", None)
    record("Decision Threshold Configured", thresh is not None and 0.4 <= thresh <= 0.7, f"Threshold: {thresh}")
except Exception as e:
    record("ML Model Bundle Loading", False, str(e))

# ----------------------------------------------------------------------
# 2. DYNAMIC FEATURE COMPUTATION FUNCTIONS
# ----------------------------------------------------------------------
print("\n--- Test Suite 2: Dynamic Feature Calculation Logic ---")
try:
    # 2a. Dynamic stress index calculation
    sample_asset_old = {
        "installation_year": 1995,
        "last_inspection_date": "2026-06-01",
        "failure_count_last_year": 5,
        "cumulative_mgt_approx": 350.0
    }
    sample_asset_new = {
        "installation_year": 2024,
        "last_inspection_date": "2026-09-01",
        "failure_count_last_year": 0,
        "cumulative_mgt_approx": 15.0
    }
    stress_old = ml_main.compute_asset_stress_index_dynamic(sample_asset_old)
    stress_new = ml_main.compute_asset_stress_index_dynamic(sample_asset_new)
    record("Dynamic Asset Stress Scaling", stress_old > stress_new and 0.1 <= stress_new < stress_old <= 1.0,
           f"Old Asset Stress: {round(stress_old, 3)}, New Asset Stress: {round(stress_new, 3)}")

    # 2b. Monsoon calculation
    monsoon_dt = datetime(2026, 7, 15, tzinfo=timezone.utc)
    winter_dt = datetime(2026, 12, 15, tzinfo=timezone.utc)
    record("Monsoon Detection Logic", ml_main.compute_is_monsoon(monsoon_dt) == 1 and ml_main.compute_is_monsoon(winter_dt) == 0,
           f"July is_monsoon={ml_main.compute_is_monsoon(monsoon_dt)}, Dec is_monsoon={ml_main.compute_is_monsoon(winter_dt)}")

    # 2c. Days since inspection calculation
    ref_dt = datetime(2026, 9, 14, tzinfo=timezone.utc)
    days_gap = ml_main.compute_days_since_inspection({"last_inspection_date": "2026-08-15"}, ref_dt)
    record("Days Since Inspection Calculation", 29 <= days_gap <= 31, f"Computed gap: {days_gap} days")
except Exception as e:
    record("Dynamic Feature Functions", False, str(e))

# ----------------------------------------------------------------------
# 3. SUPABASE ASSETS TABLE AUDIT (NEW TEMPORAL COLUMNS)
# ----------------------------------------------------------------------
print("\n--- Test Suite 3: Supabase Asset Schema & Data Integrity ---")
try:
    sb = ml_main.get_supabase_client()
    assets_sample = sb.table("assets").select("id, section_id, type, installation_year, last_inspection_date, failure_count_last_year, cumulative_mgt_approx").limit(10).execute().data
    
    missing_fields = []
    for col in ["installation_year", "last_inspection_date", "failure_count_last_year", "cumulative_mgt_approx"]:
        null_count = sum(1 for a in assets_sample if a.get(col) is None)
        if null_count > 0:
            missing_fields.append(f"{col} ({null_count} nulls)")
            
    record("Supabase Asset Schema & Population", len(missing_fields) == 0, 
           "All 4 temporal fields populated" if not missing_fields else f"Missing: {missing_fields}")
except Exception as e:
    record("Supabase Asset Check", False, str(e))

# ----------------------------------------------------------------------
# 4. SINGLE-REQUEST SCORING (/score) VERIFICATION
# ----------------------------------------------------------------------
print("\n--- Test Suite 4: /score Endpoint Dynamic Pipeline ---")
try:
    # Fetch test request REQ-TEST-0859A
    req_res = sb.table("maintenance_requests").select("id").limit(1).execute()
    if req_res.data:
        test_req_id = req_res.data[0]["id"]
        payload = ml_main.ScoreRequest(maintenance_request_id=test_req_id)
        res = ml_main.score_maintenance_request(payload)
        
        has_score = 0.0 <= res.get("risk_score", -1) <= 1.0
        fv = res.get("feature_values", {})
        all_8_present = all(k in fv for k in expected_features)
        dynamic_stress = fv.get("asset_stress_index") != 0.65  # Must not be old hardcoded value
        dynamic_density = fv.get("section_traffic_density") is not None
        
        record("Single Request Scoring Execution", res.get("status") == "success" and has_score,
               f"Req: {test_req_id} -> risk_score={res.get('risk_score')}, is_critical={res.get('is_critical_prediction')}")
        record("All 8 Features in Scoring Response", all_8_present, f"Keys: {list(fv.keys())}")
        record("Dynamic (Non-Hardcoded) Values in Score", dynamic_stress and dynamic_density,
               f"Computed asset_stress_index={fv.get('asset_stress_index')}, density={fv.get('section_traffic_density')}")
    else:
        record("Single Request Scoring", False, "No requests found in DB")
except Exception as e:
    record("Single Request Scoring Pipeline", False, str(e))

# ----------------------------------------------------------------------
# 5. BULK SCORING (/score-all) VERIFICATION
# ----------------------------------------------------------------------
print("\n--- Test Suite 5: /score-all Batch Pipeline ---")
try:
    # Test score_all_requests (force_all=False or True for small verification)
    score_all_res = ml_main.score_all_requests(force_all=False)
    record("Batch /score-all Execution", score_all_res.get("status") == "success",
           f"Total requests in DB: {score_all_res.get('total_requests')}, Scored in run: {score_all_res.get('total_scored')}")
except Exception as e:
    record("Batch /score-all Execution", False, str(e))

# ----------------------------------------------------------------------
# 6. CORRIDOR AVAILABILITY & HEADWAY RULES
# ----------------------------------------------------------------------
print("\n--- Test Suite 6: Corridor Availability & Signalling Headways ---")
try:
    # 6a. Section headway by signalling type
    ndls_headway = ca.get_section_headway("NDLS-GZB")     # Suburban EMU
    hwh_headway = ca.get_section_headway("HWH-BWN")       # Automatic
    pune_headway = ca.get_section_headway("PUNE-DD")      # Absolute Block
    
    headway_ok = (ndls_headway == 5) and (hwh_headway == 8) and (pune_headway == 30)
    record("Signalling-Aware Headways", headway_ok,
           f"NDLS-GZB (Suburban EMU): {ndls_headway}m, HWH-BWN (Auto): {hwh_headway}m, PUNE-DD (Abs Block): {pune_headway}m")
    
    # 6b. Goods confidence time-decay
    dummy_slot = {"is_forecast": True, "confidence": 0.8}
    conf_2d = ca.get_goods_confidence(dummy_slot, 2)
    conf_7d = ca.get_goods_confidence(dummy_slot, 7)
    conf_14d = ca.get_goods_confidence(dummy_slot, 14)
    conf_30d = ca.get_goods_confidence(dummy_slot, 30)
    
    decay_ok = conf_2d > conf_7d > conf_14d >= conf_30d
    record("Goods Path Confidence Horizon Decay", decay_ok,
           f"2d: {conf_2d}, 7d: {conf_7d}, 14d: {conf_14d}, 30d: {conf_30d}")
except Exception as e:
    record("Corridor Availability Rules", False, str(e))

# ----------------------------------------------------------------------
# 7. OPTIMIZER TIMEOUTS & SOLVER CONFIGURATION
# ----------------------------------------------------------------------
print("\n--- Test Suite 7: Optimizer Parameters & Execution ---")
try:
    timeout_weekly = opt.SOLVER_TIMEOUT_BY_HORIZON.get("weekly")
    timeout_monthly = opt.SOLVER_TIMEOUT_BY_HORIZON.get("monthly")
    
    timeouts_ok = (timeout_weekly == 20.0) and (timeout_monthly == 90.0)
    record("Differentiated Solver Timeouts", timeouts_ok,
           f"Weekly: {timeout_weekly}s, Monthly: {timeout_monthly}s")
    
    traffic_penalty_ok = opt.TRAFFIC_PENALTY_PER_TRAIN == 30
    record("Traffic Penalty Constant Active", traffic_penalty_ok,
           f"TRAFFIC_PENALTY_PER_TRAIN = {opt.TRAFFIC_PENALTY_PER_TRAIN}")
    
    # 7b. Live CP-SAT optimization execution test
    opt_test_res = opt.optimize_maintenance_blocks(horizon="weekly", start_date="2026-09-07", sb=sb, persist_to_db=False)
    opt_ok = opt_test_res.get("status") == "success" and opt_test_res.get("scheduled_blocks_count", 0) > 0
    record("Live CP-SAT Optimization Execution", opt_ok,
           f"Solver: {opt_test_res.get('solver_method')}, Blocks: {opt_test_res.get('scheduled_blocks_count')}, Requests: {opt_test_res.get('scheduled_requests_count')}, Co-allocated: {opt_test_res.get('co_allocated_blocks_count')}")
except Exception as e:
    record("Optimizer Configuration & Execution", False, str(e))

# ----------------------------------------------------------------------
# 8. FRONTEND CODE CLEANLINESS
# ----------------------------------------------------------------------
print("\n--- Test Suite 8: Frontend Submission Hygiene ---")
try:
    fe_file = os.path.join(base_dir, "frontend", "src", "pages", "SubmitRequest.jsx")
    with open(fe_file, "r", encoding="utf-8") as f:
        fe_code = f.read()
        
    no_hardcoded_stress = "asset_stress_index: 0.65" not in fe_code
    no_hardcoded_density = "section_traffic_density: 48.0" not in fe_code
    fe_clean = no_hardcoded_stress and no_hardcoded_density
    record("Frontend Payload Cleanliness (No Hardcoded 0.65/48.0)", fe_clean,
           "Frontend lets ML service compute asset_stress_index and section_traffic_density dynamically")
except Exception as e:
    record("Frontend Cleanliness", False, str(e))

# ----------------------------------------------------------------------
# SUMMARY REPORT
# ----------------------------------------------------------------------
print("\n" + "=" * 70)
total_tests = len(test_results)
passed_tests = sum(1 for _, p, _ in test_results if p)
failed_tests = total_tests - passed_tests

print(f"VERIFICATION SUMMARY: {passed_tests}/{total_tests} tests PASSED ({round(passed_tests/total_tests*100, 1)}%)")
if failed_tests > 0:
    print(f"FAILED TESTS ({failed_tests}):")
    for name, p, detail in test_results:
        if not p:
            print(f"  - {name}: {detail}")
else:
    print("ALL SYSTEM IMPROVEMENTS VERIFIED AND FULLY OPERATIONAL!")
print("=" * 70)
