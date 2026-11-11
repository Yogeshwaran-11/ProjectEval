/**
 * Kongu Engineering College (Autonomous) - Department of Information Technology
 * Project Evaluation System - Complete Supabase Seeder & Diagnostic CLI
 *
 * Usage:
 *   node seed_faculty.cjs           # Test connection & table health
 *   node seed_faculty.cjs --seed    # Full sync of faculty, rounds, rubrics to Supabase Cloud
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnv() {
  const envPath = path.resolve(__dirname, '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

const FACULTY = [
  { id: 'fac-varadhaganapathy', email: 'hod_it@kongu.ac.in', full_name: 'Dr. S. Varadhaganapathy', role: 'super_admin', roll_or_emp_id: 'KEC-IT-HOD', department: 'Department of Information Technology' },
  { id: 'fac-senthilkumar', email: 'senthilkumar.it@kongu.ac.in', full_name: 'Mr. Senthilkumar', role: 'admin', roll_or_emp_id: 'KEC-IT-LA01', department: 'Department of Information Technology' },
  { id: 'fac-premalatha', email: 'premalatha@kongu.ac.in', full_name: 'Dr. J. Premalatha', role: 'jury', roll_or_emp_id: 'KEC-IT-002', department: 'Department of Information Technology' },
  { id: 'fac-anandamurugan', email: 'anandamurugan@kongu.ac.in', full_name: 'Dr. S. Anandamurugan', role: 'jury', roll_or_emp_id: 'KEC-IT-003', department: 'Department of Information Technology' },
  { id: 'fac-kamalam', email: 'kamalam@kongu.ac.in', full_name: 'Dr. G. K. Kamalam', role: 'jury', roll_or_emp_id: 'KEC-IT-004', department: 'Department of Information Technology' },
  { id: 'fac-shanthakumari', email: 'shanthakumari@kongu.ac.in', full_name: 'Dr. R. Shanthakumari', role: 'jury', roll_or_emp_id: 'KEC-IT-005', department: 'Department of Information Technology' },
  { id: 'fac-roopadevi', email: 'roopadevi@kongu.ac.in', full_name: 'Dr. E. M. Roopa Devi', role: 'jury', roll_or_emp_id: 'KEC-IT-006', department: 'Department of Information Technology' },
  { id: 'fac-vijayanand', email: 'vijayanand@kongu.ac.in', full_name: 'D. Vijay Anand', role: 'jury', roll_or_emp_id: 'KEC-IT-007', department: 'Department of Information Technology' },
  { id: 'fac-ponselvakumar', email: 'ponselvakumar@kongu.ac.in', full_name: 'A. P. Ponselvakumar', role: 'jury', roll_or_emp_id: 'KEC-IT-008', department: 'Department of Information Technology' },
  { id: 'fac-jeevanantham', email: 'jeevanantham@kongu.ac.in', full_name: 'A. Jeevanantham', role: 'jury', roll_or_emp_id: 'KEC-IT-009', department: 'Department of Information Technology' },
  { id: 'fac-devisurya', email: 'devisurya@kongu.ac.in', full_name: 'Dr. V. Devisurya', role: 'jury', roll_or_emp_id: 'KEC-IT-010', department: 'Department of Information Technology' },
  { id: 'fac-vinothkumar', email: 'vinothkumar@kongu.ac.in', full_name: 'S. Vinothkumar', role: 'jury', roll_or_emp_id: 'KEC-IT-011', department: 'Department of Information Technology' },
  { id: 'fac-aarthi', email: 'aarthi@kongu.ac.in', full_name: 'R. Aarthi', role: 'jury', roll_or_emp_id: 'KEC-IT-012', department: 'Department of Information Technology' },
  { id: 'fac-sruthi', email: 'sruthi@kongu.ac.in', full_name: 'K. Sruthi', role: 'jury', roll_or_emp_id: 'KEC-IT-013', department: 'Department of Information Technology' },
  { id: 'fac-kavithra', email: 'kavithra@kongu.ac.in', full_name: 'S. Kavithra', role: 'jury', roll_or_emp_id: 'KEC-IT-014', department: 'Department of Information Technology' },
  { id: 'fac-sandhiya', email: 'sandhiya@kongu.ac.in', full_name: 'R. Sandhiya', role: 'jury', roll_or_emp_id: 'KEC-IT-015', department: 'Department of Information Technology' },
  { id: 'fac-gayathri', email: 'gayathri@kongu.ac.in', full_name: 'V. P. Gayathri', role: 'jury', roll_or_emp_id: 'KEC-IT-016', department: 'Department of Information Technology' },
  { id: 'fac-vanitha', email: 'vanitha@kongu.ac.in', full_name: 'P. Vanitha', role: 'jury', roll_or_emp_id: 'KEC-IT-017', department: 'Department of Information Technology' },
  { id: 'fac-deenumol', email: 'deenumol@kongu.ac.in', full_name: 'A. Deenu Mol', role: 'jury', roll_or_emp_id: 'KEC-IT-018', department: 'Department of Information Technology' },
  { id: 'fac-vaishnavi', email: 'vaishnavi@kongu.ac.in', full_name: 'T. Vaishnavi', role: 'jury', roll_or_emp_id: 'KEC-IT-019', department: 'Department of Information Technology' },
  { id: 'fac-krishnaveni', email: 'krishnaveni@kongu.ac.in', full_name: 'S. Krishnaveni', role: 'jury', roll_or_emp_id: 'KEC-IT-020', department: 'Department of Information Technology' },
  { id: 'fac-prathika', email: 'prathika@kongu.ac.in', full_name: 'M. E. Prathika', role: 'jury', roll_or_emp_id: 'KEC-IT-021', department: 'Department of Information Technology' },
  { id: 'fac-vishnupriya', email: 'vishnupriya@kongu.ac.in', full_name: 'T. S. Vishnu Priya', role: 'jury', roll_or_emp_id: 'KEC-IT-022', department: 'Department of Information Technology' },
  { id: 'fac-monica', email: 'monica@kongu.ac.in', full_name: 'Monica Murugesan', role: 'jury', roll_or_emp_id: 'KEC-IT-023', department: 'Department of Information Technology' },
  { id: 'fac-suganya', email: 'suganya@kongu.ac.in', full_name: 'S. Suganya', role: 'jury', roll_or_emp_id: 'KEC-IT-024', department: 'Department of Information Technology' },
  { id: 'fac-sasikala', email: 'sasikala@kongu.ac.in', full_name: 'G. Sasikala', role: 'jury', roll_or_emp_id: 'KEC-IT-025', department: 'Department of Information Technology' },
  { id: 'fac-sowmiya', email: 'sowmiya@kongu.ac.in', full_name: 'E. Sowmiya', role: 'jury', roll_or_emp_id: 'KEC-IT-026', department: 'Department of Information Technology' },
  { id: 'fac-sripriya', email: 'sripriya@kongu.ac.in', full_name: 'S. Sripriya', role: 'jury', roll_or_emp_id: 'KEC-IT-027', department: 'Department of Information Technology' },
  { id: 'fac-nithyakumar', email: 'nithyakumar@kongu.ac.in', full_name: 'M. Nithyakumar', role: 'jury', roll_or_emp_id: 'KEC-IT-028', department: 'Department of Information Technology' },
  { id: 'fac-govindaraj', email: 'govindaraj@kongu.ac.in', full_name: 'S. Govindaraj', role: 'jury', roll_or_emp_id: 'KEC-IT-029', department: 'Department of Information Technology' },
  { id: 'fac-vivek', email: 'vivek@kongu.ac.in', full_name: 'Vivek Amruth Chinnasamy', role: 'jury', roll_or_emp_id: 'KEC-IT-030', department: 'Department of Information Technology' }
];

const ROUNDS = [
  { id: 'REV-0', round_code: 'REV-0', name: 'Review 0: Ideation & Feasibility', academic_year: '2025-2026', max_score: 50, is_active: false },
  { id: 'REV-1', round_code: 'REV-1', name: 'Review 1: Design & Architecture', academic_year: '2025-2026', max_score: 50, is_active: false },
  { id: 'REV-2', round_code: 'REV-2', name: 'Review 2: Implementation & Testing', academic_year: '2025-2026', max_score: 50, is_active: true },
  { id: 'REV-FINAL', round_code: 'REV-FINAL', name: 'Final Review & Viva Voce', academic_year: '2025-2026', max_score: 50, is_active: false }
];

async function main() {
  console.log('='.repeat(70));
  console.log('  KEC IT Project Evaluation - Supabase Backend Diagnostic & Seeder');
  console.log('='.repeat(70));

  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.length < 20) {
    console.log('⚠️  VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid in .env');
    console.log('ℹ️  The application is operating in Local Interactive Mode (Full parity, offline).');
    return;
  }

  console.log(`📡 Supabase Endpoint: ${supabaseUrl}`);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase.from('profiles').select('id, full_name').limit(3);

    if (error) {
      console.log(`\n❌ Supabase Connection Check: ${error.message}`);
      console.log('\n💡 Quick Setup Instructions:');
      console.log('   1. Go to https://supabase.com and create a project.');
      console.log('   2. Open the SQL Editor and run `supabase_schema.sql`.');
      console.log('   3. Put your real Project URL & Anon Key into `.env`.');
      return;
    }

    console.log(`\n✅ Connected to Supabase Cloud! Found ${data?.length || 0} existing profile records.`);

    if (process.argv.includes('--seed')) {
      console.log('\n🌱 Seeding review rounds...');
      await supabase.from('review_rounds').upsert(ROUNDS, { onConflict: 'id' });

      console.log(`🌱 Seeding ${FACULTY.length} faculty profiles...`);
      const { error: seedErr } = await supabase.from('profiles').upsert(FACULTY, { onConflict: 'id' });
      if (seedErr) {
        console.error('❌ Error seeding profiles:', seedErr.message);
      } else {
        console.log(`✅ Successfully seeded ${FACULTY.length} official KEC IT faculty profiles!`);
      }
    } else {
      console.log('\n💡 To seed the cloud database, run: node seed_faculty.cjs --seed');
    }
  } catch (err) {
    console.log(`ℹ️  Status: ${err.message}`);
  }
}

main();
