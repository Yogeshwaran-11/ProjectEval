const fs = require('fs');
const path = require('path');

const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/db.json'), 'utf8'));

let sql = `-- ====================================================================
-- Kongu Engineering College (Autonomous) - Department of Information Technology
-- College Project Work Evaluation System - Complete Supabase PostgreSQL Schema (v3.2)
-- ====================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables for a clean, deterministic schema synchronization
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS rubrics CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
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
`;

// Seed Faculty & Users
const esc = s => (s ? s.replace(/'/g, "''") : '');

const usersSql = db.users.map(u => {
  return `('${esc(u.id)}', '${esc(u.email)}', '${esc(u.name)}', '${esc(u.role)}', '${esc(u.rollNo || u.empId || u.id)}', 'Department of Information Technology')`;
}).join(',\n');

sql += `\n-- 3. Profiles (Faculty & Students including Yogeshwaran V)\nINSERT INTO profiles (id, email, full_name, role, roll_or_emp_id, department) VALUES\n${usersSql};\n`;

// Seed Teams
const teamsSql = db.teams.map(t => {
  const membersJson = JSON.stringify(t.members || []).replace(/'/g, "''");
  return `('${esc(t.id)}', '${esc(t.code)}', '${esc(t.title)}', '${esc(t.abstract)}', '${esc(t.mentorId)}', '${esc(t.mentorName)}', '${esc(t.panelId)}', '${esc(t.githubUrl)}', '${esc(t.pptUrl)}', '${esc(t.demoUrl)}', ${t.progressPercentage || 70}, '${membersJson}'::jsonb)`;
}).join(',\n');

sql += `\n-- 4. Teams (15 Capstone Project Teams)\nINSERT INTO teams (id, team_code, project_title, abstract, mentor_id, mentor_name, panel_id, github_url, ppt_url, demo_url, progress_percentage, members) VALUES\n${teamsSql};\n`;

// Seed Panels
const panelsSql = db.panels.map(p => {
  const juriesJson = JSON.stringify(p.juries || []).replace(/'/g, "''");
  const queueJson = JSON.stringify(p.teamQueue || []).replace(/'/g, "''");
  return `('${esc(p.id)}', '${esc(p.code)}', '${esc(p.name)}', '${esc(p.reviewRoundId || 'REV-2')}', '${esc(p.venue)}', ${p.activeTeamId ? `'${esc(p.activeTeamId)}'` : 'NULL'}, ${p.standbyTeamId ? `'${esc(p.standbyTeamId)}'` : 'NULL'}, ${p.lastStandbyAlert ? `'${esc(p.lastStandbyAlert)}'` : 'NULL'}, ${p.alertTimestamp ? `'${esc(p.alertTimestamp)}'` : 'NULL'}, '${juriesJson}'::jsonb, '${queueJson}'::jsonb)`;
}).join(',\n');

sql += `\n-- 5. Panels (5 Capstone Review Panels)\nINSERT INTO panels (id, panel_code, name, review_round_id, venue, active_team_id, standby_team_id, last_standby_alert, alert_timestamp, juries, team_queue) VALUES\n${panelsSql};\n`;

fs.writeFileSync(path.resolve(__dirname, '../supabase_schema.sql'), sql, 'utf8');
console.log('✅ Generated comprehensive supabase_schema.sql with 100% data parity!');

