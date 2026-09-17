# Product Requirements Document (PRD)
## RailOpt AI — AI-Powered Automatic Block Planning for Indian Railways

**Problem Statement ID:** 26027 | **Theme:** Transportation & Logistics | **PS Category:** Software
**Event:** Smart India Hackathon 2026
**Document version:** 2.0 (consolidated — includes build-priority strategy)

---

## 1. Purpose

Railway maintenance for fixed infrastructure (Engineering, Traction Distribution, and Signal & Telecommunication) is currently planned independently by each department through the BDMS system. This decentralized, manual process leads to inefficient block utilization, poor cross-department coordination, and suboptimal scheduling — reducing asset availability and impacting train operations.

RailOpt AI integrates maintenance data, defect records, and corridor/timetable availability to generate optimized, conflict-free maintenance block schedules — transforming manual planning into a data-driven, coordinated process, while keeping railway authorities in final control.

---

## 2. Goals

- Unify fragmented maintenance data from Engineering (TMS), Signal & Telecom (SMMS), and Traction Distribution (TDMS)
- Prioritize and schedule maintenance based on the three PS-named factors: **criticality**, **urgency**, and **impact on asset availability**
- Optimize block scheduling against real train timetable and goods forecast constraints
- Provide block plans across **weekly** and **monthly** time horizons
- Preserve human-in-the-loop approval at every scheduling decision

---

## 3. Users and Roles

| Role | Description | Key actions |
|---|---|---|
| **Department User** (Engineering / S&T / Traction) | Submits maintenance/defect requests | Submit request, view own request status |
| **Admin / Section Controller** | Reviews scores and plans, makes final call | View risk-scored queue, resolve conflicts, generate/approve block plans, view reports |

Role and department are assigned at signup and enforced via Supabase Row-Level Security.

---

## 4. Scope

### 4.1 In Scope (MVP)
1. Maintenance request submission (proxy for TMS/SMMS/TDMS input)
2. AI-based risk/priority scoring on all 3 PS-named factors
3. Automated cross-department conflict detection
4. Corridor availability from train timetable + goods forecast data
5. Constraint-based block optimization (OR-Tools), weekly and monthly
6. Human-in-the-loop approval workflow with audit logging
7. Block calendar visualization (weekly/monthly toggle)
8. Basic impact/reports dashboard

### 4.2 Out of Scope (Future Work)
- Self-learning/continuously retrained models
- Real-time emergency re-planning
- IoT sensor integration
- Nationwide/multi-zone deployment
- Live integration with real TMS/SMMS/TDMS/COA/FOIS systems (MVP uses clearly disclosed synthetic/proxy data)

---

## 5. Functional Requirements

### FR1 — Data Ingestion
Users submit maintenance requests (defect type, section, department, urgency, requested window). System maintains corridor availability data combining fixed timetable slots and goods forecast slots.

### FR2 — AI Risk/Priority Scoring
Risk score (0–1) computed from **criticality** (asset stress/type), **urgency** (overdue days), and **impact on asset availability** (section traffic density) — all three explicitly required by the PS text. Feature importance must be exposed per score, not just the number.

### FR3 — Conflict Detection
Automatic flagging of requests overlapping in time and section, visible to admins before optimization.

### FR4 — Block Schedule Optimization
Schedule fits available corridor windows, avoids double-booking, maximizes risk-weighted value scheduled. Supports weekly and monthly horizons as genuinely distinct outputs. Falls back to a rule-based scheduler if the solver times out.

### FR5 — Human-in-the-Loop Approval
Admins approve, reject, or reschedule proposed blocks. Every action logged to an audit trail.

### FR6 — Block Calendar
Weekly/monthly toggle, color-coded by department, live-updating via realtime subscription.

### FR7 — Reporting
Summary metrics: requests submitted vs. scheduled, conflicts detected vs. resolved, average risk score of scheduled vs. unscheduled.

### FR8 — Access Control
Department users restricted to their own department's data; admins have full visibility.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Transparency | AI-driven scores and plans must be explainable to a non-technical railway authority |
| Data honesty | Any synthetic/proxy data must be explicitly disclosed, never presented as real |
| Reliability | Optimizer must always produce a plan within a bounded time (fallback required) |
| Usability | Core workflow completable without external documentation |
| Auditability | Every schedule-affecting decision logged |
| Design consistency | All UI screens share one visual design system, not ad-hoc per-screen styling |

---

## 7. System Architecture

