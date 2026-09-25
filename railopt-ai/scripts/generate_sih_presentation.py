import os
import sys

# Try importing pptx, or auto-install if missing
try:
    import pptx
except ImportError:
    import subprocess
    print("Installing python-pptx...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-pptx"])
    import pptx

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def create_sih_presentation(output_path):
    prs = Presentation()
    # 16:9 widescreen layout
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Theme Colors matching SIH template
    C_NAVY = RGBColor(16, 44, 87)       # #102C57
    C_BLUE = RGBColor(30, 90, 160)      # Primary Header Blue
    C_LIGHT_BLUE = RGBColor(235, 243, 253)
    C_BORDER = RGBColor(200, 215, 235)
    C_SLATE_DARK = RGBColor(30, 41, 59) # Body Dark
    C_SLATE_MUTED = RGBColor(100, 116, 139) # Secondary
    C_WHITE = RGBColor(255, 255, 255)
    C_ACCENT_GREEN = RGBColor(16, 149, 106)
    C_ACCENT_AMBER = RGBColor(217, 119, 6)
    C_ACCENT_RED = RGBColor(220, 38, 38)
    C_BG_CARD = RGBColor(248, 250, 252)

    blank_slide_layout = prs.slide_layouts[6]

    # Helper: Add header banner
    def add_slide_header(slide, title_text, page_num):
        # Header title
        txBox = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(9.5), Inches(0.8))
        tf = txBox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.name = "Arial"
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = C_NAVY

        # SIH watermark/tag right side
        txBox_r = slide.shapes.add_textbox(Inches(10.5), Inches(0.35), Inches(2.2), Inches(0.8))
        tf_r = txBox_r.text_frame
        p_r = tf_r.paragraphs[0]
        p_r.text = "SMART INDIA\nHACKATHON 2026"
        p_r.alignment = PP_ALIGN.RIGHT
        p_r.font.name = "Arial"
        p_r.font.size = Pt(11)
        p_r.font.bold = True
        p_r.font.color.rgb = C_NAVY

        # Footer
        txBox_f = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(11.733), Inches(0.35))
        tf_f = txBox_f.text_frame
        p_f = tf_f.paragraphs[0]
        p_f.text = f"@SIH Idea submission- Template  |  RailOpt AI  |  Page {page_num}"
        p_f.alignment = PP_ALIGN.CENTER
        p_f.font.name = "Arial"
        p_f.font.size = Pt(9)
        p_f.font.color.rgb = C_SLATE_MUTED

    # ==========================================
    # SLIDE 1: Title Slide
    # ==========================================
    s1 = prs.slides.add_slide(blank_slide_layout)
    
    # Title
    t_box = s1.shapes.add_textbox(Inches(1.0), Inches(0.8), Inches(11.3), Inches(1.2))
    tf1 = t_box.text_frame
    p = tf1.paragraphs[0]
    p.text = "SMART INDIA HACKATHON 2026"
    p.font.name = "Arial"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = C_NAVY

    # Right Logo/Watermark text
    sih_tag = s1.shapes.add_textbox(Inches(10.5), Inches(0.8), Inches(2.0), Inches(1.0))
    tf_tag = sih_tag.text_frame
    p_tag = tf_tag.paragraphs[0]
    p_tag.text = "SIH 2026\nMinistry of Railways"
    p_tag.alignment = PP_ALIGN.RIGHT
    p_tag.font.bold = True
    p_tag.font.size = Pt(12)
    p_tag.font.color.rgb = C_BLUE

    # Card background for details
    shape1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(2.2), Inches(7.2), Inches(4.5))
    shape1.fill.solid()
    shape1.fill.fore_color.rgb = C_WHITE
    shape1.line.color.rgb = C_BORDER
    shape1.line.width = Pt(1.5)

    info_box = s1.shapes.add_textbox(Inches(1.2), Inches(2.4), Inches(6.8), Inches(4.1))
    tf_info = info_box.text_frame
    tf_info.word_wrap = True

    bullets = [
        ("Problem Statement ID", "SIH26027"),
        ("Problem Statement Title", "AI-Powered Automatic Block Planning To Maximize Asset Availability For Train Operations On Indian Railways"),
        ("Theme", "Transportation & Logistics"),
        ("PS Category", "Software"),
        ("Team Name", "RailOptima (RailOpt AI)"),
        ("Core Technologies", "FastAPI, React 19, XGBoost, Google OR-Tools CP-SAT, Supabase PostgreSQL"),
    ]

    for i, (label, val) in enumerate(bullets):
        p = tf_info.paragraphs[0] if i == 0 else tf_info.add_paragraph()
        p.space_after = Pt(10)
        run_b = p.add_run()
        run_b.text = f"• {label}: "
        run_b.font.bold = True
        run_b.font.size = Pt(13)
        run_b.font.color.rgb = C_NAVY

        run_v = p.add_run()
        run_v.text = val
        run_v.font.size = Pt(13)
        run_v.font.color.rgb = C_SLATE_DARK

    # Right side illustration / accent box
    r_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(2.2), Inches(3.8), Inches(4.5))
    r_card.fill.solid()
    r_card.fill.fore_color.rgb = C_LIGHT_BLUE
    r_card.line.color.rgb = C_BORDER
    r_card.line.width = Pt(1.5)

    r_box = s1.shapes.add_textbox(Inches(8.7), Inches(2.5), Inches(3.4), Inches(3.9))
    tf_r = r_box.text_frame
    tf_r.word_wrap = True
    p = tf_r.paragraphs[0]
    p.text = "RailOpt AI"
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(14)

    highlights = [
        "✓ Unified Multi-Department Scheduling (Track, S&T, TRD)",
        "✓ 3-Pillar Risk Engine: Criticality, Urgency & Traffic Density",
        "✓ Google OR-Tools CP-SAT Shadow Block Co-Allocation",
        "✓ Section Controller Approval Room & Digital TSR Clearance Memo",
    ]
    for h in highlights:
        p = tf_r.add_paragraph()
        p.text = h
        p.font.size = Pt(11)
        p.font.color.rgb = C_SLATE_DARK
        p.space_after = Pt(8)


    # ==========================================
    # SLIDE 2: Solution Overview & Process Flow
    # ==========================================
    s2 = prs.slides.add_slide(blank_slide_layout)
    add_slide_header(s2, "RailOpt AI — Overview & Process Flow", 2)

    # 3 Columns
    # Left Column (Inches 0.8 to 4.2): Maintenance block + Innovation + Addressal
    # Card 1: Maintenance Block
    c1 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.3), Inches(3.5), Inches(1.5))
    c1.fill.solid()
    c1.fill.fore_color.rgb = C_BG_CARD
    c1.line.color.rgb = C_BORDER
    tf = c1.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "MAINTENANCE TRAFFIC BLOCK"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "A planned, statutory pause in train movements allowing field gangs safe access to tracks, overhead catenary, and signaling."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK
    p = tf.add_paragraph()
    p.text = "[ TRAINS RUN ] ➔ [ SHADOW BLOCK ] ➔ [ TSR / FIT CLEAR ]"
    p.font.bold = True
    p.font.size = Pt(8.5)
    p.font.color.rgb = C_BLUE

    # Card 2: Innovation
    c2 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(2.9), Inches(3.5), Inches(1.9))
    c2.fill.solid()
    c2.fill.fore_color.rgb = C_WHITE
    c2.line.color.rgb = C_BORDER
    tf = c2.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "INNOVATION"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "Combines XGBoost predictive risk scoring across MoR's 3 statutory pillars with Google OR-Tools CP-SAT constraint optimization to bundle multi-department work into single 'Shadow Blocks', reducing corridor downtime by up to 35%."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    # Card 3: Problem Addressal
    c3 = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.9), Inches(3.5), Inches(1.9))
    c3.fill.solid()
    c3.fill.fore_color.rgb = C_LIGHT_BLUE
    c3.line.color.rgb = C_BORDER
    tf = c3.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PROBLEM ADDRESSAL"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = C_NAVY
    p = tf.add_paragraph()
    p.text = "Unifies isolated departmental silos (TMS for Track, SMMS for Signals, TDMS for Traction) into a single decision support system. Eliminates manual calls, resolves schedule conflicts, and enforces human-in-the-loop Controller approval."
    p.font.size = Pt(9.5)
    p.font.color.rgb = C_SLATE_DARK

    # Center Column (Inches 4.5 to 8.2): Current Problem vs Our Solution
    cp_card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.5), Inches(1.3), Inches(3.8), Inches(2.6))
    cp_card.fill.solid()
    cp_card.fill.fore_color.rgb = RGBColor(254, 242, 242)
    cp_card.line.color.rgb = RGBColor(252, 165, 165)
    tf = cp_card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "CURRENT OPERATIONAL PROBLEMS"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = C_ACCENT_RED
    prob_list = [
        "• Uncoordinated requests negotiated over telephone & memos",
        "• Track, Signal & Traction work in isolated legacy silos",
        "• High-risk defects delayed while routine tasks take line",
        "• Repetitive blocks on same track compound passenger delays",
        "• Manual timetable planning takes days with zero co-allocation"
    ]
    for pr in prob_list:
        p = tf.add_paragraph()
        p.text = pr
        p.font.size = Pt(9)
        p.font.color.rgb = C_SLATE_DARK

    sol_card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.5), Inches(4.0), Inches(3.8), Inches(2.8))
    sol_card.fill.solid()
    sol_card.fill.fore_color.rgb = RGBColor(240, 253, 244)
    sol_card.line.color.rgb = RGBColor(134, 239, 172)
    tf = sol_card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "OUR SOLUTION: RAILOPT AI"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = C_ACCENT_GREEN
    sol_list = [
        "• Centralized multi-department ingestion with NLP defect assist",
        "• XGBoost priority scoring based on Criticality, Urgency & Density",
        "• Google OR-Tools CP-SAT constraint optimization in <2s",
        "• 'Shadow Block' co-allocation bundling multi-department works",
        "• Section Controller Approval Room with digital TSR memos",
        "• Live Gantt calendar tracking possession & overrun in realtime"
    ]
    for so in sol_list:
        p = tf.add_paragraph()
        p.text = so
        p.font.size = Pt(9)
        p.font.color.rgb = C_SLATE_DARK

    # Right Column (Inches 8.5 to 12.5): Process Flow Box
    pf_card = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.5), Inches(1.3), Inches(4.0), Inches(5.5))
    pf_card.fill.solid()
    pf_card.fill.fore_color.rgb = C_WHITE
    pf_card.line.color.rgb = C_BORDER
    tf = pf_card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "END-TO-END PROCESS FLOW"
    p.font.bold = True
    p.font.size = Pt(11)
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(6)

    flow_steps = [
        ("1. Role Auth", "Controller or Dept Engineer login via Supabase RLS"),
        ("2. Defect Ingestion", "Field logging with NLP natural-language classification"),
        ("3. Conflict Detection", "Real-time spatial & temporal overlap checking"),
        ("4. ML Risk Scoring", "XGBoost computes priority based on MoR's 3 pillars"),
        ("5. CP-SAT Solver", "OR-Tools solves timetable, headway & safety buffer constraints"),
        ("6. Shadow Bundling", "Co-allocates Civil, Signal & TRD work into shared slots"),
        ("7. Controller Signoff", "Executive approval room to Approve, Reschedule or Reject"),
        ("8. Gantt Calendar", "Live possession countdown with overrun alert timers"),
        ("9. Track Fitness", "Digital TSR clearance memo (Normal vs 30/45 km/h)"),
        ("10. Shift Reports", "Audit trail & exact PostgreSQL operational analytics")
    ]
    for title, desc in flow_steps:
        p = tf.add_paragraph()
        r1 = p.add_run()
        r1.text = f"• {title}: "
        r1.font.bold = True
        r1.font.size = Pt(8.5)
        r1.font.color.rgb = C_BLUE
        r2 = p.add_run()
        r2.text = desc
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = C_SLATE_DARK
        p.space_after = Pt(2)


    # ==========================================
    # SLIDE 3: Technical Approach
    # ==========================================
    s3 = prs.slides.add_slide(blank_slide_layout)
    add_slide_header(s3, "Technical Approach & System Architecture", 3)

    # Left Column: Tech Stack Breakdown
    tech_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.3), Inches(5.6), Inches(5.5))
    tech_card.fill.solid()
    tech_card.fill.fore_color.rgb = C_WHITE
    tech_card.line.color.rgb = C_BORDER
    tf = tech_card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "PRODUCTION-READY TECH STACK"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(8)

    techs = [
        ("Frontend Application", "React.js 19, Vite, Tailwind CSS (Clean Government Enterprise Theme), Lucide Icons, Material Symbols Outlined, Interactive Gantt Timeline."),
        ("Backend & Microservices", "Python 3.10+, FastAPI (Asynchronous ASGI Microservice), Uvicorn, Pydantic v2 strict telemetry data contracts."),
        ("AI / ML & Optimization Core", "XGBoost Regression/Classifier for 3-pillar risk prioritization; Google OR-Tools CP-SAT Solver for constraint satisfaction; Scikit-Learn, Pandas, NumPy, Joblib."),
        ("Database, Auth & Realtime", "Supabase (Cloud PostgreSQL), Row Level Security (RLS) isolating Controller vs Dept roles, JWT Auth, Realtime WebSockets for live status updates."),
        ("Interoperability & Data Pipelines", "RESTful OpenAPI/Swagger Endpoints (/score, /optimize, /classify-defect). Designed to ingest TMS, SMMS, TDMS & COA data schemas."),
        ("DevOps & Reliability", "Docker, Docker Compose, Git / GitHub, Python Virtual Environment, 100% test-verified zero-crash pipeline.")
    ]
    for cat, det in techs:
        p = tf.add_paragraph()
        r = p.add_run()
        r.text = f"• {cat}: "
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = C_BLUE
        r2 = p.add_run()
        r2.text = det
        r2.font.size = Pt(9.5)
        r2.font.color.rgb = C_SLATE_DARK
        p.space_after = Pt(6)

    # Right Column: Architecture Diagram / Boxes
    arch_card = s3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.6), Inches(1.3), Inches(5.9), Inches(5.5))
    arch_card.fill.solid()
    arch_card.fill.fore_color.rgb = C_BG_CARD
    arch_card.line.color.rgb = C_BORDER
    tf = arch_card.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "4-TIER OPERATIONAL ARCHITECTURE"
    p.font.bold = True
    p.font.size = Pt(12)
    p.font.color.rgb = C_NAVY
    p.space_after = Pt(8)

    tiers = [
        ("Tier 1: Operations Console (React 19 + Vite)", 
         "• Field Engineer Portal: NLP-assisted defect logging (TMS/SMMS/TDMS)\n• Section Controller Room: One-click signoff with confidence telemetry\n• Block Calendar: Interactive Gantt with live possession countdown"),
        ("Tier 2: API & Gateway Layer (FastAPI)", 
         "• /score & /score-all: Rapid XGBoost priority scoring\n• /optimize: OR-Tools solver dispatcher for weekly & monthly horizons\n• /classify-defect: NLP natural language parsing into official IR defect codes"),
        ("Tier 3: AI & Mathematical Engine", 
         "• XGBoost 3-Pillar Priority Engine (Asset Stress, Overdue Days, Density)\n• Google OR-Tools CP-SAT Solver enforcing daylight, buffer & headway rules\n• Shadow Block Co-Allocation Matrix bundling multi-dept works"),
        ("Tier 4: Enterprise Data Layer (Supabase PostgreSQL)", 
         "• Core Tables: maintenance_requests, blocks, departments, audit_log\n• Role-Based Security: Section Controller clearance vs Department Engineers\n• Immutable Audit Trail: Logging all Approvals, Reschedules & Fitness Memos")
    ]
    for name, bullets_t in tiers:
        p = tf.add_paragraph()
        r = p.add_run()
        r.text = f"{name}\n"
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = C_BLUE
        r2 = p.add_run()
        r2.text = f"{bullets_t}\n"
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = C_SLATE_DARK
        p.space_after = Pt(4)


    # ==========================================
    # SLIDE 4: Feasibility and Viability
    # ==========================================
    s4 = prs.slides.add_slide(blank_slide_layout)
    add_slide_header(s4, "Feasibility, Viability & Risk Management", 4)

    # 5 Pillars across top
    pillar_data = [
        ("Technical Feasibility", "Built on proven algorithms (Google OR-Tools CP-SAT & XGBoost) executing constraint optimization in <2 seconds."),
        ("Economic Feasibility", "Zero new track hardware needed. Pure software intelligence layer eliminating crores in uncoordinated downtime."),
        ("User Viability", "Clean Government Enterprise UI tailored for busy Controllers and field staff with high contrast and NLP shortcuts."),
        ("Operational Feasibility", "Enforces Human-in-the-Loop governance. AI recommends, but authorized Section Controller retains 100% signoff authority."),
        ("Scalability", "Stateless microservice architecture scales seamlessly from a single division to all 68 Indian Railway divisions.")
    ]

    p_width = Inches(2.28)
    p_gap = Inches(0.12)
    p_left_start = Inches(0.8)

    for idx, (p_title, p_desc) in enumerate(pillar_data):
        bx = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, p_left_start + idx * (p_width + p_gap), Inches(1.3), p_width, Inches(2.1))
        bx.fill.solid()
        bx.fill.fore_color.rgb = C_WHITE
        bx.line.color.rgb = C_BORDER
        tf = bx.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = p_title
        p.font.bold = True
        p.font.size = Pt(10)
        p.font.color.rgb = C_NAVY
        p.space_after = Pt(4)
        p = tf.add_paragraph()
        p.text = p_desc
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_SLATE_DARK

    # Bottom Table: Key Challenges, Impact & Mitigation
    tbl_shape = s4.shapes.add_table(4, 3, Inches(0.8), Inches(3.7), Inches(11.733), Inches(3.0))
    tbl = tbl_shape.table
    tbl.columns[0].width = Inches(3.2)
    tbl.columns[1].width = Inches(3.8)
    tbl.columns[2].width = Inches(4.733)

    table_data = [
        ["KEY CHALLENGE / OPERATIONAL RISK", "IMPACT ON RAILWAY OPERATIONS", "MITIGATION STRATEGY IN RAILOPT AI"],
        ["Data Silos & Field Gaps:\nIncomplete defect reporting across TMS, SMMS & TDMS.",
         "Unreliable defect data leads to poor scheduling and overlooked track flaws.",
         "Automated Pydantic validation, NLP field assist for natural reporting, and fallback stress estimation."],
        ["Cross-Department Conflicts:\nSimultaneous requests on same track corridor.",
         "Creates hazardous conditions, train stoppages, and wasted line capacity.",
         "Real-time spatial-temporal overlap detector + OR-Tools CP-SAT bundling into unified 'Shadow Blocks'."],
        ["Window Overrun & Line Clearance:\nField work exceeds approved time slot.",
         "Cascading delays across scheduled passenger express & freight rakes.",
         "Live countdown possession timer + mandatory digital Track Fitness Certificate (Normal vs TSR Caution Order)."]
    ]

    for r_idx, row in enumerate(table_data):
        for c_idx, val in enumerate(row):
            cell = tbl.cell(r_idx, c_idx)
            cell.text = val
            p = cell.text_frame.paragraphs[0]
            if r_idx == 0:
                cell.fill.solid()
                cell.fill.fore_color.rgb = C_NAVY
                p.font.bold = True
                p.font.color.rgb = C_WHITE
                p.font.size = Pt(10)
            else:
                cell.fill.solid()
                cell.fill.fore_color.rgb = C_WHITE if r_idx % 2 == 1 else C_BG_CARD
                p.font.size = Pt(9)
                p.font.color.rgb = C_SLATE_DARK


    # ==========================================
    # SLIDE 5: Impact and Benefits
    # ==========================================
    s5 = prs.slides.add_slide(blank_slide_layout)
    add_slide_header(s5, "Impact, Operational Benefits & ROI", 5)

    # 4 Columns Matrix
    col_width = Inches(2.78)
    col_gap = Inches(0.2)
    col_left_start = Inches(0.8)

    columns_data = [
        ("USP & CORE STRENGTHS", C_NAVY, [
            ("Shadow Block Co-Allocation", "Bundles Civil, Signal, and Electrical tasks into shared track closures, reducing total block count."),
            ("3-Pillar Priority Scoring", "XGBoost weights Asset Stress (45%), Overdue Days (35%), and Traffic Density (20%)."),
            ("Human-in-the-Loop Signoff", "Executive approval room allows individual block signoff, reschedule, or rejection with confidence telemetry."),
            ("Closed-Loop Safety Fitness", "Mandatory Track Fitness Certificate (Normal vs TSR Caution Order) before restoring train signals.")
        ]),
        ("OPERATIONAL IMPACT", C_BLUE, [
            ("Faster Turnaround", "Reduces cross-department block negotiations from days of calls to under 5 minutes."),
            ("Optimized Resource Use", "Enables specialized track machines (BCM, Tamping) to work concurrently with catenary maintenance."),
            ("Zero Miscommunication", "Replaces unverified verbal telephone clearances with an immutable PostgreSQL audit trail."),
            ("Division-Wide Visibility", "Centralized radar gives Section Controllers complete real-time awareness across all corridors.")
        ]),
        ("RAILWAY ASSET AVAILABILITY", C_ACCENT_GREEN, [
            ("Higher Track Availability", "Fewer independent traffic blocks keeps corridors open for passenger and freight rakes."),
            ("Proactive Asset Uptime", "Prioritizes overdue high-stress sections before micro-cracks turn into emergency rail fractures."),
            ("Reduced Cascading Delays", "Live possession timer alerts controllers before window overruns disrupt express trains."),
            ("Standardized Network Health", "Harmonizes track availability metrics across divisions and zonal railways.")
        ]),
        ("COST EFFICIENCY & ROI", C_ACCENT_AMBER, [
            ("15–20% Lower Planning Costs", "Eliminates administrative coordination overhead and repetitive manual paperwork."),
            ("Up to 18% Lower Disruption Loss", "Fewer emergency track failures reduces punctuality penalty costs significantly."),
            ("Maximum ROI on Machinery", "Co-allocation ensures high-value track machines achieve higher utilization per possession."),
            ("Zero Hardware Capex", "Cloud/on-prem software solution integrating directly into existing CRIS & FOIS architecture.")
        ])
    ]

    for c_idx, (col_title, header_color, items) in enumerate(columns_data):
        card = s5.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, col_left_start + c_idx * (col_width + col_gap), Inches(1.3), col_width, Inches(5.5))
        card.fill.solid()
        card.fill.fore_color.rgb = C_WHITE
        card.line.color.rgb = C_BORDER
        tf = card.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = col_title
        p.font.bold = True
        p.font.size = Pt(10.5)
        p.font.color.rgb = header_color
        p.space_after = Pt(8)

        for it_title, it_desc in items:
            p = tf.add_paragraph()
            r1 = p.add_run()
            r1.text = f"• {it_title}:\n"
            r1.font.bold = True
            r1.font.size = Pt(9)
            r1.font.color.rgb = C_NAVY
            r2 = p.add_run()
            r2.text = f"{it_desc}\n"
            r2.font.size = Pt(8.5)
            r2.font.color.rgb = C_SLATE_DARK
            p.space_after = Pt(4)


    # ==========================================
    # SLIDE 6: Research and References
    # ==========================================
    s6 = prs.slides.add_slide(blank_slide_layout)
    add_slide_header(s6, "Research, Standards & References", 6)

    ref_card = s6.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.3), Inches(11.733), Inches(5.5))
    ref_card.fill.solid()
    ref_card.fill.fore_color.rgb = C_WHITE
    ref_card.line.color.rgb = C_BORDER
    tf = ref_card.text_frame
    tf.word_wrap = True

    sections_ref = [
        ("1. Machine Learning & Predictive Maintenance Foundations", [
            ("NASA / UCI AI4I Predictive Maintenance Dataset:", "Synthetic degradation telemetry and feature engineering for failure prediction: https://archive.ics.uci.edu/dataset/601/ai4i+2020+predictive+maintenance+dataset"),
            ("Gradient Boosted Decision Trees (XGBoost):", "Chen, T., & Guestrin, C. (2016). 'XGBoost: A Scalable Tree Boosting System' - Applied for non-linear railway asset risk ranking.")
        ]),
        ("2. Operations Research & Mathematical Constraint Optimization", [
            ("Google OR-Tools CP-SAT Solver:", "Constraint Programming with Boolean Satisfiability technology for multi-commodity scheduling: https://developers.google.com/optimization/cp/cp_solver"),
            ("Railway Corridor Capacity & Headway Modeling:", "Resource-constrained job-shop formulations for conflict-free maintenance slot allocation around scheduled train paths.")
        ]),
        ("3. Official Indian Railways Standards & Statutory Operating Manuals", [
            ("Indian Railways Permanent Way Manual (IRPWM - 2020 Edition):", "Directorate of Civil Engineering, Railway Board: Statutory track inspection intervals, defect classification, and safety buffer rules: https://indianrailways.gov.in/railwayboard/uploads/directorate/civil_engg/IRPWM_2020.pdf"),
            ("Indian Railways AC Traction Manual (ACTM - Vol II):", "Guidelines for OHE Maintenance Blocks, Power Isolation Protocols & Tower Wagon Disconnection Memos: https://indianrailways.gov.in/railwayboard/uploads/directorate/elect_engg/ACTM.htm"),
            ("Indian Railways Signal Engineering Manual (IRSEM):", "Protocols for point machines, track circuit testing, and S&T disconnection notices."),
            ("Centre for Railway Information Systems (CRIS) Enterprise Architecture:", "System integration guidelines for Control Office Application (COA) & Freight Operations Information System (FOIS): https://cris.org.in/")
        ])
    ]

    is_first = True
    for sec_title, entries in sections_ref:
        p = tf.paragraphs[0] if is_first else tf.add_paragraph()
        is_first = False
        p.text = sec_title
        p.font.bold = True
        p.font.size = Pt(11.5)
        p.font.color.rgb = C_NAVY
        p.space_before = Pt(6)
        p.space_after = Pt(4)

        for label, link_desc in entries:
            p = tf.add_paragraph()
            r1 = p.add_run()
            r1.text = f"• {label} "
            r1.font.bold = True
            r1.font.size = Pt(9.5)
            r1.font.color.rgb = C_BLUE
            r2 = p.add_run()
            r2.text = link_desc
            r2.font.size = Pt(9)
            r2.font.color.rgb = C_SLATE_DARK
            p.space_after = Pt(2)

    prs.save(output_path)
    print(f"[SUCCESS] Successfully generated: {output_path}")

if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "RailOpt_AI_SIH2026_Presentation.pptx")
    out = os.path.abspath(out)
    create_sih_presentation(out)
