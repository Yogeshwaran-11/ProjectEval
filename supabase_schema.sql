-- ====================================================================
-- College Project Work Evaluation System - Supabase PostgreSQL Schema
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Stores Students, Faculty Juries, Admins, Super Admins)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'jury', 'admin', 'super_admin')),
    roll_or_emp_id TEXT UNIQUE NOT NULL,
    department TEXT DEFAULT 'Computer Science & Engineering',
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REVIEW ROUNDS TABLE (Review 0, Review 1, Review 2, Final Viva)
CREATE TABLE IF NOT EXISTS review_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    academic_year TEXT DEFAULT '2025-2026',
    max_score NUMERIC DEFAULT 50.0,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REVIEW-SPECIFIC DYNAMIC RUBRICS (5 Criteria x 10 Marks = 50 Marks per Review)
CREATE TABLE IF NOT EXISTS rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_round_id UUID REFERENCES review_rounds(id) ON DELETE CASCADE,
    criterion_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    max_marks NUMERIC DEFAULT 10.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TEAMS TABLE (Project Teams with Mentor & Deliverables Triad)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_code TEXT UNIQUE NOT NULL,
    project_title TEXT NOT NULL,
    abstract TEXT,
    mentor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    mentor_name TEXT,
    github_url TEXT,
    ppt_url TEXT,
    demo_url TEXT,
    progress_percentage INT DEFAULT 70 CHECK (progress_percentage BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TEAM MEMBERS (Twin / Multi-Student per team)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    student_name TEXT,
    roll_no TEXT,
    is_lead BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, student_id)
);

-- 6. PANELS TABLE (3-Member Faculty Panels for Review Batches)
CREATE TABLE IF NOT EXISTS panels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_code TEXT UNIQUE NOT NULL,
    review_round_id UUID REFERENCES review_rounds(id) ON DELETE CASCADE,
    current_venue TEXT DEFAULT 'Lab 402 - Cloud Computing Lab',
    active_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    standby_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    last_standby_alert TEXT,
    alert_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PANEL JURIES (Exactly 3 Faculty members assigned per panel)
CREATE TABLE IF NOT EXISTS panel_juries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    jury_position INT NOT NULL CHECK (jury_position IN (1, 2, 3)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(panel_id, jury_position)
);

-- 8. PANEL TEAMS (Queue Roster for the Panel with Individual Time Slots)
CREATE TABLE IF NOT EXISTS panel_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    queue_order INT NOT NULL,
    slot_start TEXT NOT NULL,
    slot_end TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'STANDBY', 'IN_VIVA', 'COMPLETED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(panel_id, team_id)
);

-- 9. EVALUATIONS TABLE (Per-Jury Score Submission)
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    review_round_id UUID REFERENCES review_rounds(id) ON DELETE CASCADE,
    jury_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    total_score NUMERIC DEFAULT 0.0,
    remarks TEXT,
    is_locked BOOLEAN DEFAULT false,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(panel_id, team_id, review_round_id, jury_id)
);

-- 10. EVALUATION MARKS (Itemized Breakdown for each Rubric Criterion)
CREATE TABLE IF NOT EXISTS evaluation_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
    rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
    marks_awarded NUMERIC NOT NULL CHECK (marks_awarded >= 0),
    UNIQUE(evaluation_id, rubric_id)
);

-- Enable Realtime on Panels and Panel Teams for instantaneous student alert sync
ALTER PUBLICATION supabase_realtime ADD TABLE panels;
ALTER PUBLICATION supabase_realtime ADD TABLE panel_teams;

-- ====================================================================
-- SEED DATA: Review Rounds, Rubrics, Faculty, Teams, Panels
-- ====================================================================

-- Seed Review Rounds
INSERT INTO review_rounds (id, round_code, name, academic_year, max_score, is_active) VALUES
('11111111-1111-1111-1111-111111111111', 'REV-0', 'Review 0: Ideation & Feasibility', '2025-2026', 50, false),
('22222222-2222-2222-2222-222222222222', 'REV-1', 'Review 1: Design & Architecture', '2025-2026', 50, false),
('33333333-3333-3333-3333-333333333333', 'REV-2', 'Review 2: Implementation & Testing', '2025-2026', 50, true),
('44444444-4444-4444-4444-444444444444', 'REV-FINAL', 'Final Review & Viva Voce', '2025-2026', 50, false)
ON CONFLICT (round_code) DO NOTHING;

-- Seed Rubrics for Review 2 (Active Review)
INSERT INTO rubrics (review_round_id, criterion_code, title, description, max_marks) VALUES
('33333333-3333-3333-3333-333333333333', 'C1', 'Problem Definition & Novelty', 'Clarity of objective, relevance, and literature foundation', 10),
('33333333-3333-3333-3333-333333333333', 'C2', 'System Architecture & Methodology', 'Design diagrams, algorithms, and technical workflow clarity', 10),
('33333333-3333-3333-3333-333333333333', 'C3', 'Implementation & Code Quality (GitHub)', 'Repository structure, clean code, and commit history hygiene', 10),
('33333333-3333-3333-3333-333333333333', 'C4', 'Live Demo & Deployment Verification', 'Working live prototype, responsiveness, and functional features', 10),
('33333333-3333-3333-3333-333333333333', 'C5', 'Presentation (PPT) & Viva Voce Q&A', 'Slide quality, verbal clarity, and defense during viva questioning', 10)
ON CONFLICT DO NOTHING;

