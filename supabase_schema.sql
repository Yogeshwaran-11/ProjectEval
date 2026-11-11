-- ====================================================================
-- Kongu Engineering College (Autonomous) - Department of Information Technology
-- College Project Work Evaluation System - Supabase PostgreSQL Schema (v3.1)
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Stores Students, Faculty Juries, Admins, Super Admins)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'jury', 'admin', 'super_admin')),
    roll_or_emp_id TEXT UNIQUE NOT NULL,
    department TEXT DEFAULT 'Department of Information Technology',
    phone TEXT,
    photo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REVIEW ROUNDS TABLE (Review 0, Review 1, Review 2, Final Viva)
CREATE TABLE IF NOT EXISTS review_rounds (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    round_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    academic_year TEXT DEFAULT '2025-2026',
    max_score NUMERIC DEFAULT 50.0,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REVIEW-SPECIFIC DYNAMIC RUBRICS (5 Criteria x 10 Marks = 50 Marks per Review)
CREATE TABLE IF NOT EXISTS rubrics (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    review_round_id TEXT REFERENCES review_rounds(id) ON DELETE CASCADE,
    criterion_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    max_marks NUMERIC DEFAULT 10.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAMS TABLE (Project Teams with Mentor, Twin Students & Deliverables Triad)
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
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

-- 5. PANELS TABLE (3-Member Faculty Panels for Review Batches)
CREATE TABLE IF NOT EXISTS panels (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
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

-- 6. EVALUATIONS TABLE (Per-Jury Score Submission)
CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
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

-- Allow unrestricted anon and authenticated read/write access for portal operations
DO $$
BEGIN
    DROP POLICY IF EXISTS "profiles_all" ON profiles;
    CREATE POLICY "profiles_all" ON profiles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "review_rounds_all" ON review_rounds;
    CREATE POLICY "review_rounds_all" ON review_rounds FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "rubrics_all" ON rubrics;
    CREATE POLICY "rubrics_all" ON rubrics FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "teams_all" ON teams;
    CREATE POLICY "teams_all" ON teams FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "panels_all" ON panels;
    CREATE POLICY "panels_all" ON panels FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "evaluations_all" ON evaluations;
    CREATE POLICY "evaluations_all" ON evaluations FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Enable Realtime publications for live queue updates, alerts, and marks
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
-- SEED DATA: Review Rounds & Rubrics
-- ====================================================================

-- 1. Review Rounds
INSERT INTO review_rounds (id, round_code, name, academic_year, max_score, is_active) VALUES
('REV-0', 'REV-0', 'Review 0: Ideation & Feasibility', '2025-2026', 50, false),
('REV-1', 'REV-1', 'Review 1: Design & Architecture', '2025-2026', 50, false),
('REV-2', 'REV-2', 'Review 2: Implementation & Testing', '2025-2026', 50, true),
('REV-FINAL', 'REV-FINAL', 'Final Review & Viva Voce', '2025-2026', 50, false)
ON CONFLICT (id) DO UPDATE SET is_active = EXCLUDED.is_active;

-- 2. Rubrics for Review 0 (Ideation & Feasibility)
INSERT INTO rubrics (id, review_round_id, criterion_code, title, description, max_marks) VALUES
('R0-C1', 'REV-0', 'C1', 'Problem Identification & Relevance', 'Clarity of problem statement and industry/societal relevance', 10),
('R0-C2', 'REV-0', 'C2', 'Literature Review & Existing Work Study', 'Quality of indexed papers surveyed (IEEE, ACM, Springer)', 10),
('R0-C3', 'REV-0', 'C3', 'Proposed Objective & Methodology', 'Technical feasibility and novelty of proposed solution', 10),
('R0-C4', 'REV-0', 'C4', 'Feasibility Study & Work Plan', 'Gantt chart, resource planning, and milestone roadmap', 10),
('R0-C5', 'REV-0', 'C5', 'Presentation (PPT) & Viva Voce', 'Slide aesthetics, verbal delivery, and initial defense', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- 3. Rubrics for Review 1 (Design & Architecture)
INSERT INTO rubrics (id, review_round_id, criterion_code, title, description, max_marks) VALUES
('R1-C1', 'REV-1', 'C1', 'System Architecture & Data Flow Design', 'DFD diagrams, ER schema, and system component design', 10),
('R1-C2', 'REV-1', 'C2', 'Module Specifications & Database Schema', 'Database normalization, API contracts, and module breakdown', 10),
('R1-C3', 'REV-1', 'C3', 'Hardware / Software Stack Selection', 'Justification for selected framework, cloud services, and tools', 10),
('R1-C4', 'REV-1', 'C4', 'Initial Prototype / Wireframes & Git Setup', 'Figma/wireframes and GitHub repository branch setup', 10),
('R1-C5', 'REV-1', 'C5', 'Presentation (PPT) & Viva Voce', 'Technical depth of presentation and viva response', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- 4. Rubrics for Review 2 (Implementation & Testing - Active Review)
INSERT INTO rubrics (id, review_round_id, criterion_code, title, description, max_marks) VALUES
('R2-C1', 'REV-2', 'C1', 'Problem Definition & Novelty', 'Clarity of objective, relevance, and literature foundation', 10),
('R2-C2', 'REV-2', 'C2', 'System Architecture & Methodology', 'Design diagrams, algorithms, and technical workflow clarity', 10),
('R2-C3', 'REV-2', 'C3', 'Implementation & Code Quality (GitHub)', 'Repository structure, clean code, and commit history hygiene', 10),
('R2-C4', 'REV-2', 'C4', 'Live Demo & Deployment Verification', 'Working live prototype, responsiveness, and functional features', 10),
('R2-C5', 'REV-2', 'C5', 'Presentation (PPT) & Viva Voce Q&A', 'Slide quality, verbal clarity, and defense during viva questioning', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- 5. Rubrics for Final Review & Viva Voce
INSERT INTO rubrics (id, review_round_id, criterion_code, title, description, max_marks) VALUES
('RF-C1', 'REV-FINAL', 'C1', 'Full Functional Completeness & Novelty', 'All modules operational with distinct innovation/novelty', 10),
('RF-C2', 'REV-FINAL', 'C2', 'Live Deployed Application Output Testing', 'Production deployment, stress handling, and real-time output', 10),
('RF-C3', 'REV-FINAL', 'C3', 'GitHub Code Quality, Architecture & Documentation', 'Clean architecture, automated tests, and clear README documentation', 10),
('RF-C4', 'REV-FINAL', 'C4', 'Project Report / Documentation Standard', 'IEEE format compliance, plagiarism report, and certificate pages', 10),
('RF-C5', 'REV-FINAL', 'C5', 'Comprehensive Viva Voce & Defense', 'Individual viva performance, cross-questioning defense', 10)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

-- 6. Official Department Faculty Directory (30 Faculty + HOD + Admin)
INSERT INTO profiles (id, email, full_name, role, roll_or_emp_id, department) VALUES
('fac-varadhaganapathy', 'hod_it@kongu.ac.in', 'Dr. S. Varadhaganapathy', 'super_admin', 'KEC-IT-HOD', 'Department of Information Technology'),
('fac-senthilkumar', 'senthilkumar.it@kongu.ac.in', 'Mr. Senthilkumar', 'admin', 'KEC-IT-LA01', 'Department of Information Technology'),
('fac-premalatha', 'premalatha@kongu.ac.in', 'Dr. J. Premalatha', 'jury', 'KEC-IT-002', 'Department of Information Technology'),
('fac-anandamurugan', 'anandamurugan@kongu.ac.in', 'Dr. S. Anandamurugan', 'jury', 'KEC-IT-003', 'Department of Information Technology'),
('fac-kamalam', 'kamalam@kongu.ac.in', 'Dr. G. K. Kamalam', 'jury', 'KEC-IT-004', 'Department of Information Technology'),
('fac-shanthakumari', 'shanthakumari@kongu.ac.in', 'Dr. R. Shanthakumari', 'jury', 'KEC-IT-005', 'Department of Information Technology'),
('fac-roopadevi', 'roopadevi@kongu.ac.in', 'Dr. E. M. Roopa Devi', 'jury', 'KEC-IT-006', 'Department of Information Technology'),
('fac-vijayanand', 'vijayanand@kongu.ac.in', 'D. Vijay Anand', 'jury', 'KEC-IT-007', 'Department of Information Technology'),
('fac-ponselvakumar', 'ponselvakumar@kongu.ac.in', 'A. P. Ponselvakumar', 'jury', 'KEC-IT-008', 'Department of Information Technology'),
('fac-jeevanantham', 'jeevanantham@kongu.ac.in', 'A. Jeevanantham', 'jury', 'KEC-IT-009', 'Department of Information Technology'),
('fac-devisurya', 'devisurya@kongu.ac.in', 'Dr. V. Devisurya', 'jury', 'KEC-IT-010', 'Department of Information Technology'),
('fac-vinothkumar', 'vinothkumar@kongu.ac.in', 'S. Vinothkumar', 'jury', 'KEC-IT-011', 'Department of Information Technology'),
('fac-aarthi', 'aarthi@kongu.ac.in', 'R. Aarthi', 'jury', 'KEC-IT-012', 'Department of Information Technology'),
('fac-sruthi', 'sruthi@kongu.ac.in', 'K. Sruthi', 'jury', 'KEC-IT-013', 'Department of Information Technology'),
('fac-kavithra', 'kavithra@kongu.ac.in', 'S. Kavithra', 'jury', 'KEC-IT-014', 'Department of Information Technology'),
('fac-sandhiya', 'sandhiya@kongu.ac.in', 'R. Sandhiya', 'jury', 'KEC-IT-015', 'Department of Information Technology'),
('fac-gayathri', 'gayathri@kongu.ac.in', 'V. P. Gayathri', 'jury', 'KEC-IT-016', 'Department of Information Technology'),
('fac-vanitha', 'vanitha@kongu.ac.in', 'P. Vanitha', 'jury', 'KEC-IT-017', 'Department of Information Technology'),
('fac-deenumol', 'deenumol@kongu.ac.in', 'A. Deenu Mol', 'jury', 'KEC-IT-018', 'Department of Information Technology'),
('fac-vaishnavi', 'vaishnavi@kongu.ac.in', 'T. Vaishnavi', 'jury', 'KEC-IT-019', 'Department of Information Technology'),
('fac-krishnaveni', 'krishnaveni@kongu.ac.in', 'S. Krishnaveni', 'jury', 'KEC-IT-020', 'Department of Information Technology'),
('fac-prathika', 'prathika@kongu.ac.in', 'M. E. Prathika', 'jury', 'KEC-IT-021', 'Department of Information Technology'),
('fac-vishnupriya', 'vishnupriya@kongu.ac.in', 'T. S. Vishnu Priya', 'jury', 'KEC-IT-022', 'Department of Information Technology'),
('fac-monica', 'monica@kongu.ac.in', 'Monica Murugesan', 'jury', 'KEC-IT-023', 'Department of Information Technology'),
('fac-suganya', 'suganya@kongu.ac.in', 'S. Suganya', 'jury', 'KEC-IT-024', 'Department of Information Technology'),
('fac-sasikala', 'sasikala@kongu.ac.in', 'G. Sasikala', 'jury', 'KEC-IT-025', 'Department of Information Technology'),
('fac-sowmiya', 'sowmiya@kongu.ac.in', 'E. Sowmiya', 'jury', 'KEC-IT-026', 'Department of Information Technology'),
('fac-sripriya', 'sripriya@kongu.ac.in', 'S. Sripriya', 'jury', 'KEC-IT-027', 'Department of Information Technology'),
('fac-nithyakumar', 'nithyakumar@kongu.ac.in', 'M. Nithyakumar', 'jury', 'KEC-IT-028', 'Department of Information Technology'),
('fac-govindaraj', 'govindaraj@kongu.ac.in', 'S. Govindaraj', 'jury', 'KEC-IT-029', 'Department of Information Technology'),
('fac-vivek', 'vivek@kongu.ac.in', 'Vivek Amruth Chinnasamy', 'jury', 'KEC-IT-030', 'Department of Information Technology')
ON CONFLICT (id) DO NOTHING;