**Frontend:** React, UI screens designed via Stitch (AI UI generation, MCP-connected) using a single extracted design system, then wired to live data
**Backend:** Supabase (Postgres, Auth, RLS, Realtime) — schema, policies, and seeding managed via Supabase MCP with full read/write access
**Intelligence layer:** Python FastAPI service hosting an XGBoost risk model, conflict detection logic, and an OR-Tools CP-SAT optimizer with rule-based fallback
**Tooling:** Antigravity (agentic IDE) orchestrates the build across all of the above via connected MCPs

**Data flow:**
Maintenance requests + corridor/timetable data → Risk scoring → Conflict detection → Constraint optimization (weekly/monthly) → Admin approval → Block calendar + audit log + reports

**Security boundary:** Supabase anon key used client-side (frontend) under RLS; service_role key used only server-side (ml-service), never exposed to the browser.

---

## 8. Data Sources

| Purpose | Source | Status |
|---|---|---|
| Risk model training | AI4I 2020 Predictive Maintenance Dataset (UCI) | Real, relabeled for railway defect categories |
| Asset degradation (optional) | NASA C-MAPSS Turbofan Degradation Dataset | Real, optional/secondary |
| Section/zone naming | Curated list of real Indian Railways corridor names | Reference only |
| Train timetable | Synthesized, realistic frequency patterns | Synthetic — real TMS/SMMS/TDMS/COA feeds unavailable |
| Goods train forecast (FOIS) | Synthesized | Synthetic — no public source exists |

This dual-sourcing must be stated explicitly in the submission and demo narrative.

---

## 9. Build Priority Strategy (risk-mitigated sequencing)

Given hackathon time constraints and the number of integrated tools (Antigravity, Supabase MCP, Stitch MCP, OR-Tools, XGBoost), the build follows a **protect-the-core-first** sequence rather than building all layers in parallel:

| Priority | Component | Rationale |
|---|---|---|
| **P0 — must work** | Data generation, risk model, OR-Tools optimizer | This is the direct, literal answer to all 4 numbered PS requirements. Must be demonstrable even via raw API calls if nothing else is ready. |
| **P1 — should work** | Supabase schema/RLS/seeding, basic functional UI (plain forms, no polish) | Proves the loop is real and end-to-end, not just isolated scripts. |
| **P2 — nice to have** | Stitch-generated polished UI across all 7 screens | Improves demo impression but must not come at the cost of P0/P1. If time runs short, fall back to a plain component library rather than leaving screens half-wired. |

**Checkpoint rule:** after each phase, confirm a working, demonstrable state exists before proceeding — do not move to UI polish if the optimizer isn't yet reliably producing valid weekly/monthly plans.

---

## 10. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Data quality/availability issues | Ingestion validation; synthetic data clearly documented |
| AI prediction reliability on synthetic data | Human validation step before any block is finalized |
| Optimizer solver timeout | Deterministic rule-based fallback scheduler |
| Cross-department scheduling conflicts | Automated conflict detection before optimization |
| Tool-chain fragility (multiple MCPs coordinated via natural language) | Verify each MCP's write access before depending on it; keep a manual fallback path (direct SQL/API calls) if an MCP step fails |
| Stitch placeholder data shipped as real | Explicit review step after UI export confirming all displayed data comes from live Supabase/ml-service, not generated sample content |
| Judge scrutiny of "real vs. simulated" claims | Explicit, upfront disclosure in documentation and demo narrative |
| Running out of time before UI polish | P0/P1/P2 priority sequencing ensures a demoable core exists regardless of UI completion state |

---

## 11. Success Criteria for Demo Day

- [ ] Risk score demonstrably reflects all 3 PS-named factors (can show feature importance on request)
- [ ] A live conflict can be created and shown flagged before optimization
- [ ] Optimizer produces different, valid plans for weekly vs. monthly horizons on demand
- [ ] Admin can approve a plan and see it reflected on the calendar without a page refresh
- [ ] Every screen the judge sees is backed by real data, not placeholder/mock content
- [ ] Team can clearly state, if asked, which data is real (AI4I 2020) and which is synthesized (corridor/timetable/goods forecast) — no ambiguity

---

## 12. Open Questions
- Should the live demo include a real-time "what-if" re-optimization, or is this described but not shown live if time is short?
- What is the acceptable optimizer runtime for a judge-facing demo before the fallback path visibly kicks in?
- Should audit logs be shown in the UI during the demo, or only described verbally if time is limited?

---

*This PRD reflects the MVP scope and build strategy for Smart India Hackathon 2026. Future-phase items (self-learning models, IoT integration, nationwide scaling) are intentionally excluded and should appear only under "Future Scope" in pitch materials.*
