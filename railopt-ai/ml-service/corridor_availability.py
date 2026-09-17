import os
import sys
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Union, Tuple
import dateutil.parser
import dotenv
from supabase import create_client, Client

# Ensure stdout supports unicode on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# ==============================================================================
# MODELING ASSUMPTIONS & NAMED SAFETY CONSTANTS
# ==============================================================================
# Headway now varies by signalling type per section — no longer a single constant.
# These values are documented engineering approximations for scheduling decision-support.

# IMPROVED: Section-level signalling type mapping
# Absolute Block: 1 train in section at a time (most single-line sections in India)
# Automatic Signalling: 4-aspect, high-density trunk routes
# Suburban EMU: Dense suburban networks (Mumbai, Delhi, Kolkata, Chennai)
SECTION_SIGNALLING_TYPE = {
    "NDLS-GZB": "suburban_emu",       # Delhi suburban
    "CSMT-KYN": "suburban_emu",       # Mumbai suburban  
    "HWH-BWN": "automatic",           # Howrah-Barddhaman trunk
    "MAS-AJJ": "suburban_emu",        # Chennai suburban
    "ADI-BRC": "automatic",           # Western trunk
    "ALD-MGS": "automatic",           # Northern/Eastern trunk
    "BZA-VSKP": "automatic",          # East Coast trunk
    "BPL-ET": "automatic",            # Central trunk
    "SBC-JTJ": "automatic",           # Southern trunk
    "PUNE-DD": "absolute_block",      # Central route
    "LKO-CNB": "absolute_block",      # Northern
    "NGP-BSL": "absolute_block",      # Central
    "JP-AII": "absolute_block",       # North-Western
    "TVC-QLN": "absolute_block",      # Southern coastal
    "GHY-NJP": "absolute_block",      # Northeast Frontier
}

# Headway in minutes per signalling type
HEADWAY_BY_SIGNALLING_TYPE = {
    "suburban_emu": 5,       # 4-5 min headway on EMU suburban networks
    "automatic": 8,          # ~8 min on 4-aspect automatic signalling trunk routes
    "absolute_block": 30,    # 1 train per block section — 30 min buffer
}

DEFAULT_HEADWAY_MINUTES = 15        # Fallback for unknown sections
TRACTION_ISOLATION_MINUTES = 25     # OHE power-off, discharge & earthing time
MIN_WINDOW_MINUTES = 20             # Minimum usable window duration


def get_section_headway(section_id: str) -> int:
    """Return appropriate headway buffer in minutes based on section's signalling type."""
    sig_type = SECTION_SIGNALLING_TYPE.get(section_id, "absolute_block")
    return HEADWAY_BY_SIGNALLING_TYPE.get(sig_type, DEFAULT_HEADWAY_MINUTES)


def get_goods_confidence(slot: dict, days_ahead: int) -> float:
    """
    IMPROVED: Goods train path confidence decays with planning horizon.
    FOIS (Freight Operations Information System) only gives reliable 48-hour paths.
    Beyond that, goods paths are speculative.
    Previously: uniform 0.70-0.85 for all horizon days — incorrect.
    """
    if not slot.get("is_forecast", False):
        return float(slot.get("confidence") or 0.98)  # Fixed passenger trains: high confidence
    
    # Goods forecast: time-decay
    if days_ahead <= 2:
        return 0.85   # FOIS advance path — reliable
    elif days_ahead <= 7:
        return 0.70   # Weekly forecast — moderately reliable
    elif days_ahead <= 14:
        return 0.55   # Fortnight — speculative
    else:
        return 0.40   # Monthly — near-speculative (use cautiously in block plans)