-- Seed Official Department Faculty Directory (30 Faculty + 1 Admin)
INSERT INTO profiles (email, full_name, role, roll_or_emp_id, department) VALUES
('hod_it@kongu.ac.in', 'Dr. S. Varadhaganapathy', 'super_admin', 'KEC-IT-HOD', 'Department of Information Technology'),
('senthilkumar.it@kongu.ac.in', 'Mr. Senthilkumar', 'admin', 'KEC-IT-LA01', 'Department of Information Technology'),
('premalatha@kongu.ac.in', 'Dr. J. Premalatha', 'jury', 'KEC-IT-002', 'Department of Information Technology'),
('anandamurugan@kongu.ac.in', 'Dr. S. Anandamurugan', 'jury', 'KEC-IT-003', 'Department of Information Technology'),
('kamalam@kongu.ac.in', 'Dr. G. K. Kamalam', 'jury', 'KEC-IT-004', 'Department of Information Technology'),
('shanthakumari@kongu.ac.in', 'Dr. R. Shanthakumari', 'jury', 'KEC-IT-005', 'Department of Information Technology'),
('roopadevi@kongu.ac.in', 'Dr. E. M. Roopa Devi', 'jury', 'KEC-IT-006', 'Department of Information Technology'),
('vijayanand@kongu.ac.in', 'D. Vijay Anand', 'jury', 'KEC-IT-007', 'Department of Information Technology'),
('ponselvakumar@kongu.ac.in', 'A. P. Ponselvakumar', 'jury', 'KEC-IT-008', 'Department of Information Technology'),
('jeevanantham@kongu.ac.in', 'A. Jeevanantham', 'jury', 'KEC-IT-009', 'Department of Information Technology'),
('devisurya@kongu.ac.in', 'Dr. V. Devisurya', 'jury', 'KEC-IT-010', 'Department of Information Technology'),
('vinothkumar@kongu.ac.in', 'S. Vinothkumar', 'jury', 'KEC-IT-011', 'Department of Information Technology'),
('aarthi@kongu.ac.in', 'R. Aarthi', 'jury', 'KEC-IT-012', 'Department of Information Technology'),
('sruthi@kongu.ac.in', 'K. Sruthi', 'jury', 'KEC-IT-013', 'Department of Information Technology'),
('kavithra@kongu.ac.in', 'S. Kavithra', 'jury', 'KEC-IT-014', 'Department of Information Technology'),
('sandhiya@kongu.ac.in', 'R. Sandhiya', 'jury', 'KEC-IT-015', 'Department of Information Technology'),
('gayathri@kongu.ac.in', 'V. P. Gayathri', 'jury', 'KEC-IT-016', 'Department of Information Technology'),
('vanitha@kongu.ac.in', 'P. Vanitha', 'jury', 'KEC-IT-017', 'Department of Information Technology'),
('deenumol@kongu.ac.in', 'A. Deenu Mol', 'jury', 'KEC-IT-018', 'Department of Information Technology'),
('vaishnavi@kongu.ac.in', 'T. Vaishnavi', 'jury', 'KEC-IT-019', 'Department of Information Technology'),
('krishnaveni@kongu.ac.in', 'S. Krishnaveni', 'jury', 'KEC-IT-020', 'Department of Information Technology'),
('prathika@kongu.ac.in', 'M. E. Prathika', 'jury', 'KEC-IT-021', 'Department of Information Technology'),
('vishnupriya@kongu.ac.in', 'T. S. Vishnu Priya', 'jury', 'KEC-IT-022', 'Department of Information Technology'),
('monica@kongu.ac.in', 'Monica Murugesan', 'jury', 'KEC-IT-023', 'Department of Information Technology'),
('suganya@kongu.ac.in', 'S. Suganya', 'jury', 'KEC-IT-024', 'Department of Information Technology'),
('sasikala@kongu.ac.in', 'G. Sasikala', 'jury', 'KEC-IT-025', 'Department of Information Technology'),
('sowmiya@kongu.ac.in', 'E. Sowmiya', 'jury', 'KEC-IT-026', 'Department of Information Technology'),
('sripriya@kongu.ac.in', 'S. Sripriya', 'jury', 'KEC-IT-027', 'Department of Information Technology'),
('nithyakumar@kongu.ac.in', 'M. Nithyakumar', 'jury', 'KEC-IT-028', 'Department of Information Technology'),
('govindaraj@kongu.ac.in', 'S. Govindaraj', 'jury', 'KEC-IT-029', 'Department of Information Technology'),
('vivek@kongu.ac.in', 'Vivek Amruth Chinnasamy', 'jury', 'KEC-IT-030', 'Department of Information Technology')
ON CONFLICT (email) DO NOTHING;

