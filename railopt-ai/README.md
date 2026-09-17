# RailOpt AI: AI-Powered Automatic Block Planning for Indian Railways

RailOpt AI is an intelligent block planning and maintenance coordination decision-support system developed for **Smart India Hackathon (SIH) Problem Statement 26027**. The system automates the ingestion, ML-driven risk scoring, spatial-temporal conflict detection, and corridor slot optimization for multi-departmental railway maintenance requests. By combining predictive machine learning with constraint-based corridor scheduling and safety buffer enforcement, RailOpt AI eliminates scheduling silos, prevents double-booking, and maximizes track reliability while minimizing passenger and freight disruption.

---

## Architecture Overview

- **Frontend**: React + Vite single-page application with modern responsive dashboards, timetable viewers, plan evaluators, and department-specific submission portals.
- **Backend / ML Service**: FastAPI Python service running XGBoost risk evaluation models, spatial-temporal conflict detection algorithms, and multi-objective corridor slot optimizers.
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) across all 7 operational tables, role-based access control, and complete audit logging.

---

## Setup & Running Instructions

### 1. Environment Variables

#### Frontend (`frontend/.env`)
The frontend requires only the public Supabase anonymous key:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### ML & Optimization Service (`ml-service/.env`)
The backend service requires elevated service role permissions to write scores, audit logs, and optimized schedules:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> **Security Note**: `frontend/.env` contains **only** the `anon` key. The privileged `service_role` key is strictly restricted to the backend `ml-service/.env`.

---

### 2. Running Locally

#### ML Service (FastAPI)
```bash
# Navigate to ml-service
cd railopt-ai/ml-service

# Install dependencies
pip install -r requirements.txt

# Train the risk model artifact (if not already built)
python train_risk_model.py

# Start the development server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
The API documentation is available at `http://localhost:8000/docs` and health check at `http://localhost:8000/health`.

#### Frontend (React + Vite)
```bash
# Navigate to frontend
cd railopt-ai/frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The application will launch at `http://localhost:5173`.

---

### 3. Running via Docker Compose

To build and run both the ML backend service and the frontend container simultaneously:

```bash
cd railopt-ai
docker compose up --build
```

- Frontend: `http://localhost:5173`
- ML Service: `http://localhost:8000`

---

### 4. Database Reset & Demo Baseline Pipeline

To reset the database back to a clean, fresh demo baseline at any time:

```bash
# Navigate to workspace root
cd railopt-ai

# Run the canonical reset script
python scripts/reset_demo_data.py
```

- **Canonical Reset Tool (`scripts/reset_demo_data.py`)**: Wipes `maintenance_requests`, `blocks`, and `audit_log`, re-seeds the full dataset from `maintenance_requests_seed.csv` (2,002 requests), runs bulk XGBoost scoring and conflict detection, and generates 15 baseline weekly proposed blocks with 0 audit log entries.
- **Fast One-Off Utility (`scripts/reset_clean_baseline.py`)**: A lightweight script for rapid in-place status resets without re-reading CSV files.

---

## Data Sources: Real vs. Synthesized Disclosure

In compliance with rigorous engineering and academic standards, the origins of all data used in RailOpt AI are disclosed below:

1. **Risk Prediction Model (Real UCI Dataset with Railway Mapping)**:
   - The ML model is trained on the real **AI4I 2020 Predictive Maintenance Dataset** from the UCI Machine Learning Repository.
   - Features (air/process temperatures, rotational speeds, torque, tool wear) and failure modes (Tool Wear Failure, Heat Dissipation Failure, Power Failure, Overstrain Failure, Random Failures) are mathematically mapped to Indian Railways asset defect classes across **Engineering (`track_defect`)**, **Signal & Telecom (`signal_fault`)**, and **Traction Distribution (`traction_fault`)**.
   - The model evaluates requests across the three key dimensions mandated by SIH PS 26027:
     - **Criticality** (severity of physical failure mode)
     - **Urgency** (progression rate towards catastrophic line blockage)
     - **Impact on Asset Availability** (derived from section traffic density, daily train movements, and asset stress index)

2. **Corridor Timetables, Goods Forecasts (FOIS), and Operational Feeds (Synthesized)**:
   - Indian Railways operational feeds—including Control Office Application (**COA**), Train Management System (**TMS**), Track Degradation Management System (**TDMS**), Signalling Maintenance Management System (**SMMS**), and Freight Operations Information System (**FOIS**)—are internal enterprise systems without public APIs or open data access.
   - Consequently, all corridor station master topologies, train timetables, headway distributions, and goods loading forecasts have been **synthesized with realistic probability distributions and domain-accurate railway constraints** to enable end-to-end operational simulation.

---

## Modeling Assumptions & Engineering Disclosures

1. **Safety Headway & Traction Isolation Buffers**:
   - The corridor availability engine applies a **15-minute default headway buffer** before and after train movements, alongside an additional **25-minute traction isolation buffer** for Electrical (TRD) maintenance requiring OHE shutoff, discharge, and earthing.
   - *Disclosure*: These safety margins are simplified, documented engineering approximations for decision-support modeling, not certified signalling or high-voltage electrical safety calculations.

2. **Cross-Departmental Co-Allocation**:
   - When multiple departments (e.g., Engineering and Traction Distribution) request maintenance on the same section during overlapping or adjacent time windows, the optimizer bundles them into a single shared shadow block (`co_allocated = true`).
   - *Disclosure*: Co-allocation is determined via algorithmic spatial-temporal overlap and non-conflicting equipment footprints, rather than an exhaustive safety compatibility matrix of every physical tool interaction.

3. **Stateful Across Planning Horizons (No Double-Booking)**:
   - RailOpt AI is strictly **stateful**: approved blocks from an earlier planning run (e.g., weekly tactical plan) are permanently blocked in the corridor availability model. Later runs (e.g., monthly strategic plans) and new ad-hoc emergency requests cannot claim these occupied slots.

4. **Class Rebalancing & Optimization Shift Policy**:
   - The risk model training set retains all 339 real AI4I failure cases with random undersampling of normal cases to reach 2,000 balanced rows (raising critical defect representation to ~17%) and applies `scale_pos_weight ≈ 4.9` in XGBoost. This deliberately prioritizes defect recall (69% catch rate) over precision, reflecting safety-critical railway operations where missing a severe track defect is impermissible.
   - Requested maintenance windows are treated as soft preferences: the optimizer scans the full 7- or 30-day horizon with a proximity weighting function to discover genuine operational gaps between scheduled trains.

---

## Tooling & Architecture Management

- **Database Engineering**: Schema design, 7-table relational modeling, migration tracking, and Row Level Security (RLS) policies were designed and managed using the **Supabase MCP** tool.
- **UI/UX Design System**: High-fidelity screen designs, component tokens, responsive layouts, and user workflows were developed and integrated using the **Stitch MCP** tool.
