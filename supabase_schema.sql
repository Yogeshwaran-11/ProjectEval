-- ====================================================================
-- Kongu Engineering College (Autonomous) - Department of Information Technology
-- College Project Work Evaluation System - Complete Supabase PostgreSQL Schema (v3.2)
-- ====================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables for a clean, deterministic schema synchronization
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS rubrics CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS panels CASCADE;
DROP TABLE IF EXISTS review_rounds CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. PROFILES TABLE (Students, Faculty, Admins, Super Admin)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'jury', 'admin', 'super_admin')),
    roll_or_emp_id TEXT UNIQUE NOT NULL,
    department TEXT DEFAULT 'Department of Information Technology',
    phone TEXT,
    photo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REVIEW ROUNDS TABLE
CREATE TABLE review_rounds (
    id TEXT PRIMARY KEY,
    round_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    academic_year TEXT DEFAULT '2025-2026',
    max_score NUMERIC DEFAULT 50.0,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REVIEW-SPECIFIC DYNAMIC RUBRICS
CREATE TABLE rubrics (
    id TEXT PRIMARY KEY,
    review_round_id TEXT REFERENCES review_rounds(id) ON DELETE CASCADE,
    criterion_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    max_marks NUMERIC DEFAULT 10.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEAMS TABLE (15 Capstone Teams)
CREATE TABLE teams (
    id TEXT PRIMARY KEY,
    team_code TEXT UNIQUE NOT NULL,
    project_title TEXT NOT NULL,
    abstract TEXT,
    mentor_id TEXT,
    mentor_name TEXT,
    panel_id TEXT,
    github_url TEXT,
    ppt_url TEXT,
    demo_url TEXT,
    progress_percentage INT DEFAULT 70 CHECK (progress_percentage BETWEEN 0 AND 100),
    members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PANELS TABLE (5 Review Panels)
CREATE TABLE panels (
    id TEXT PRIMARY KEY,
    panel_code TEXT UNIQUE NOT NULL,
    name TEXT,
    review_round_id TEXT REFERENCES review_rounds(id) ON DELETE SET NULL,
    venue TEXT DEFAULT 'IT Lab 4 - Cloud & Web Tech Lab (Ground Floor)',
    active_team_id TEXT,
    standby_team_id TEXT,
    last_standby_alert TEXT,
    alert_timestamp TEXT,
    juries JSONB DEFAULT '[]'::jsonb,
    team_queue JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. EVALUATIONS TABLE
CREATE TABLE evaluations (
    id TEXT PRIMARY KEY,
    panel_id TEXT REFERENCES panels(id) ON DELETE CASCADE,
    team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
    review_round_id TEXT REFERENCES review_rounds(id) ON DELETE CASCADE,
    jury_id TEXT,
    marks JSONB DEFAULT '{}'::jsonb,
    total_score NUMERIC DEFAULT 0.0,
    remarks TEXT,
    is_locked BOOLEAN DEFAULT false,
    submitted_at TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(panel_id, team_id, review_round_id, jury_id)
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_all" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "review_rounds_all" ON review_rounds FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "rubrics_all" ON rubrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "teams_all" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "panels_all" ON panels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "evaluations_all" ON evaluations FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime publications
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE panels;
    ALTER PUBLICATION supabase_realtime ADD TABLE teams;
    ALTER PUBLICATION supabase_realtime ADD TABLE evaluations;
    ALTER PUBLICATION supabase_realtime ADD TABLE rubrics;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ====================================================================
-- SEED DATA
-- ====================================================================

-- 1. Review Rounds
INSERT INTO review_rounds (id, round_code, name, academic_year, max_score, is_active) VALUES
('REV-0', 'REV-0', 'Review 0: Ideation & Feasibility', '2025-2026', 50, false),
('REV-1', 'REV-1', 'Review 1: Design & Architecture', '2025-2026', 50, false),
('REV-2', 'REV-2', 'Review 2: Implementation & Testing', '2025-2026', 50, true),
('REV-FINAL', 'REV-FINAL', 'Final Review & Viva Voce', '2025-2026', 50, false);

-- 2. Rubrics
INSERT INTO rubrics (id, review_round_id, criterion_code, title, description, max_marks) VALUES
('R0-C1', 'REV-0', 'C1', 'Problem Identification & Relevance', 'Clarity of problem statement and industry/societal relevance', 10),
('R0-C2', 'REV-0', 'C2', 'Literature Review & Existing Work Study', 'Quality of indexed papers surveyed (IEEE, ACM, Springer)', 10),
('R0-C3', 'REV-0', 'C3', 'Proposed Objective & Methodology', 'Technical feasibility and novelty of proposed solution', 10),
('R0-C4', 'REV-0', 'C4', 'Feasibility Study & Work Plan', 'Gantt chart, resource planning, and milestone roadmap', 10),
('R0-C5', 'REV-0', 'C5', 'Presentation (PPT) & Viva Voce', 'Slide aesthetics, verbal delivery, and initial defense', 10),
('R1-C1', 'REV-1', 'C1', 'System Architecture & Data Flow Design', 'DFD diagrams, ER schema, and system component design', 10),
('R1-C2', 'REV-1', 'C2', 'Module Specifications & Database Schema', 'Database normalization, API contracts, and module breakdown', 10),
('R1-C3', 'REV-1', 'C3', 'Hardware / Software Stack Selection', 'Justification for selected framework, cloud services, and tools', 10),
('R1-C4', 'REV-1', 'C4', 'Initial Prototype / Wireframes & Git Setup', 'Figma/wireframes and GitHub repository branch setup', 10),
('R1-C5', 'REV-1', 'C5', 'Presentation (PPT) & Viva Voce', 'Technical depth of presentation and viva response', 10),
('R2-C1', 'REV-2', 'C1', 'Problem Definition & Novelty', 'Clarity of objective, relevance, and literature foundation', 10),
('R2-C2', 'REV-2', 'C2', 'System Architecture & Methodology', 'Design diagrams, algorithms, and technical workflow clarity', 10),
('R2-C3', 'REV-2', 'C3', 'Implementation & Code Quality (GitHub)', 'Repository structure, clean code, and commit history hygiene', 10),
('R2-C4', 'REV-2', 'C4', 'Live Demo & Deployment Verification', 'Working live prototype, responsiveness, and functional features', 10),
('R2-C5', 'REV-2', 'C5', 'Presentation (PPT) & Viva Voce Q&A', 'Slide quality, verbal clarity, and defense during viva questioning', 10),
('RF-C1', 'REV-FINAL', 'C1', 'Full Functional Completeness & Novelty', 'All modules operational with distinct innovation/novelty', 10),
('RF-C2', 'REV-FINAL', 'C2', 'Live Deployed Application Output Testing', 'Production deployment, stress handling, and real-time output', 10),
('RF-C3', 'REV-FINAL', 'C3', 'GitHub Code Quality, Architecture & Documentation', 'Clean architecture, automated tests, and clear README documentation', 10),
('RF-C4', 'REV-FINAL', 'C4', 'Project Report / Documentation Standard', 'IEEE format compliance, plagiarism report, and certificate pages', 10),
('RF-C5', 'REV-FINAL', 'C5', 'Comprehensive Viva Voce & Defense', 'Individual viva performance, cross-questioning defense', 10);

-- 3. Profiles (Faculty & Students including Yogeshwaran V)
INSERT INTO profiles (id, email, full_name, role, roll_or_emp_id, department) VALUES
('usr-superadmin', 'hod_it@kongu.ac.in', 'Dr. S. Varadhaganapathy', 'super_admin', 'KEC-IT-HOD', 'Department of Information Technology'),
('usr-admin', 'senthilkumar.it@kongu.ac.in', 'Mr. Senthilkumar', 'admin', 'KEC-IT-LA01', 'Department of Information Technology'),
('usr-jury-1', 'premalatha@kongu.ac.in', 'Dr. J. Premalatha', 'jury', 'KEC-IT-002', 'Department of Information Technology'),
('usr-jury-2', 'kamalam@kongu.ac.in', 'Dr. G. K. Kamalam', 'jury', 'KEC-IT-004', 'Department of Information Technology'),
('usr-jury-3', 'shanthakumari@kongu.ac.in', 'Dr. R. Shanthakumari', 'jury', 'KEC-IT-005', 'Department of Information Technology'),
('usr-jury-4', 'anandamurugan@kongu.ac.in', 'Dr. S. Anandamurugan', 'jury', 'KEC-IT-003', 'Department of Information Technology'),
('usr-jury-5', 'roopadevi@kongu.ac.in', 'Dr. E. M. Roopa Devi', 'jury', 'KEC-IT-006', 'Department of Information Technology'),
('usr-jury-6', 'vinothkumar@kongu.ac.in', 'S. Vinothkumar', 'jury', 'KEC-IT-011', 'Department of Information Technology'),
('usr-jury-7', 'vijayanand@kongu.ac.in', 'D. Vijay Anand', 'jury', 'KEC-IT-007', 'Department of Information Technology'),
('usr-jury-8', 'ponselvakumar@kongu.ac.in', 'A. P. Ponselvakumar', 'jury', 'KEC-IT-008', 'Department of Information Technology'),
('usr-jury-9', 'devisurya@kongu.ac.in', 'Dr. V. Devisurya', 'jury', 'KEC-IT-010', 'Department of Information Technology'),
('usr-jury-10', 'jeevanantham@kongu.ac.in', 'A. Jeevanantham', 'jury', 'KEC-IT-009', 'Department of Information Technology'),
('usr-jury-11', 'aarthi@kongu.ac.in', 'R. Aarthi', 'jury', 'KEC-IT-012', 'Department of Information Technology'),
('usr-jury-12', 'sruthi@kongu.ac.in', 'K. Sruthi', 'jury', 'KEC-IT-013', 'Department of Information Technology'),
('usr-jury-13', 'kavithra@kongu.ac.in', 'S. Kavithra', 'jury', 'KEC-IT-014', 'Department of Information Technology'),
('usr-jury-14', 'sandhiya@kongu.ac.in', 'R. Sandhiya', 'jury', 'KEC-IT-015', 'Department of Information Technology'),
('usr-jury-15', 'gayathri@kongu.ac.in', 'V. P. Gayathri', 'jury', 'KEC-IT-016', 'Department of Information Technology'),
('usr-stu-1', 'yogeshwaran.22it@kongu.edu', 'Yogeshwaran V', 'student', '22ITR112', 'Department of Information Technology'),
('usr-stu-2', 'karthik.22it@kongu.edu', 'Karthik R', 'student', '22ITR045', 'Department of Information Technology'),
('usr-stu-3', 'deepika.22it@kongu.edu', 'Deepika S', 'student', '22ITR021', 'Department of Information Technology'),
('usr-stu-4', 'ananya.22it@kongu.edu', 'Ananya M', 'student', '22ITR008', 'Department of Information Technology'),
('usr-stu-7', 'vignesh.22it@kongu.edu', 'Vigneshwaran S', 'student', '22ITR105', 'Department of Information Technology'),
('usr-stu-8', 'pavithra.22it@kongu.edu', 'Pavithra M', 'student', '22ITR064', 'Department of Information Technology'),
('usr-stu-13', 'arun.22it@kongu.edu', 'Arun Kumar K', 'student', '22ITR012', 'Department of Information Technology'),
('usr-stu-14', 'naveen.22it@kongu.edu', 'Naveen S', 'student', '22ITR059', 'Department of Information Technology'),
('usr-stu-19', 'dinesh.22it@kongu.edu', 'Dinesh K', 'student', '22ITR025', 'Department of Information Technology'),
('usr-stu-20', 'balaji.22it@kongu.edu', 'Balaji R', 'student', '22ITR015', 'Department of Information Technology'),
('usr-stu-25', 'ragul.22it@kongu.edu', 'Ragul S', 'student', '22ITR081', 'Department of Information Technology'),
('usr-stu-26', 'varun.22it@kongu.edu', 'Varun C', 'student', '22ITR102', 'Department of Information Technology');

-- 4. Teams (15 Capstone Project Teams)
INSERT INTO teams (id, team_code, project_title, abstract, mentor_id, mentor_name, panel_id, github_url, ppt_url, demo_url, progress_percentage, members) VALUES
('team-01', 'T-IT-01', 'Autonomous Smart Grid Optimization with Edge AI', 'A decentralized smart micro-grid management system utilizing edge AI for dynamic solar load forecasting and automated load balancing.', 'fac-roopadevi', 'Dr. E. M. Roopa Devi', 'panel-01', 'https://github.com/yogeshwaran-custom-repo', 'https://docs.google.com/presentation/d/smart-grid-deck', 'https://smartgrid-edge.vercel.app', 88, '[{"id":"usr-stu-1","name":"Yogeshwaran V","rollNo":"22ITR112","isLead":true},{"id":"usr-stu-2","name":"Karthik R","rollNo":"22ITR045","isLead":false}]'::jsonb),
('team-02', 'T-IT-02', 'Real-time AI Medical Imaging Diagnosis Platform', 'Computer vision pipeline for accelerated detection of pulmonary abnormalities in chest radiographs with explainable Grad-CAM heatmaps.', 'fac-vijayanand', 'D. Vijay Anand', 'panel-01', 'https://github.com/kec-it/med-vision-ai', 'https://docs.google.com/presentation/d/med-ai-review2', 'https://medvision-diagnosis.vercel.app', 90, '[{"id":"usr-stu-3","name":"Deepika S","rollNo":"22ITR021","isLead":true},{"id":"usr-stu-4","name":"Ananya M","rollNo":"22ITR008","isLead":false}]'::jsonb),
('team-03', 'T-IT-03', 'Zero-Trust Blockchain Supply Chain Verification', 'Smart contract-driven pharmaceutical provenance tracking preventing counterfeit medication distribution across tier-1 supply networks.', 'fac-ponselvakumar', 'A. P. Ponselvakumar', 'panel-01', 'https://github.com/kec-it/zero-trust-pharma-ledger', 'https://docs.google.com/presentation/d/blockchain-supply-ppt', 'https://pharma-ledger-demo.web.app', 75, '[{"id":"usr-stu-5","name":"Prashanth K","rollNo":"22ITR072","isLead":true},{"id":"usr-stu-6","name":"Rithika N","rollNo":"22ITR085","isLead":false}]'::jsonb),
('team-04', 'T-IT-04', 'Autonomous Drone Path Navigation in GPS-Denied Terrain', 'Visual inertial odometry and SLAM algorithm integration enabling quadcopter indoor survey without external satellite signals.', 'fac-devisurya', 'Dr. V. Devisurya', 'panel-02', 'https://github.com/kec-it/drone-slam-nav', 'https://docs.google.com/presentation/d/drone-nav-presentation', 'https://drone-slam-visualizer.vercel.app', 80, '[{"id":"usr-stu-7","name":"Vigneshwaran S","rollNo":"22ITR105","isLead":true},{"id":"usr-stu-8","name":"Pavithra M","rollNo":"22ITR064","isLead":false}]'::jsonb),
('team-05', 'T-IT-05', 'Multimodal LLM for Regional Language Legal Analysis', 'Fine-tuned domain LLM for automated Tamil and Indian vernacular court judgment summarization and statute cross-referencing.', 'fac-vanitha', 'P. Vanitha', 'panel-02', 'https://github.com/kec-it/tamil-legal-llm', 'https://docs.google.com/presentation/d/legal-llm-slides', 'https://tamil-legal-ai.vercel.app', 85, '[{"id":"usr-stu-9","name":"Hariharan B","rollNo":"22ITR033","isLead":true},{"id":"usr-stu-10","name":"Gokul Raj M","rollNo":"22ITR028","isLead":false}]'::jsonb),
('team-06', 'T-IT-06', 'Federated Learning for Privacy-Preserving Healthcare EHR', 'Decentralized model training across multi-hospital oncology databases without transferring raw patient electronic health records.', 'fac-deenumol', 'A. Deenu Mol', 'panel-02', 'https://github.com/kec-it/federated-ehr-ai', 'https://docs.google.com/presentation/d/fed-learning-deck', 'https://federated-health-kec.vercel.app', 70, '[{"id":"usr-stu-11","name":"Sneha R","rollNo":"22ITR092","isLead":true},{"id":"usr-stu-12","name":"Kaviya P","rollNo":"22ITR048","isLead":false}]'::jsonb),
('team-07', 'T-IT-07', 'Real-time Wildfire Early Warning via Edge IoT & Thermal Vision', 'Solar-powered sensor mesh with thermal imaging cameras detecting forest canopy smoke and temperature spikes with LoRa telemetry.', 'fac-vaishnavi', 'T. Vaishnavi', 'panel-03', 'https://github.com/kec-it/wildfire-edge-iot', 'https://docs.google.com/presentation/d/wildfire-iot-deck', 'https://wildfire-monitor.web.app', 88, '[{"id":"usr-stu-13","name":"Arun Kumar K","rollNo":"22ITR012","isLead":true},{"id":"usr-stu-14","name":"Naveen S","rollNo":"22ITR059","isLead":false}]'::jsonb),
('team-08', 'T-IT-08', 'Decentralized Threat Intelligence Sharing via Hyperledger', 'Zero-knowledge consensus protocol allowing financial institutions to anonymously pool and correlate zero-day cyber attack vectors.', 'fac-krishnaveni', 'S. Krishnaveni', 'panel-03', 'https://github.com/kec-it/threat-share-ledger', 'https://docs.google.com/presentation/d/cyber-threat-deck', 'https://threat-intel-portal.vercel.app', 82, '[{"id":"usr-stu-15","name":"Manoj Kumar P","rollNo":"22ITR053","isLead":true},{"id":"usr-stu-16","name":"Sanjay V","rollNo":"22ITR088","isLead":false}]'::jsonb),
('team-09', 'T-IT-09', 'Automated Smart Contract Vulnerability Auditing System', 'Symbolic execution engine that scans Solidity bytecode for reentrancy, flash loan exploits, and integer overflow vulnerabilities.', 'fac-prathika', 'M. E. Prathika', 'panel-03', 'https://github.com/kec-it/solidity-audit-engine', 'https://docs.google.com/presentation/d/contract-audit-deck', 'https://audit-solidity.vercel.app', 75, '[{"id":"usr-stu-17","name":"Keerthana M","rollNo":"22ITR046","isLead":true},{"id":"usr-stu-18","name":"Dharani S","rollNo":"22ITR023","isLead":false}]'::jsonb),
('team-10', 'T-IT-10', 'Cyber-Physical Water Distribution Monitoring with LoRaWAN', 'Industrial IoT pressure telemetry and acoustic pipeline leak localization system deployed across municipal water lines.', 'fac-vishnupriya', 'T. S. Vishnu Priya', 'panel-04', 'https://github.com/kec-it/water-iot-lora', 'https://docs.google.com/presentation/d/water-telemetry-deck', 'https://water-telemetry.vercel.app', 85, '[{"id":"usr-stu-19","name":"Dinesh K","rollNo":"22ITR025","isLead":true},{"id":"usr-stu-20","name":"Balaji R","rollNo":"22ITR015","isLead":false}]'::jsonb),
('team-11', 'T-IT-11', 'Offline-First Disaster Emergency Mesh Networking App', 'Bluetooth Low Energy & Wi-Fi Direct peer-to-peer mobile mesh relay for civilian SOS signaling during telecom grid failures.', 'fac-monica', 'Monica Murugesan', 'panel-04', 'https://github.com/kec-it/disaster-mesh-relay', 'https://docs.google.com/presentation/d/mesh-sos-deck', 'https://mesh-sos-kec.vercel.app', 80, '[{"id":"usr-stu-21","name":"Harish R","rollNo":"22ITR035","isLead":true},{"id":"usr-stu-22","name":"Praveen K","rollNo":"22ITR074","isLead":false}]'::jsonb),
('team-12', 'T-IT-12', 'AI-Powered Smart Micro-Irrigation & Soil Nutrient Optimizer', 'Edge computer vision and NPK sensor fusion optimizing drip irrigation cycles for precision agriculture in Erode district farms.', 'fac-suganya', 'S. Suganya', 'panel-04', 'https://github.com/kec-it/smart-agri-npk', 'https://docs.google.com/presentation/d/agri-iot-deck', 'https://agri-smart-npk.vercel.app', 72, '[{"id":"usr-stu-23","name":"Abinaya T","rollNo":"22ITR002","isLead":true},{"id":"usr-stu-24","name":"Swetha M","rollNo":"22ITR098","isLead":false}]'::jsonb),
('team-13', 'T-IT-13', 'Assistive AR Navigation Glasses for Visually Impaired', 'Edge computer vision with spatial depth sensors and bone-conduction audio cues providing obstacle detection and text reading.', 'fac-sasikala', 'G. Sasikala', 'panel-05', 'https://github.com/kec-it/assistive-ar-glasses', 'https://docs.google.com/presentation/d/ar-assistive-deck', 'https://ar-assistive-vision.vercel.app', 92, '[{"id":"usr-stu-25","name":"Ragul S","rollNo":"22ITR081","isLead":true},{"id":"usr-stu-26","name":"Varun C","rollNo":"22ITR102","isLead":false}]'::jsonb),
('team-14', 'T-IT-14', 'Distributed Stream Processing Engine for High-Frequency FinTech', 'Rust and Apache Arrow based memory-mapped order book matching engine capable of sub-microsecond algorithmic latency.', 'fac-sowmiya', 'E. Sowmiya', 'panel-05', 'https://github.com/kec-it/high-freq-fintech-stream', 'https://docs.google.com/presentation/d/fintech-stream-deck', 'https://fintech-stream-kec.vercel.app', 84, '[{"id":"usr-stu-27","name":"Madhan G","rollNo":"22ITR051","isLead":true},{"id":"usr-stu-28","name":"Kishore M","rollNo":"22ITR049","isLead":false}]'::jsonb),
('team-15', 'T-IT-15', 'Acoustic Noise Cancellation & Speech Enhancement with TinyML', 'Low-power quantized neural network deployed onto ARM Cortex-M4 microcontroller for real-time industrial hearing protection.', 'fac-sripriya', 'S. Sripriya', 'panel-05', 'https://github.com/kec-it/tinyml-anc-speech', 'https://docs.google.com/presentation/d/tinyml-anc-deck', 'https://tinyml-anc-visualizer.vercel.app', 78, '[{"id":"usr-stu-29","name":"Sudharsan K","rollNo":"22ITR095","isLead":true},{"id":"usr-stu-30","name":"Ajay R","rollNo":"22ITR005","isLead":false}]'::jsonb);

-- 5. Panels (5 Capstone Review Panels)
INSERT INTO panels (id, panel_code, name, review_round_id, venue, active_team_id, standby_team_id, last_standby_alert, alert_timestamp, juries, team_queue) VALUES
('panel-01', 'Panel 01', 'Panel 01 - Cloud & Web Tech Lab', 'REV-2', 'IT Lab 4 - Cloud & Web Tech Lab (Ground Floor)', 'team-02', 'team-02', 'Test Standby Alert', '11:00 AM', '[{"id":"usr-jury-1","name":"Dr. J. Premalatha","position":1,"designation":"Senior Professor","photo":"https://kongu.ac.in/static/media/premalatha.828a18ddd177ffdf7576.webp","empId":"KEC-IT-002"},{"id":"usr-jury-2","name":"Dr. G. K. Kamalam","position":2,"designation":"Senior Associate Professor","photo":"https://kongu.ac.in/static/media/kamalam.48f5632b44fa3678d73b.webp","empId":"KEC-IT-004"},{"id":"usr-jury-3","name":"Dr. R. Shanthakumari","position":3,"designation":"Associate Professor","photo":"https://kongu.ac.in/static/media/shanthakumari.e5e6607f8ec16d860473.webp","empId":"KEC-IT-005"}]'::jsonb, '[{"teamId":"team-01","queueOrder":1,"slotStart":"10:00 AM","slotEnd":"10:20 AM","status":"COMPLETED"},{"teamId":"team-02","queueOrder":2,"slotStart":"10:20 AM","slotEnd":"10:40 AM","status":"IN_VIVA"},{"teamId":"team-03","queueOrder":3,"slotStart":"10:40 AM","slotEnd":"11:00 AM","status":"STANDBY"}]'::jsonb),
('panel-02', 'Panel 02', 'Panel 02 - AI & Machine Learning Center', 'REV-2', 'IT Lab 2 - AI & Machine Learning Center (First Floor)', 'team-05', 'team-06', 'Team T-IT-05 is presenting legal LLM methodology. Team T-IT-06 (Federated Healthcare EHR), assemble outside IT Lab 2!', '10:32 AM', '[{"id":"usr-jury-4","name":"Dr. S. Anandamurugan","position":1,"designation":"Professor","photo":"https://kongu.ac.in/static/media/anandamurugan.0ba7bd8f29530960f9f2.webp","empId":"KEC-IT-003"},{"id":"usr-jury-5","name":"Dr. E. M. Roopa Devi","position":2,"designation":"Associate Professor","photo":"https://kongu.ac.in/static/media/roopadevi.cb884e42663592aedba2.webp","empId":"KEC-IT-006"},{"id":"usr-jury-6","name":"S. Vinothkumar","position":3,"designation":"Assistant Professor (SRG)","photo":"https://kongu.ac.in/static/media/vinothkumar.3be7d88718d8e03b4e8e.webp","empId":"KEC-IT-011"}]'::jsonb, '[{"teamId":"team-04","queueOrder":1,"slotStart":"10:00 AM","slotEnd":"10:20 AM","status":"COMPLETED"},{"teamId":"team-05","queueOrder":2,"slotStart":"10:20 AM","slotEnd":"10:40 AM","status":"IN_VIVA"},{"teamId":"team-06","queueOrder":3,"slotStart":"10:40 AM","slotEnd":"11:00 AM","status":"STANDBY"}]'::jsonb),
('panel-03', 'Panel 03', 'Panel 03 - Cyber Security & IoT Center', 'REV-2', 'IT Lab 3 - Cyber Security & IoT Center (First Floor)', 'team-08', 'team-09', 'Team T-IT-08 is presenting threat ledger. Team T-IT-09 (Smart Contract Audit), please be ready outside IT Lab 3!', '10:30 AM', '[{"id":"usr-jury-7","name":"D. Vijay Anand","position":1,"designation":"Assistant Professor (SLG)","photo":"https://kongu.ac.in/static/media/vijayanand.2942571365baa17931e9.webp","empId":"KEC-IT-007"},{"id":"usr-jury-8","name":"A. P. Ponselvakumar","position":2,"designation":"Assistant Professor (SLG)","photo":"https://kongu.ac.in/static/media/ponselvakumar.6e6da5930b5ddb1bf4f5.webp","empId":"KEC-IT-008"},{"id":"usr-jury-9","name":"Dr. V. Devisurya","position":3,"designation":"Assistant Professor (SLG)","photo":"https://kongu.ac.in/static/media/devisurya.33ad4b174d4a83520dd8.webp","empId":"KEC-IT-010"}]'::jsonb, '[{"teamId":"team-07","queueOrder":1,"slotStart":"10:00 AM","slotEnd":"10:20 AM","status":"COMPLETED"},{"teamId":"team-08","queueOrder":2,"slotStart":"10:20 AM","slotEnd":"10:40 AM","status":"IN_VIVA"},{"teamId":"team-09","queueOrder":3,"slotStart":"10:40 AM","slotEnd":"11:00 AM","status":"STANDBY"}]'::jsonb),
('panel-04', 'Panel 04', 'Panel 04 - Mobile & Full-Stack Systems Lab', 'REV-2', 'IT Lab 1 - Mobile & Full-Stack Systems Lab (Ground Floor)', 'team-11', 'team-12', 'Team T-IT-11 is demonstrating BLE mesh. Team T-IT-12 (Smart Irrigation NPK), please assemble outside IT Lab 1!', '10:33 AM', '[{"id":"usr-jury-10","name":"A. Jeevanantham","position":1,"designation":"Assistant Professor (SLG)","photo":"https://kongu.ac.in/static/media/jeevanantham.3230d9b3b60bb86f64f5.webp","empId":"KEC-IT-009"},{"id":"usr-jury-11","name":"R. Aarthi","position":2,"designation":"Assistant Professor (SRG)","photo":"https://kongu.ac.in/static/media/aarthi.940d207f0de07bed88b1.webp","empId":"KEC-IT-012"},{"id":"usr-jury-12","name":"K. Sruthi","position":3,"designation":"Assistant Professor","photo":"https://kongu.ac.in/static/media/sruthi.11249391384841688c3c.webp","empId":"KEC-IT-013"}]'::jsonb, '[{"teamId":"team-10","queueOrder":1,"slotStart":"10:00 AM","slotEnd":"10:20 AM","status":"COMPLETED"},{"teamId":"team-11","queueOrder":2,"slotStart":"10:20 AM","slotEnd":"10:40 AM","status":"IN_VIVA"},{"teamId":"team-12","queueOrder":3,"slotStart":"10:40 AM","slotEnd":"11:00 AM","status":"STANDBY"}]'::jsonb),
('panel-05', 'Panel 05', 'Panel 05 - Data Analytics & Cloud Systems', 'REV-2', 'IT Seminar Hall B - Data Analytics & Cloud Systems (Second Floor)', 'team-14', 'team-15', 'Team T-IT-14 is demonstrating sub-microsecond matching. Team T-IT-15 (TinyML Speech), assemble outside Seminar Hall B!', '10:34 AM', '[{"id":"usr-jury-13","name":"S. Kavithra","position":1,"designation":"Assistant Professor","photo":"https://kongu.ac.in/static/media/kavithra.447901eba05648fb1728.webp","empId":"KEC-IT-014"},{"id":"usr-jury-14","name":"R. Sandhiya","position":2,"designation":"Assistant Professor","photo":"https://kongu.ac.in/static/media/sandhiya.833f882526b8d07b7a35.webp","empId":"KEC-IT-015"},{"id":"usr-jury-15","name":"V. P. Gayathri","position":3,"designation":"Assistant Professor","photo":"https://kongu.ac.in/static/media/gayathri.98f29377cebe69d30edb.webp","empId":"KEC-IT-016"}]'::jsonb, '[{"teamId":"team-13","queueOrder":1,"slotStart":"10:00 AM","slotEnd":"10:20 AM","status":"COMPLETED"},{"teamId":"team-14","queueOrder":2,"slotStart":"10:20 AM","slotEnd":"10:40 AM","status":"IN_VIVA"},{"teamId":"team-15","queueOrder":3,"slotStart":"10:40 AM","slotEnd":"11:00 AM","status":"STANDBY"}]'::jsonb);