def get_supabase_client() -> Client:
    """Initialize and return Supabase client using service role key from .env"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, ".env")
    if os.path.exists(env_path):
        dotenv.load_dotenv(env_path)
    else:
        dotenv.load_dotenv()

    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in ml-service/.env"
        )

    return create_client(supabase_url, supabase_key)

def compute_available_windows(
    section_id: str,
    target_date: Union[str, datetime, date],
    request_department: Optional[str] = None,
    sb: Optional[Client] = None,
    prefetched_slots: Optional[List[Dict[str, Any]]] = None,
    prefetched_approved_blocks: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Computes free time gaps (available maintenance block windows) for a corridor section on a given date.
    """
    if sb is None and (prefetched_slots is None or prefetched_approved_blocks is None):
        sb = get_supabase_client()

    # Normalize target date and boundaries
    if isinstance(target_date, str):
        date_str = target_date.split("T")[0]
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    elif isinstance(target_date, datetime):
        date_obj = target_date.date()
        date_str = date_obj.strftime("%Y-%m-%d")
    else:
        date_obj = target_date
        date_str = date_obj.strftime("%Y-%m-%d")

    day_start = dateutil.parser.parse(f"{date_str}T00:00:00+00:00")
    day_end = dateutil.parser.parse(f"{date_str}T23:59:59+00:00")

    # 1. Fetch or filter timetable slots
    if prefetched_slots is not None:
        slots = [
            s for s in prefetched_slots
            if s.get("section_id") == section_id and s.get("scheduled_arrival", "").startswith(date_str)
        ]
    else:
        tt_res = sb.table("timetable_slots")\
                   .select("*")\
                   .eq("section_id", section_id)\
                   .gte("scheduled_arrival", f"{date_str}T00:00:00+00:00")\
                   .lte("scheduled_arrival", f"{date_str}T23:59:59+00:00")\
                   .execute()
        slots = tt_res.data or []

    # 2. Fetch or filter already-approved blocks
    if prefetched_approved_blocks is not None:
        approved_blocks = [
            b for b in prefetched_approved_blocks
            if b.get("section_id") == section_id
        ]
    else:
        approved_blocks = []
        try:
            b_res = sb.table("blocks")\
                      .select("*")\
                      .eq("section_id", section_id)\
                      .eq("status", "approved")\
                      .execute()
            approved_blocks = b_res.data or []
        except Exception:
            approved_blocks = []

    # 3. Build occupied intervals with improved, section-aware safety buffers
    occupied_intervals = []

    # Get section-specific headway based on signalling type
    section_headway = get_section_headway(section_id)

    # Determine days_ahead for goods confidence decay
    today = datetime.now().date()
    days_ahead = (date_obj - today).days

    # Add train slots with headway buffers
    for slot in slots:
        arr_time = dateutil.parser.parse(slot["scheduled_arrival"])
        dep_time = dateutil.parser.parse(slot["scheduled_departure"])

        # Apply section-aware headway (not a single global constant)
        buffered_start = arr_time - timedelta(minutes=section_headway)
        buffered_end = dep_time + timedelta(minutes=section_headway)

        # IMPROVED: Goods confidence decays with planning horizon
        conf = get_goods_confidence(slot, max(0, days_ahead))
        is_forecast = bool(slot.get("is_forecast", False))

        occupied_intervals.append({
            "start": buffered_start,
            "end": buffered_end,
            "raw_start": arr_time,
            "raw_end": dep_time,
            "type": "train_slot",
            "is_forecast": is_forecast,
            "confidence": conf,
            "source_id": slot.get("id"),
            "train_number": slot.get("train_number")
        })

    # Add already-approved blocks with headway buffers
    for blk in approved_blocks:
        b_start_val = blk.get("start_time") or blk.get("scheduled_start") or blk.get("requested_window_start")
        b_end_val = blk.get("end_time") or blk.get("scheduled_end") or blk.get("requested_window_end")
        if not b_start_val or not b_end_val:
            continue

        b_start = dateutil.parser.parse(str(b_start_val))
        b_end = dateutil.parser.parse(str(b_end_val))

        # Check if block falls within target date
        if b_start.date() == date_obj or b_end.date() == date_obj:
            buffered_b_start = b_start - timedelta(minutes=DEFAULT_HEADWAY_MINUTES)
            buffered_b_end = b_end + timedelta(minutes=DEFAULT_HEADWAY_MINUTES)
            occupied_intervals.append({
                "start": buffered_b_start,
                "end": buffered_b_end,
                "raw_start": b_start,
                "raw_end": b_end,
                "type": "approved_block",
                "is_forecast": False,
                "confidence": 1.0,
                "source_id": blk.get("id")
            })

    # Sort occupied intervals by start time
    occupied_intervals.sort(key=lambda x: x["start"])

    # 4. Merge overlapping occupied intervals
    merged_occupied = []
    for interval in occupied_intervals:
        # Clamp within the day boundaries
        clamped_start = max(day_start, interval["start"])
        clamped_end = min(day_end, interval["end"])
        if clamped_start >= clamped_end:
            continue

        if not merged_occupied:
            merged_occupied.append({
                "start": clamped_start,
                "end": clamped_end,
                "intervals": [interval]
            })
        else:
            prev = merged_occupied[-1]
            if clamped_start <= prev["end"]:
                # Overlapping or contiguous: merge
                prev["end"] = max(prev["end"], clamped_end)
                prev["intervals"].append(interval)
            else:
                merged_occupied.append({
                    "start": clamped_start,
                    "end": clamped_end,
                    "intervals": [interval]
                })

    # 5. Compute available gaps between merged occupied intervals
    available_windows = []
    current_pointer = day_start

    is_traction = (
        request_department is not None and 
        "traction" in request_department.lower()
    )

    for occ in merged_occupied:
        gap_start = current_pointer
        gap_end = occ["start"]

        if gap_end > gap_start:
            # Found a free time gap
            # Apply traction isolation buffer if requested
            if is_traction:
                candidate_start = gap_start + timedelta(minutes=TRACTION_ISOLATION_MINUTES)
                candidate_end = gap_end - timedelta(minutes=TRACTION_ISOLATION_MINUTES)
            else:
                candidate_start = gap_start
                candidate_end = gap_end

            duration_mins = int((candidate_end - candidate_start).total_seconds() / 60)

            if duration_mins >= MIN_WINDOW_MINUTES:
                # Determine confidence: check if adjacent bounding intervals contain goods forecasts
                bounding_forecasts = [i for i in occ["intervals"] if i.get("is_forecast", False)]
                if bounding_forecasts:
                    # Lower confidence because gap edge depends on forecasted goods path
                    conf = round(min(i["confidence"] for i in bounding_forecasts), 2)
                    reliance_note = "Adjacent to Goods Forecast Slot"
                else:
                    conf = 0.95
                    reliance_note = "High Confidence (Fixed Passenger / Clean Gap)"

                available_windows.append({
                    "start": candidate_start.isoformat(),
                    "end": candidate_end.isoformat(),
                    "raw_gap_start": gap_start.isoformat(),
                    "raw_gap_end": gap_end.isoformat(),
                    "duration_minutes": duration_mins,
                    "confidence": conf,
                    "is_traction_buffered": is_traction,
                    "traction_isolation_applied_mins": TRACTION_ISOLATION_MINUTES if is_traction else 0,
                    "headway_buffer_mins": DEFAULT_HEADWAY_MINUTES,
                    "reliance_note": reliance_note
                })

        current_pointer = max(current_pointer, occ["end"])

    # Final gap from last occupied interval to day end
    if day_end > current_pointer:
        gap_start = current_pointer
        gap_end = day_end

        if is_traction:
            candidate_start = gap_start + timedelta(minutes=TRACTION_ISOLATION_MINUTES)
            candidate_end = gap_end - timedelta(minutes=TRACTION_ISOLATION_MINUTES)
        else:
            candidate_start = gap_start
            candidate_end = gap_end

        duration_mins = int((candidate_end - candidate_start).total_seconds() / 60)
        if duration_mins >= MIN_WINDOW_MINUTES:
            available_windows.append({
                "start": candidate_start.isoformat(),
                "end": candidate_end.isoformat(),
                "raw_gap_start": gap_start.isoformat(),
                "raw_gap_end": gap_end.isoformat(),
                "duration_minutes": duration_mins,
                "confidence": 0.95,
                "is_traction_buffered": is_traction,
                "traction_isolation_applied_mins": TRACTION_ISOLATION_MINUTES if is_traction else 0,
                "headway_buffer_mins": DEFAULT_HEADWAY_MINUTES,
                "reliance_note": "High Confidence (End of Operational Day)"
            })

    return available_windows

