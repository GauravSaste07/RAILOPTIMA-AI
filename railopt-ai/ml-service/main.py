import os
import re
import joblib
import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone
import json
import requests
import dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client

from conflict_detection import detect_conflicts, get_supabase_client, fetch_all_maintenance_requests
from optimizer import optimize_maintenance_blocks

# ==============================================================================
# DYNAMIC FEATURE COMPUTATION HELPERS
# ==============================================================================

RDSO_INSPECTION_INTERVALS = {
    "Engineering": 30,
    "Signal & Telecom": 30,
    "Traction Distribution": 90
}

def compute_asset_stress_index_dynamic(asset_data: Dict[str, Any]) -> float:
    """
    Compute asset_stress_index (0.0-1.0) from real asset temporal fields.
    Replaces the hardcoded constant 0.65 used previously.
    """
    today = datetime.now(tz=timezone.utc)
    installation_year = int(asset_data.get("installation_year") or (today.year - 10))
    age_years = max(0, today.year - installation_year)
    age_component = min(1.0, age_years / 25.0)

    dept = str(asset_data.get("department") or "Engineering")
    interval_days = RDSO_INSPECTION_INTERVALS.get(dept, 30)
    last_insp_str = str(asset_data.get("last_inspection_date") or "")
    try:
        last_insp = datetime.strptime(last_insp_str[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        days_since_insp = max(0, (today - last_insp).days)
    except Exception:
        days_since_insp = interval_days
    insp_component = min(1.0, days_since_insp / (interval_days * 2.0))

    failures = int(asset_data.get("failure_count_last_year") or 0)
    failure_component = min(1.0, failures / 5.0)

    mgt = float(asset_data.get("cumulative_mgt_approx") or 50.0)
    mgt_component = min(1.0, mgt / 500.0)

    stress = (
        0.30 * age_component +
        0.35 * insp_component +
        0.20 * failure_component +
        0.15 * mgt_component
    )
    return round(min(1.0, max(0.0, stress)), 3)


def compute_section_traffic_density(sb: Client, section_id: str) -> float:
    """
    Compute section_traffic_density dynamically from timetable_slots in the DB
    (count of train slots for this section today).
    Replaces the hardcoded constant 48.0 used previously.
    """
    try:
        today = datetime.now(tz=timezone.utc)
        today_start = today.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        today_end   = today.replace(hour=23, minute=59, second=59, microsecond=0).isoformat()
        res = sb.table("timetable_slots") \
                .select("id", count="exact") \
                .eq("section_id", section_id) \
                .gte("scheduled_arrival", today_start) \
                .lte("scheduled_arrival", today_end) \
                .execute()
        count = res.count if res.count is not None else 0
        # Fallback to reasonable minimum if DB returns 0 (section may have no slots today)
        return float(max(count, 10))
    except Exception:
        return 40.0  # safe fallback


def compute_is_monsoon(dt: datetime) -> int:
    """Returns 1 if date is in Indian Railways monsoon season (June-September)."""
    return 1 if dt.month in (6, 7, 8, 9) else 0


def compute_days_since_inspection(asset_data: Dict[str, Any], request_dt: datetime) -> int:
    """Compute days between asset's last inspection and the maintenance request date."""
    last_insp_str = str(asset_data.get("last_inspection_date") or "")
    dept = str(asset_data.get("department") or "Engineering")
    interval_days = RDSO_INSPECTION_INTERVALS.get(dept, 30)
    try:
        last_insp = datetime.strptime(last_insp_str[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        return max(0, (request_dt - last_insp).days)
    except Exception:
        return interval_days

# 1. Initialize FastAPI Application
app = FastAPI(title="RailOpt AI ML & Optimization Service", version="1.0.0")

# 2. Configure CORS for Local, Containerized & Production Cloud Deployments
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    origins = [orig.strip() for orig in env_origins.split(",") if orig.strip()]
else:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:80",
        "http://127.0.0.1:80",
        "http://localhost",
        "http://127.0.0.1",
    ]

# In staging/cloud environments, ALLOW_ORIGIN_REGEX can match subdomains (e.g. https://.*\.vercel\.app)
allow_origin_regex = os.getenv("ALLOW_ORIGIN_REGEX") or (r"https?://.*" if os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true" else None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if not allow_origin_regex else [],
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Load Trained Risk Model
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "models", "risk_model.pkl")

model_bundle = None
if os.path.exists(MODEL_PATH):
    try:
        model_bundle = joblib.load(MODEL_PATH)
        print(f"[INIT] Loaded Risk Model artifact from {MODEL_PATH}")
    except Exception as e:
        print(f"[WARN] Failed loading model bundle: {e}")
else:
    print(f"[WARN] Model artifact not found at {MODEL_PATH}. Train model first.")

# 4. Production Root & Health Check Endpoints
@app.get("/")
def root():
    return {
        "service": "RailOpt AI - ML & Optimization Service",
        "status": "online",
        "docs_url": "/docs",
        "health_url": "/health"
    }

@app.get("/health")
def health_check():
    """
    Production health check verifying:
    1. Service uptime
    2. ML model artifact availability
    3. Database connectivity
    """
    model_status = "loaded" if model_bundle is not None else "unavailable"
    db_status = "unknown"
    try:
        sb = get_supabase_client()
        res = sb.table("departments").select("id", count="exact", head=True).execute()
        db_status = "connected" if res.count is not None else "connected"
    except Exception as e:
        db_status = f"unreachable: {str(e)[:50]}"

    is_healthy = (model_bundle is not None) and ("unreachable" not in db_status)

    return {
        "status": "healthy" if is_healthy else "degraded",
        "timestamp": datetime.now(tz=timezone.utc).isoformat(),
        "model": {
            "status": model_status,
            "artifact_present": os.path.exists(MODEL_PATH)
        },
        "database": {
            "status": db_status
        }
    }

# 5. Pydantic Request Models
class ScoreRequest(BaseModel):
    maintenance_request_id: Optional[str] = Field(None, description="Primary ID of maintenance request (e.g. REQ-00001)")
    request_id: Optional[str] = Field(None, description="Alternative alias for maintenance request ID")

class DefectClassifyRequest(BaseModel):
    description: str = Field(..., description="Free text description of the defect reported by field staff or station diary")
    department: Optional[str] = Field(None, description="Optional department context (Engineering, Signal & Telecom, Traction Distribution)")

TYPO_REPLACEMENTS = [
    (r'\bpiont\b', 'point'),
    (r'\bponit\b', 'point'),
    (r'\bmchine\b', 'machine'),
    (r'\bmotr\b', 'motor'),
    (r'\bfalt\b', 'fault'),
    (r'\bcatnary\b', 'catenary'),
    (r'\bthermit\b', 'thermite'),
    (r'\binterloking\b', 'interlocking'),
    (r'\bcircut\b', 'circuit'),
    (r'\btrasformer\b', 'transformer'),
    (r'\btrnsformer\b', 'transformer'),
    (r'\bfrature\b', 'fracture'),
    (r'\bfishplat\b', 'fishplate'),
    (r'\bflang\b', 'flange'),
]

# Railway Domain Defect Knowledge Base (Full Coverage across All 3 Field Departments)
RAILWAY_DEFECT_RULES = [
    # Signal & Telecom (S&T)
    {
        "department": "Signal & Telecom",
        "defect_type": "signal_fault",
        "sublabel": "Point Machine Motor Stall / Detection Failure",
        "target_asset_type": "Point Machine",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["point machine", "point motor", "motor stall", "point stall", "stall", "stalled", "stalling", "machine motor", "detection failure", "lock bar", "point failure", "crank handle", "switch motor", "point detection", "detection lock", "point 10", "point 20"]
    },
    {
        "department": "Signal & Telecom",
        "defect_type": "signal_fault",
        "sublabel": "Point Ground Connection Slack / Rod Bending",
        "target_asset_type": "Point Machine",
        "urgency": "High",
        "criticality": "High",
        "keywords": ["ground connection", "rod bending", "point rod", "drive rod", "slack in point", "transmission rod", "stretcher rod", "point play"]
    },
    {
        "department": "Signal & Telecom",
        "defect_type": "signal_fault",
        "sublabel": "Signal Aspect Blown / Lamp Extinguished",
        "target_asset_type": "Electronic Interlocking",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["signal aspect", "aspect blown", "lamp extinguished", "aspect blank", "signal blank", "red lamp", "lamp blown", "signal failure", "signal fail", "aspect fault", "signal bobbing", "signal lamp", "led aspect"]
    },
    {
        "department": "Signal & Telecom",
        "defect_type": "signal_fault",
        "sublabel": "Digital Axle Counter (DAC) Reset / Count Mismatch",
        "target_asset_type": "Digital Axle Counter",
        "urgency": "High",
        "criticality": "High",
        "keywords": ["axle counter", "dac", "ssdac", "msdac", "reset", "count error", "count mismatch", "wheel detector", "track device", "detection point", "dac reset"]
    },
    {
        "department": "Signal & Telecom",
        "defect_type": "signal_fault",
        "sublabel": "Track Circuit Drop / Low Ballast Resistance / Cable Cut",
        "target_asset_type": "Track Circuit",
        "urgency": "High",
        "criticality": "Medium",
        "keywords": ["track circuit", "tc drop", "low voltage", "glued joint", "gij", "relay bobbing", "relay pickup", "choke", "ballast resistance", "cable cut", "tc failure"]
    },
    {
        "department": "Signal & Telecom",
        "defect_type": "signal_fault",
        "sublabel": "Electronic Interlocking (EI) CPU / Card Communication Fail",
        "target_asset_type": "Electronic Interlocking",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["interlocking", "ei", "vdu", "panel error", "route failure", "route locking", "cpu card", "communication fail", "panel fault", "ei failure"]
    },
    {
        "department": "Signal & Telecom",
        "defect_type": "signal_fault",
        "sublabel": "Block Instrument Tokenless Line Clear Failure",
        "target_asset_type": "Electronic Interlocking",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["block instrument", "line clear", "tokenless", "block failure", "block handle", "block bell", "daido", "neale"]
    },
    {
        "department": "Signal & Telecom",
        "defect_type": "signal_fault",
        "sublabel": "Level Crossing Gate Boom Lock / Interlocking Failure",
        "target_asset_type": "Electronic Interlocking",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["gate boom", "boom lock", "gate interlocking", "lc interlocking", "boom failure", "gate signal", "boom lock failure", "gate key"]
    },

    # Engineering (P-Way & Bridges)
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Rail Fracture / Thermite Weld Failure",
        "target_asset_type": "Track Segment",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["fracture", "weld", "thermite", "broken rail", "rail crack", "crack in rail", "rail cut", "weld failure", "weld crack", "usfd failure", "rail breakage"]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Track Gauge Slack / Alignment Defect",
        "target_asset_type": "Track Segment",
        "urgency": "High",
        "criticality": "High",
        "keywords": ["gauge slack", "tight gauge", "gauge defect", "alignment defect", "cross level", "track twist", "unevenness", "track gauge", "alignment"]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Rail Joint Crack",
        "target_asset_type": "Track Segment",
        "urgency": "High",
        "criticality": "High",
        "keywords": [
            "rail joint crack",
            "joint crack",
            "crack visible on the rail joint",
            "crack on the rail joint",
            "crack on rail joint",
            "crack in the rail joint",
            "crack in rail joint",
            "crack visible on rail joint",
            "crack at rail joint",
            "rail joint",
            "joint defect",
            "fishbolt hole crack",
            "bolt hole crack",
            "rail end crack",
            "joint fracture",
            "joint crack visible"
        ]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Fishplate Crack / Defect",
        "target_asset_type": "Track Segment",
        "urgency": "High",
        "criticality": "High",
        "keywords": [
            "fishplate crack",
            "cracked fishplate",
            "fishplate fracture",
            "broken fishplate",
            "fishplate broken",
            "fishplate defect",
            "fish plate crack",
            "fishplate",
            "fish plate"
        ]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Missing Joint Bolts / Fastener Defect",
        "target_asset_type": "Track Segment",
        "urgency": "High",
        "criticality": "High",
        "keywords": [
            "missing joint bolts",
            "missing bolts",
            "joint bolts",
            "loose joint bolts",
            "loose bolts",
            "bolt missing",
            "fish bolts loose",
            "loose fishbolt",
            "missing bolt",
            "missing fishbolt",
            "joint bolt"
        ]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Rail Corrugation / Surface Spalling / Wheel Burn",
        "target_asset_type": "Track Segment",
        "urgency": "Normal",
        "criticality": "Medium",
        "keywords": ["corrugation", "spalling", "wheel burn", "scabbing", "rail grinding", "surface defect", "head check", "roaring rail"]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Ballast Fouling / Deep Screening & Packing Required",
        "target_asset_type": "Track Segment",
        "urgency": "Normal",
        "criticality": "Medium",
        "keywords": ["ballast", "fouled", "packing", "tamping", "mud pumping", "shoulder ballast", "cushion", "bcm", "deep screening", "dirty ballast"]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Turnout Point Machine Switch / Tongue Rail Jam",
        "target_asset_type": "Turnout Switch",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["turnout", "switch rail", "tongue rail", "stock rail", "stretcher bar", "crossing nose", "point jam", "switch gap", "tongue rail jam", "switch jam", "facing point"]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Crossing Nose Wear / Check Rail Clearance Defect",
        "target_asset_type": "Turnout Switch",
        "urgency": "High",
        "criticality": "High",
        "keywords": ["crossing nose", "cms crossing", "check rail clearance", "wing rail", "nose wear", "crossing wear"]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Level Crossing Road Surface / Check Rail Flangeway Jam",
        "target_asset_type": "Level Crossing Track",
        "urgency": "High",
        "criticality": "High",
        "keywords": ["level crossing", "lc gate", "check rail", "flangeway", "road surface", "flange jam", "road paved", "lc track"]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Bridge Girder Distortion / Expansion Bearing Defect",
        "target_asset_type": "Bridge Structure",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["bridge", "girder", "pier", "abutment", "bearing", "channel sleeper", "viaduct", "culvert", "girder distortion"]
    },
    {
        "department": "Engineering",
        "defect_type": "track_defect",
        "sublabel": "Track Creep / Long Welded Rail (LWR) Breathing Joint Gap",
        "target_asset_type": "Track Segment",
        "urgency": "Normal",
        "criticality": "Medium",
        "keywords": ["track creep", "lwr", "cwr", "breathing joint", "switch expansion joint", "sej", "gap widening", "creep post"]
    },

    # Traction Distribution (TRD / OHE)
    {
        "department": "Traction Distribution",
        "defect_type": "traction_fault",
        "sublabel": "OHE Catenary Contact Wire Sag / Height Defect",
        "target_asset_type": "OHE Catenary Wire",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["catenary", "contact wire", "wire sag", "panto", "pantograph", "wire snapped", "panto entanglement", "height gauge", "ohe sag", "ohe"]
    },
    {
        "department": "Traction Distribution",
        "defect_type": "traction_fault",
        "sublabel": "Snapped Dropper / Loose Jumper Cable",
        "target_asset_type": "OHE Catenary Wire",
        "urgency": "High",
        "criticality": "High",
        "keywords": ["dropper", "snapped dropper", "jumper", "loose jumper", "c-jumper", "g-jumper", "broken dropper", "dropper snapped"]
    },
    {
        "department": "Traction Distribution",
        "defect_type": "traction_fault",
        "sublabel": "Cantilever Assembly Insulator Flashover / Tilt",
        "target_asset_type": "Cantilever Assembly",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["cantilever", "insulator", "flashover", "bracket", "stay arm", "insulator broken", "mast tilt", "bracket tube"]
    },
    {
        "department": "Traction Distribution",
        "defect_type": "traction_fault",
        "sublabel": "Section Insulator / Neutral Section Overlap Arc",
        "target_asset_type": "Section Insulator",
        "urgency": "High",
        "criticality": "High",
        "keywords": ["section insulator", "neutral section", "arc", "arcing", "runner", "ptfe", "bridging", "phase break", "neutral section arc"]
    },
    {
        "department": "Traction Distribution",
        "defect_type": "traction_fault",
        "sublabel": "Traction Substation (TSS) Transformer / Feeder Tripping",
        "target_asset_type": "Traction Substation",
        "urgency": "Emergency",
        "criticality": "High",
        "keywords": ["substation", "tss", "transformer", "circuit breaker", "trip", "tripping", "feeder", "25kv", "relay operated", "oil temp", "buchholz"]
    },
    {
        "department": "Traction Distribution",
        "defect_type": "traction_fault",
        "sublabel": "Auto-Tensioning Device (ATD) Weight Balance Jam",
        "target_asset_type": "OHE Catenary Wire",
        "urgency": "Normal",
        "criticality": "Normal",
        "keywords": ["atd", "auto tensioning", "counterweight", "atd jam", "weight balance", "pulley", "atd cable", "weight stuck"]
    },
    {
        "department": "Traction Distribution",
        "defect_type": "traction_fault",
        "sublabel": "Mast Mast-Bond / Structure Earthing Corrosion",
        "target_asset_type": "Cantilever Assembly",
        "urgency": "Normal",
        "criticality": "Normal",
        "keywords": ["mast bond", "structure earthing", "earth wire", "earthing corrosion", "bond broken", "structure bond"]
    },
    {

        "department": "Traction Distribution",
        "defect_type": "traction_fault",
        "sublabel": "OHE Vegetation / Tree Branch Infringement Near Wire",
        "target_asset_type": "OHE Catenary Wire",
        "urgency": "High",
        "criticality": "High",
        "keywords": ["tree branch", "vegetation", "infringement", "tree touch", "bird nest", "tree trimming", "branch touch", "tree near ohe"]
    }
]

SUPPORTED_SUB_LABELS = {rule["sublabel"]: rule for rule in RAILWAY_DEFECT_RULES}

DEFECT_CATEGORY_LABELS = {
    "track_defect": "Track Defect",
    "signal_fault": "Signal Fault",
    "traction_fault": "Traction Defect",
}

def call_gemini_defect_classifier(
    description: str,
    department: str = "Engineering",
    extracted_line: Optional[str] = None,
    extracted_km: Optional[str] = None,
    extracted_marker: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Automatic Gemini 3.6 Flash Fallback Defect Classifier.
    Activates when the fast local regex/keyword matching engine cannot identify a field note.
    Constrained strictly to the 26 Indian Railways defect sublabels and 3 model categories.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return None

    labels_by_dept = {
        "Engineering": [r["sublabel"] for r in RAILWAY_DEFECT_RULES if r["department"] == "Engineering"],
        "Signal & Telecom": [r["sublabel"] for r in RAILWAY_DEFECT_RULES if r["department"] == "Signal & Telecom"],
        "Traction Distribution": [r["sublabel"] for r in RAILWAY_DEFECT_RULES if r["department"] == "Traction Distribution"],
    }

    prompt = f"""You are an expert Indian Railways Chief Maintenance Engineer and safety telemetry classifier.
Analyze the following free-text field note or defect report from a maintenance gang, patrolman, or loco pilot:

Field Note: "{description}"
User Department Context: "{department}"

Classify into the single most accurate Indian Railways defect sublabel from this STRICT whitelist:
Engineering:
{chr(10).join('- ' + l for l in labels_by_dept['Engineering'])}

Signal & Telecom:
{chr(10).join('- ' + l for l in labels_by_dept['Signal & Telecom'])}

Traction Distribution:
{chr(10).join('- ' + l for l in labels_by_dept['Traction Distribution'])}

CRITICAL SAFETY & CLASSIFICATION RULES:
1. "detected_sublabel" MUST BE EXACTLY ONE of the allowed sublabels listed in the whitelist above. Never invent new labels.
2. If the field note describes an issue completely outside railway track civil, signalling, or OHE traction infrastructure (e.g. coach AC, passenger seat, pantry food, train ticket, booking counter), set "matched": false, "detected_sublabel": null, and explanation in "summary".
3. Extract railway location entities if mentioned (Line: "UP Main Line" | "DOWN Main Line" | "Station Yard / Loop Line" | "3rd Line (Goods / Fast)", KM chainage e.g. "45.2", Mast/Point marker e.g. "Mast 42/10" or "Point 104A").
4. "recommended_urgency" must be "Emergency", "High", or "Normal".

Return valid JSON with this exact schema:
{{
  "matched": true,
  "detected_sublabel": "<Exact string from whitelist above, or null if matched is false>",
  "recommended_urgency": "Emergency" | "High" | "Normal",
  "extracted_line": "UP Main Line" | "DOWN Main Line" | "Station Yard / Loop Line" | "3rd Line (Goods / Fast)" | null,
  "extracted_km": "<numeric KM or null>",
  "extracted_marker": "<e.g. Mast 42/10 or Point 104A or null>",
  "confidence": 0.85,
  "summary": "<Short 1-sentence plain English diagnosis>"
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={gemini_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=12)
        if resp.status_code == 200:
            result_text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(result_text)

            if not parsed.get("matched"):
                return None

            sublabel = parsed.get("detected_sublabel")
            # Strict safety whitelist guardrail:
            rule = SUPPORTED_SUB_LABELS.get(sublabel)
            if not rule:
                # Fuzzy fallback to find closest matching sublabel in whitelist
                for valid_name, r in SUPPORTED_SUB_LABELS.items():
                    if sublabel and (sublabel.lower() in valid_name.lower() or valid_name.lower() in sublabel.lower()):
                        rule = r
                        sublabel = valid_name
                        break

            if not rule:
                return None

            urgency = parsed.get("recommended_urgency") or rule["urgency"]
            if urgency not in ["Emergency", "High", "Normal"]:
                urgency = rule["urgency"]

            return {
                "status": "success",
                "matched": True,
                "source": "gemini_llm",
                "input_text": description,
                "normalized_text": description.strip().lower(),
                "department": rule["department"],
                "predicted_department": rule["department"],
                "category": DEFECT_CATEGORY_LABELS.get(rule["defect_type"], "Track Defect"),
                "predicted_defect_type": rule["defect_type"],
                "detected_issue": rule["sublabel"],
                "detected_sublabel": rule["sublabel"],
                "recommended_asset_type": rule["target_asset_type"],
                "severity": urgency,
                "recommended_urgency": urgency,
                "recommended_criticality": "High" if urgency == "Emergency" else rule["criticality"],
                "extracted_line": parsed.get("extracted_line") or extracted_line,
                "extracted_km": parsed.get("extracted_km") or extracted_km,
                "extracted_marker": parsed.get("extracted_marker") or extracted_marker,
                "confidence": float(parsed.get("confidence", 0.85)),
                "matched_keywords": ["gemini_ai_semantic_reasoning"],
                "summary": parsed.get("summary") or f"Automatically classified as {rule['sublabel']} via Gemini AI."
            }
        else:
            print(f"[Gemini API HTTP Error]: {resp.status_code} - {resp.text[:200]}")
    except Exception as e:
        print(f"[Gemini Defect Classifier Exception]: {e}")

    return None

# 5. Core Endpoints
@app.get("/")
def root():
    return {
        "message": "Hello World from RailOpt AI ML Service",
        "status": "active",
        "model_loaded": model_bundle is not None
    }

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/classify-defect")
def classify_defect_text(payload: DefectClassifyRequest):
    """
    Railway NLP Defect Intelligence:
    Tier 1 (Fast-Path): Parses free-text defect descriptions using typo-tolerant keyword/regex matching (<10ms).
    Tier 2 (Smart-Path Fallback): If local engine cannot identify, automatically cascades to Gemini 3.6 Flash.
    """
    raw_text = (payload.description or "").strip().lower()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Description text is required.")

    # Apply typo corrections
    text = raw_text
    for pattern, replacement in TYPO_REPLACEMENTS:
        text = re.sub(pattern, replacement, text)

    user_dept = (payload.department or "").strip().lower()

    best_rule = None
    best_score = 0
    matched_keywords = []

    for rule in RAILWAY_DEFECT_RULES:
        rule_score = 0
        rule_matches = []
        for kw in rule["keywords"]:
            if kw in text:
                rule_score += len(kw.split()) * 3  # Multi-word matches get higher weight
                rule_matches.append(kw)

        # Department alignment bonus
        if rule_score > 0 and user_dept and (user_dept in rule["department"].lower() or rule["department"].lower() in user_dept):
            rule_score += 4

        if rule_score > best_score:
            best_score = rule_score
            best_rule = rule
            matched_keywords = rule_matches

    # Location entity extraction
    extracted_line = None
    if "up" in text or "up main" in text or "up line" in text:
        extracted_line = "UP Main Line"
    elif "down" in text or "dn" in text or "down main" in text or "down line" in text:
        extracted_line = "DOWN Main Line"
    elif "yard" in text or "loop" in text:
        extracted_line = "Station Yard / Loop Line"
    elif "3rd" in text or "goods" in text or "fast" in text:
        extracted_line = "3rd Line (Goods / Fast)"

    km_match = re.search(r'(?:km|k\.m\.|kilometer)\s*[:=]?\s*(\d+(?:\.\d+|\/\d+)?)', text)
    extracted_km = km_match.group(1) if km_match else None

    mast_match = re.search(r'(?:mast|pole|point)\s*[:=]?\s*(\d+[a-z]?(?:\/\d+)?)', text)
    extracted_marker = mast_match.group(0).title() if mast_match else None

    # Tier 2: If no keyword matched locally, AUTOMATICALLY CASCADE to Gemini LLM!
    if not best_rule or best_score == 0:
        gemini_result = call_gemini_defect_classifier(
            description=payload.description,
            department=payload.department or "Engineering",
            extracted_line=extracted_line,
            extracted_km=extracted_km,
            extracted_marker=extracted_marker,
        )
        if gemini_result:
            return gemini_result

        # If Gemini is not configured, unavailable, or detects non-infrastructure text
        return {
            "status": "no_match",
            "matched": False,
            "source": "no_match",
            "confidence": 0.0,
            "message": "No recognizable railway defect keywords found in text.",
            "detected_sublabel": None,
            "predicted_department": payload.department or "Unknown",
            "recommended_urgency": None,
            "recommended_asset_type": None,
            "extracted_line": extracted_line,
            "extracted_km": extracted_km,
            "extracted_marker": extracted_marker,
            "matched_keywords": []
        }

    # Tier 1 Local Match Successful
    # Confidence calculation:
    # Visual field notes (e.g. "crack visible on the rail joint") default to 85% (0.85) confidence.
    # Automated instrumentation / sensor readings (USFD, SCADA, telemetry) scale to 95% (0.95).
    if any(inst in text for inst in ["usfd", "ultrasonic", "gauge meter", "scada", "telemetry", "measuring car", "oms"]):
        confidence = 0.95
    else:
        confidence = 0.85

    # Severity modifier
    urgency = best_rule["urgency"]
    criticality = best_rule["criticality"]
    emergency_cues = ["emergency", "critical", "danger", "immediately", "urgent", "severed", "derailment", "fire", "smoke", "accident", "stall", "jam"]
    if any(cue in text for cue in emergency_cues):
        urgency = "Emergency"
        criticality = "High"

    category_label = DEFECT_CATEGORY_LABELS.get(best_rule["defect_type"], "Track Defect")

    return {
        "status": "success",
        "matched": True,
        "source": "local_nlp",
        "input_text": payload.description,
        "normalized_text": text,
        "department": best_rule["department"],
        "predicted_department": best_rule["department"],
        "category": category_label,
        "predicted_defect_type": best_rule["defect_type"],
        "detected_issue": best_rule["sublabel"],
        "detected_sublabel": best_rule["sublabel"],
        "recommended_asset_type": best_rule["target_asset_type"],
        "severity": urgency,
        "recommended_urgency": urgency,
        "recommended_criticality": criticality,
        "extracted_line": extracted_line,
        "extracted_km": extracted_km,
        "extracted_marker": extracted_marker,
        "confidence": confidence,
        "matched_keywords": matched_keywords
    }


@app.post("/score")
def score_maintenance_request(payload: ScoreRequest):
    """
    Takes a maintenance_request_id, fetches its features from Supabase,
    DYNAMICALLY computes all 8 ML features (no hardcoded constants),
    evaluates using the trained XGBoost risk model (risk_model.pkl),
    returns risk_score (0-1) with full feature breakdown,
    writes risk_score back to Supabase, and updates status to 'scored'
    if the request's current status is 'pending'.

    Improvements over v1:
    - section_traffic_density: computed live from timetable_slots count (not hardcoded 48.0)
    - asset_stress_index: computed from asset age, inspection gap, failure history, MGT (not hardcoded 0.65)
    - is_monsoon: binary flag for Indian Railways monsoon season (June-September)
    - days_since_last_inspection: RDSO-standard inspection overdue metric
    - failure_count_last_year: historical failure rate from asset record
    - Decision threshold: tuned to 0.60 for better precision on scheduling
    """
    req_id = payload.maintenance_request_id or payload.request_id
    if not req_id:
        raise HTTPException(
            status_code=400,
            detail="Either 'maintenance_request_id' or 'request_id' must be provided."
        )

    if model_bundle is None:
        raise HTTPException(
            status_code=500,
            detail="Risk model is not loaded. Please ensure risk_model.pkl exists."
        )

    sb = get_supabase_client()

    # 1. Fetch maintenance request
    req_res = sb.table("maintenance_requests").select("*").eq("id", req_id).execute()
    if not req_res.data or len(req_res.data) == 0:
        raise HTTPException(status_code=404, detail=f"Request '{req_id}' not found.")
    req_data = req_res.data[0]

    # 2. Fetch asset record for dynamic feature computation
    asset_data = {}
    asset_id = req_data.get("asset_id")
    if asset_id:
        try:
            asset_res = sb.table("assets").select("*").eq("id", asset_id).execute()
            if asset_res.data:
                asset_data = asset_res.data[0]
        except Exception:
            pass  # fallback to defaults

    criticality_map = model_bundle.get("criticality_map", {"Low": 1, "Medium": 2, "High": 3})
    defect_type_map = model_bundle.get("defect_type_map", {"track_defect": 0, "signal_fault": 1, "traction_fault": 2})
    decision_threshold = model_bundle.get("decision_threshold", 0.60)
    model = model_bundle["model"]
    base_model = model_bundle.get("base_model", model)
    feature_cols = model_bundle["feature_cols"]

    # 3. Compute all features dynamically
    criticality_str = str(req_data.get("criticality") or "Medium")
    criticality_encoded = criticality_map.get(criticality_str, 2)
    defect_type = req_data.get("defect_type", "track_defect")
    defect_type_encoded = defect_type_map.get(defect_type, 0)
    overdue_days = int(req_data.get("overdue_days") or 0)

    section_id = req_data.get("section_id", "")

    # --- IMPROVED: section_traffic_density from live DB (not hardcoded 48.0) ---
    section_traffic_density = compute_section_traffic_density(sb, section_id)
    # Fallback: use stored value if DB count fails or returns very low
    stored_density = req_data.get("section_traffic_density")
    if section_traffic_density <= 10 and stored_density:
        section_traffic_density = float(stored_density)

    # --- IMPROVED: asset_stress_index from asset temporal fields (not hardcoded 0.65) ---
    if asset_data:
        asset_stress_index = compute_asset_stress_index_dynamic(asset_data)
    else:
        # Fallback to stored value if asset not found
        asset_stress_index = float(req_data.get("asset_stress_index") or 0.5)

    # --- NEW: is_monsoon — June-Sept spike in Indian Railways defects ---
    req_start_str = req_data.get("requested_window_start") or datetime.now(tz=timezone.utc).isoformat()
    try:
        req_start_dt = datetime.fromisoformat(str(req_start_str).replace("Z", "+00:00"))
    except Exception:
        req_start_dt = datetime.now(tz=timezone.utc)
    is_monsoon = compute_is_monsoon(req_start_dt)

    # --- NEW: days_since_last_inspection — RDSO standard metric ---
    days_since_last_inspection = compute_days_since_inspection(asset_data, req_start_dt)

    # --- NEW: failure_count_last_year — from asset record ---
    failure_count_last_year = int(asset_data.get("failure_count_last_year") or 0)

    feature_dict = {
        "overdue_days": overdue_days,
        "days_since_last_inspection": days_since_last_inspection,
        "asset_stress_index": asset_stress_index,
        "failure_count_last_year": failure_count_last_year,
        "criticality_encoded": criticality_encoded,
        "defect_type_encoded": defect_type_encoded,
        "section_traffic_density": section_traffic_density,
        "is_monsoon": is_monsoon,
    }

    # 4. Predict Risk Score
    X_input = pd.DataFrame([feature_dict])
    # Align to model's feature order
    X_input = X_input.reindex(columns=feature_cols, fill_value=0)
    proba = float(model.predict_proba(X_input)[0, 1])
    risk_score = round(proba, 4)
    is_critical = bool(proba >= decision_threshold)

    # 5. Feature importance breakdown
    try:
        importances = base_model.feature_importances_
        feature_importance_map = dict(zip(feature_cols, [round(float(imp), 4) for imp in importances]))
    except Exception:
        feature_importance_map = {f: 0.0 for f in feature_cols}

    feature_breakdown = {
        "overdue_days": {
            "factor_name": "Urgency (Days Overdue)",
            "feature_value": overdue_days,
            "global_model_importance": feature_importance_map.get("overdue_days", 0.0),
            "assessment": "High Urgency" if overdue_days > 45 else ("Moderate" if overdue_days > 15 else "Low Urgency")
        },
        "days_since_last_inspection": {
            "factor_name": "Days Since Last RDSO Inspection",
            "feature_value": days_since_last_inspection,
            "global_model_importance": feature_importance_map.get("days_since_last_inspection", 0.0),
            "assessment": "Overdue" if days_since_last_inspection > 45 else "Within Schedule"
        },
        "asset_stress_index": {
            "factor_name": "Asset Stress Index (Age + Inspection + MGT + Failures)",
            "feature_value": round(asset_stress_index, 3),
            "global_model_importance": feature_importance_map.get("asset_stress_index", 0.0),
            "assessment": "High Stress" if asset_stress_index >= 0.7 else ("Moderate" if asset_stress_index >= 0.4 else "Normal"),
            "computation": "Dynamic (age+inspection+failures+mgt) — not hardcoded"
        },
        "failure_count_last_year": {
            "factor_name": "Historical Failure Count (Last 12 Months)",
            "feature_value": failure_count_last_year,
            "global_model_importance": feature_importance_map.get("failure_count_last_year", 0.0),
            "assessment": "Repeat Failure Pattern" if failure_count_last_year >= 3 else "Normal History"
        },
        "criticality_encoded": {
            "factor_name": "Asset Base Criticality",
            "feature_value": criticality_encoded,
            "raw_rating": criticality_str,
            "global_model_importance": feature_importance_map.get("criticality_encoded", 0.0)
        },
        "defect_type_encoded": {
            "factor_name": "Defect Classification",
            "feature_value": defect_type,
            "encoded_id": defect_type_encoded,
            "global_model_importance": feature_importance_map.get("defect_type_encoded", 0.0)
        },
        "section_traffic_density": {
            "factor_name": "Section Traffic Density (Live Train Count)",
            "feature_value": section_traffic_density,
            "global_model_importance": feature_importance_map.get("section_traffic_density", 0.0),
            "assessment": "Heavy Section" if section_traffic_density >= 45 else "Standard Section",
            "computation": "Dynamic from timetable_slots — not hardcoded"
        },
        "is_monsoon": {
            "factor_name": "Monsoon Season Flag (Indian Railways)",
            "feature_value": is_monsoon,
            "global_model_importance": feature_importance_map.get("is_monsoon", 0.0),
            "assessment": "Monsoon Season (Jun-Sep) — elevated defect risk" if is_monsoon else "Non-Monsoon Season"
        }
    }

    # 5b. Compute the 3 PS-Mandated Pillars (Criticality, Urgency, Impact on Asset Availability)
    crit_base = 0.9 if criticality_str == "High" else (0.6 if criticality_str == "Medium" else 0.3)
    stress_val = float(asset_stress_index)
    failure_mult = min(1.0, failure_count_last_year / 5.0)
    criticality_pillar_score = round(min(1.0, 0.45 * crit_base + 0.35 * stress_val + 0.20 * failure_mult), 2)

    overdue_norm = min(1.0, overdue_days / 60.0)
    insp_norm = min(1.0, days_since_last_inspection / 60.0)
    urgency_pillar_score = round(min(1.0, 0.65 * overdue_norm + 0.35 * insp_norm), 2)

    density_norm = min(1.0, max(0.0, (section_traffic_density - 10.0) / 45.0))
    availability_impact_score = round(min(1.0, 0.80 * density_norm + 0.20 * (1.0 if is_monsoon else 0.4)), 2)

    ps_three_factors = {
        "criticality": {
            "name": "Criticality",
            "score": criticality_pillar_score,
            "percentage": int(criticality_pillar_score * 100),
            "rating": criticality_str,
            "stress_index": round(asset_stress_index, 3),
            "failure_count": failure_count_last_year,
            "summary": f"{criticality_str} criticality asset with stress index {round(asset_stress_index, 2)} and {failure_count_last_year} prior failure(s)."
        },
        "urgency": {
            "name": "Urgency",
            "score": urgency_pillar_score,
            "percentage": int(urgency_pillar_score * 100),
            "overdue_days": overdue_days,
            "days_since_inspection": days_since_last_inspection,
            "summary": f"{overdue_days} days overdue beyond maintenance window; {days_since_last_inspection} days since last inspection."
        },
        "asset_availability_impact": {
            "name": "Impact on Asset Availability",
            "score": availability_impact_score,
            "percentage": int(availability_impact_score * 100),
            "traffic_density": section_traffic_density,
            "monsoon_risk": bool(is_monsoon),
            "summary": f"Section carries {int(section_traffic_density)} trains/day; failure directly threatens corridor throughput."
        }
    }

    # 6. Write risk_score back to Supabase
    current_status = req_data.get("status", "pending")
    update_payload = {
        "risk_score": risk_score,
        "asset_stress_index": asset_stress_index,          # Write back computed value
        "section_traffic_density": section_traffic_density, # Write back computed value
    }
    if current_status == "pending":
        update_payload["status"] = "scored"
        new_status = "scored"
    else:
        new_status = current_status

    sb.table("maintenance_requests").update(update_payload).eq("id", req_id).execute()

    return {
        "status": "success",
        "maintenance_request_id": req_id,
        "risk_score": risk_score,
        "is_critical_prediction": is_critical,
        "decision_threshold": decision_threshold,
        "previous_status": current_status,
        "current_status": new_status,
        "feature_values": feature_dict,
        "feature_breakdown": feature_breakdown,
        "ps_three_factors": ps_three_factors,
        "improvements": [
            "section_traffic_density computed live from timetable_slots (was hardcoded 48.0)",
            "asset_stress_index computed from asset temporal data (was hardcoded 0.65)",
            "is_monsoon: Indian Railways monsoon season awareness (NEW)",
            "days_since_last_inspection: RDSO inspection gap metric (NEW)",
            "failure_count_last_year: asset failure history (NEW)",
            f"Decision threshold: {decision_threshold} (was 0.50 — tuned for better precision)"
        ]
    }

@app.post("/score-all")
def score_all_requests(force_all: bool = Query(False, description="If True, re-scores all requests even if already scored")):
    """
    Runs the risk model against every maintenance_request currently missing a risk_score
    (or all requests if force_all=True), writing scores back to Supabase in batches,
    and setting status='scored' for each request that is currently 'pending'.
    """
    if model_bundle is None:
        raise HTTPException(
            status_code=500,
            detail="Risk model is not loaded. Please ensure risk_model.pkl exists."
        )

    sb = get_supabase_client()
    requests = fetch_all_maintenance_requests(sb)

    if not requests:
        return {
            "status": "success",
            "message": "No maintenance requests found in Supabase.",
            "total_scored": 0
        }

    # Filter requests to score
    if force_all:
        target_requests = requests
    else:
        target_requests = [r for r in requests if r.get("risk_score") is None]

    if not target_requests:
        # If all already have risk_score, compute stats on existing scores
        scores = [float(r["risk_score"]) for r in requests if r.get("risk_score") is not None]
        return {
            "status": "success",
            "message": "All maintenance requests already have a risk_score. (Use force_all=true to re-score)",
            "total_requests": len(requests),
            "total_scored": 0,
            "existing_scores_count": len(scores),
            "score_distribution": {
                "min": round(min(scores), 4) if scores else 0.0,
                "max": round(max(scores), 4) if scores else 0.0,
                "average": round(float(np.mean(scores)), 4) if scores else 0.0,
                "low_risk_count (< 0.3)": sum(1 for s in scores if s < 0.3),
                "medium_risk_count (0.3 - 0.7)": sum(1 for s in scores if 0.3 <= s < 0.7),
                "high_risk_count (>= 0.7)": sum(1 for s in scores if s >= 0.7)
            }
        }

    criticality_map = model_bundle.get("criticality_map", {"Low": 1, "Medium": 2, "High": 3})
    defect_type_map = model_bundle.get("defect_type_map", {"track_defect": 0, "signal_fault": 1, "traction_fault": 2})
    model = model_bundle["model"]
    feature_cols = model_bundle["feature_cols"]

    # Pre-fetch assets to compute dynamic features efficiently
    try:
        assets_res = sb.table("assets").select("*").execute()
        assets_by_id = {a["id"]: a for a in (assets_res.data or [])}
    except Exception:
        assets_by_id = {}

    # Build feature matrix for batch prediction
    feature_rows = []
    now_utc = datetime.now(tz=timezone.utc)
    for r in target_requests:
        aid = r.get("asset_id")
        asset_data = assets_by_id.get(aid, {})

        crit_str = str(r.get("criticality") or asset_data.get("criticality") or "Medium")
        crit_enc = criticality_map.get(crit_str, 2)
        if asset_data:
            stress = compute_asset_stress_index_dynamic(asset_data)
        else:
            stress = float(r.get("asset_stress_index") if r.get("asset_stress_index") is not None else 0.5)

        overdue = int(r.get("overdue_days") or 0)
        density = float(r.get("section_traffic_density") or 40.0)
        dtype = r.get("defect_type", "track_defect")
        dtype_enc = defect_type_map.get(dtype, 0)

        req_start_str = r.get("requested_window_start")
        try:
            req_start_dt = datetime.fromisoformat(str(req_start_str).replace("Z", "+00:00")) if req_start_str else now_utc
        except Exception:
            req_start_dt = now_utc

        is_monsoon = compute_is_monsoon(req_start_dt)
        days_since_insp = compute_days_since_inspection(asset_data, req_start_dt)
        fail_count = int(asset_data.get("failure_count_last_year") or 0)

        feature_rows.append({
            "overdue_days": overdue,
            "days_since_last_inspection": days_since_insp,
            "asset_stress_index": stress,
            "failure_count_last_year": fail_count,
            "criticality_encoded": crit_enc,
            "defect_type_encoded": dtype_enc,
            "section_traffic_density": density,
            "is_monsoon": is_monsoon,
        })

    X_df = pd.DataFrame(feature_rows)[feature_cols]
    probas = model.predict_proba(X_df)[:, 1]

    # Prepare database updates
    update_records = []
    scores_list = []
    status_updated_count = 0

    for r, p, f in zip(target_requests, probas, feature_rows):
        score = round(float(p), 4)
        scores_list.append(score)
        rec = {
            "id": r["id"],
            "risk_score": score,
            "asset_stress_index": round(float(f["asset_stress_index"]), 3)
        }
        if r.get("status") == "pending":
            rec["status"] = "scored"
            status_updated_count += 1
        update_records.append(rec)

    # Upsert in batches of 200
    batch_size = 200
    for i in range(0, len(update_records), batch_size):
        batch = update_records[i:i + batch_size]
        sb.table("maintenance_requests").upsert(batch).execute()

    return {
        "status": "success",
        "total_requests": len(requests),
        "total_scored": len(update_records),
        "status_transitioned_to_scored": status_updated_count,
        "score_distribution": {
            "min": round(min(scores_list), 4),
            "max": round(max(scores_list), 4),
            "average": round(float(np.mean(scores_list)), 4),
            "low_risk_count (< 0.3)": sum(1 for s in scores_list if s < 0.3),
            "medium_risk_count (0.3 - 0.7)": sum(1 for s in scores_list if 0.3 <= s < 0.7),
            "high_risk_count (>= 0.7)": sum(1 for s in scores_list if s >= 0.7)
        }
    }

class ConflictRequest(BaseModel):
    request_id: Optional[str] = None
    section_id: Optional[str] = None

@app.post("/detect-conflicts")
def run_conflict_detection(payload: Optional[ConflictRequest] = None, section_id: Optional[str] = Query(None), request_id: Optional[str] = Query(None)):
    """
    Runs department-aware schedule conflict detection:
    - Same section_id + overlapping time window + SAME department -> TRUE conflict (conflicting_with)
    - Overlapping approved blocks in the same section -> TRUE conflict (conflicting_approved_block_id)
    - Cross-department overlaps -> Co-allocation candidate (No conflict)
    Writes conflict_flag, conflicting_with, and conflicting_approved_block_id back to Supabase.
    """
    sec = (payload.section_id if payload else None) or section_id
    req = (payload.request_id if payload else None) or request_id

    try:
        result = detect_conflicts(section_id=sec, target_request_id=req, update_supabase=True)
        return {
            "status": "success",
            "section_id_filter": sec,
            "target_request_id": req,
            "total_requests_analyzed": result["total_requests"],
            "conflicts_detected": result["conflicts_count"],
            "clean_or_coallocated_requests": result["non_conflicts_count"],
            "conflict_percentage": round(result["conflict_percentage"], 2),
            "cross_dept_co_allocation_pairs": result["co_allocation_pairs_count"],
            "sample_conflicts": {
                k: v for i, (k, v) in enumerate(result["conflicts_map"].items()) if i < 5
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conflict detection failed: {str(e)}")

@app.get("/optimize")
def run_optimization(
    horizon: str = Query("weekly", description="Planning horizon: 'weekly' or 'monthly'"),
    start_date: str = Query("2026-09-07", description="Start date for the horizon (YYYY-MM-DD)"),
    exclude_request_ids: Optional[str] = Query(None, description="Comma-separated maintenance request IDs to exclude for what-if simulation"),
    persist_to_db: bool = Query(True, description="Whether to persist proposed blocks to Supabase database")
):
    """
    Runs multi-department corridor block optimization for the specified horizon (weekly or monthly).
    Writes resulting proposed blocks to Supabase (blocks table) with horizon, confidence,
    solver_method, and co_allocated tags when persist_to_db=True.
    Transitions included maintenance requests with status 'scored' to 'proposed'.
    """
    horizon_norm = horizon.strip().lower()
    if horizon_norm not in ("weekly", "monthly"):
        raise HTTPException(
            status_code=400,
            detail="Invalid horizon parameter. Must be either 'weekly' or 'monthly'."
        )

    try:
        import optimizer
        import importlib
        importlib.reload(optimizer)
        sb = get_supabase_client()
        result = optimizer.optimize_maintenance_blocks(
            horizon=horizon_norm,
            start_date=start_date,
            sb=sb,
            persist_to_db=persist_to_db,
            exclude_request_ids=exclude_request_ids
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.get("/corridor-matrix")
def get_corridor_matrix(
    section_id: str = Query("NDLS-GZB", description="Corridor section ID"),
    target_date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (defaults to today)")
):
    """
    Returns the unified Corridor Availability Matrix:
    - Control Office Application (COA) Passenger Time Table slots
    - Freight Operations Information System (FOIS) Goods Forecast slots
    - Computed safe maintenance white-space windows (with signalling headway & isolation buffers)
    - Available track capacity hours for maintenance
    """
    sb = get_supabase_client()
    today_str = (target_date or datetime.now(tz=timezone.utc).strftime("%Y-%m-%d")).split("T")[0]

    start_iso = f"{today_str}T00:00:00+00:00"
    end_iso = f"{today_str}T23:59:59+00:00"

    try:
        tt_res = sb.table("timetable_slots") \
                   .select("*") \
                   .eq("section_id", section_id) \
                   .gte("scheduled_arrival", start_iso) \
                   .lte("scheduled_arrival", end_iso) \
                   .order("scheduled_arrival") \
                   .execute()
        raw_slots = tt_res.data or []
    except Exception as e:
        raw_slots = []

    from corridor_availability import (
        compute_available_windows,
        SECTION_SIGNALLING_TYPE,
        HEADWAY_BY_SIGNALLING_TYPE,
        DEFAULT_HEADWAY_MINUTES
    )

    windows = compute_available_windows(section_id=section_id, target_date=today_str, sb=sb)
    sig_type = SECTION_SIGNALLING_TYPE.get(section_id, "absolute_block")
    headway = HEADWAY_BY_SIGNALLING_TYPE.get(sig_type, DEFAULT_HEADWAY_MINUTES)

    passenger_slots = []
    goods_slots = []

    for s in raw_slots:
        is_forecast = bool(s.get("is_forecast", False))
        slot_item = {
            "id": s.get("id"),
            "train_number": s.get("train_number") or ("GOODS-FOIS" if is_forecast else "PASSENGER"),
            "train_type": "Goods Freight (FOIS Forecast)" if is_forecast else "Passenger / Express (COA Timetable)",
            "scheduled_arrival": s.get("scheduled_arrival"),
            "scheduled_departure": s.get("scheduled_departure"),
            "is_forecast": is_forecast,
            "confidence": float(s.get("confidence") or (0.75 if is_forecast else 0.98))
        }
        if is_forecast:
            goods_slots.append(slot_item)
        else:
            passenger_slots.append(slot_item)

    total_window_mins = sum(w.get("duration_minutes", 0) for w in windows)

    return {
        "status": "success",
        "section_id": section_id,
        "date": today_str,
        "signalling_type": sig_type.replace("_", " ").title(),
        "headway_buffer_minutes": headway,
        "passenger_trains_count": len(passenger_slots),
        "goods_trains_count": len(goods_slots),
        "total_trains_count": len(raw_slots),
        "available_windows_count": len(windows),
        "available_capacity_hours": round(total_window_mins / 60.0, 1),
        "passenger_slots": passenger_slots,
        "goods_slots": goods_slots,
        "available_windows": windows
    }

# ==============================================================================
# FIELD EXECUTION & BLOCK APPROVAL ENDPOINTS (SERVICE ROLE BYPASS FOR RLS)
# ==============================================================================

class UpdateRequestStatusPayload(BaseModel):
    id: str
    status: str
    possession_start_time: Optional[str] = None
    track_fit_status: Optional[str] = None

@app.post("/update-request-status")
def update_request_status(payload: UpdateRequestStatusPayload):
    sb = get_supabase_client()
    update_data: Dict[str, Any] = {"status": payload.status}
    if payload.possession_start_time is not None:
        update_data["possession_start_time"] = payload.possession_start_time
    if payload.track_fit_status is not None:
        update_data["track_fit_status"] = payload.track_fit_status

    res = sb.table("maintenance_requests").update(update_data).eq("id", payload.id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail=f"Request {payload.id} not found or update failed")

    # Automatically synchronize parent block status in blocks table
    if payload.status in ("in_progress", "completed"):
        try:
            import json as _json
            b_res = sb.table("blocks").select("id, request_ids").contains("request_ids", _json.dumps([payload.id])).execute()
            if b_res.data:
                for b in b_res.data:
                    sb.table("blocks").update({"status": payload.status}).eq("id", b["id"]).execute()
        except Exception as b_err:
            print(f"[WARN] Could not update parent block status: {b_err}")

    return {"status": "success", "data": res.data[0]}

class ApproveBlockPayload(BaseModel):
    block_id: str
    approved_by: Optional[str] = None

@app.post("/approve-block")
def approve_block(payload: ApproveBlockPayload):
    sb = get_supabase_client()
    b_res = sb.table("blocks").update({
        "status": "approved",
        "approved_by": payload.approved_by
    }).eq("id", payload.block_id).execute()

    if not b_res.data:
        raise HTTPException(status_code=404, detail=f"Block {payload.block_id} not found")

    block_data = b_res.data[0]
    req_ids = block_data.get("request_ids") or []
    if req_ids:
        sb.table("maintenance_requests").update({"status": "scheduled"}).in_("id", req_ids).execute()

    # Compliance: Write immutable audit record
    try:
        sb.table("audit_log").insert({
            "action": "APPROVE_BLOCK",
            "entity": f"Block {payload.block_id}",
            "user_id": payload.approved_by or "SECTION_CONTROLLER",
            "timestamp": datetime.now(tz=timezone.utc).isoformat()
        }).execute()
    except Exception as a_err:
        print(f"[WARN] Failed to write audit log for block {payload.block_id}: {a_err}")

    return {"status": "success", "block": block_data}

@app.post("/approve-all-blocks")
def approve_all_blocks(payload: Dict[str, Any] = {}):
    sb = get_supabase_client()
    prop_res = sb.table("blocks").select("id, request_ids").eq("status", "proposed").execute()
    blocks = prop_res.data or []
    
    if not blocks:
        return {
            "status": "success",
            "approved_blocks_count": 0,
            "scheduled_requests_count": 0,
            "message": "No proposed blocks found to approve"
        }

    block_ids = [b["id"] for b in blocks]
    all_req_ids = []
    for b in blocks:
        req_ids = b.get("request_ids") or []
        all_req_ids.extend(req_ids)

    # Perform high-performance batch updates instead of N sequential round-trips
    sb.table("blocks").update({"status": "approved"}).in_("id", block_ids).execute()

    if all_req_ids:
        sb.table("maintenance_requests").update({"status": "scheduled"}).in_("id", all_req_ids).execute()

    # Compliance: Write immutable batch audit record
    approver = payload.get("approved_by") or "SECTION_CONTROLLER"
    try:
        sb.table("audit_log").insert({
            "action": "APPROVE_ALL_BLOCKS",
            "entity": f"Batch Approval: {len(block_ids)} Blocks ({len(all_req_ids)} Requests)",
            "user_id": approver,
            "timestamp": datetime.now(tz=timezone.utc).isoformat()
        }).execute()
    except Exception as a_err:
        print(f"[WARN] Failed to write batch audit log: {a_err}")

    return {
        "status": "success",
        "approved_blocks_count": len(block_ids),
        "scheduled_requests_count": len(all_req_ids)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