if __name__ == "__main__":
    print("=" * 70)
    print("      RailOpt AI - Corridor Availability Window Engine")
    print("=" * 70)
    test_section = "NDLS-GZB"
    test_date = "2026-09-07"

    print(f"\nEvaluating section: {test_section} on Date: {test_date}")
    print(f"Safety Buffer Constants:")
    print(f"  - DEFAULT_HEADWAY_MINUTES    : {DEFAULT_HEADWAY_MINUTES} mins")
    print(f"  - TRACTION_ISOLATION_MINUTES : {TRACTION_ISOLATION_MINUTES} mins (for Traction Distribution)")
    print(f"  - MIN_WINDOW_MINUTES         : {MIN_WINDOW_MINUTES} mins")

    # Run 1: Standard Department (Engineering / S&T)
    std_windows = compute_available_windows(test_section, test_date, request_department="Engineering")
    
    # Run 2: Traction Distribution Department (with OHE isolation buffers)
    trd_windows = compute_available_windows(test_section, test_date, request_department="Traction Distribution")

    print("\n" + "-" * 70)
    print(f" 1. STANDARD DEPARTMENT (e.g. Engineering) — {len(std_windows)} AVAILABLE WINDOWS")
    print("-" * 70)
    for idx, w in enumerate(std_windows, 1):
        s_time = dateutil.parser.parse(w["start"]).strftime("%H:%M")
        e_time = dateutil.parser.parse(w["end"]).strftime("%H:%M")
        print(f"  Window #{idx:02d}: {s_time} - {e_time} ({w['duration_minutes']:3d} mins) | Conf: {w['confidence']:.2f} | {w['reliance_note']}")

    print("\n" + "-" * 70)
    print(f" 2. TRACTION DISTRIBUTION (with +25m OHE Isolation) — {len(trd_windows)} AVAILABLE WINDOWS")
    print("-" * 70)
    for idx, w in enumerate(trd_windows, 1):
        s_time = dateutil.parser.parse(w["start"]).strftime("%H:%M")
        e_time = dateutil.parser.parse(w["end"]).strftime("%H:%M")
        print(f"  Window #{idx:02d}: {s_time} - {e_time} ({w['duration_minutes']:3d} mins) | Conf: {w['confidence']:.2f} | {w['reliance_note']}")

    print("\n" + "=" * 70)
    print("                    SIDE-BY-SIDE BUFFER IMPACT")
    print("=" * 70)
    print(f"  Standard Available Windows Found   : {len(std_windows)}")
    print(f"  Traction Available Windows Found  : {len(trd_windows)}")
    if std_windows and trd_windows:
        diff_mins = std_windows[0]["duration_minutes"] - trd_windows[0]["duration_minutes"]
        print(f"  First Window Usable Duration Shift : {std_windows[0]['duration_minutes']} mins -> {trd_windows[0]['duration_minutes']} mins (Δ = {diff_mins} mins OHE clearance)")
    print("=" * 70)
