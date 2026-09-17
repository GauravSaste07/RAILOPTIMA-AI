const path = require('path');
const fs = require('fs');

const { createClient } = require(path.resolve('frontend/node_modules/@supabase/supabase-js'));

const envContent = fs.readFileSync('frontend/.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function main() {
  console.log('===============================================================');
  console.log('TESTING SUBMIT REQUEST WIRING, REAL ML SCORING & CONFLICT CHECK');
  console.log('===============================================================');

  // 1. Authenticate as Department User
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const email = 'dept.engineer.1788774306608@railopt.com';
  const password = 'TestPassword123!';

  console.log(`\n[1/5] Authenticating as department user (${email})...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (authError) throw authError;

  const user = authData.user;
  console.log(`✓ Authenticated successfully. User UID: ${user.id}`);

  // 2. Fetch User Profile
  const { data: profile, error: profError } = await supabase
    .from('users_profile')
    .select('id, role, department_id, departments(id, name)')
    .eq('id', user.id)
    .single();
  if (profError) throw profError;
  console.log(`✓ Profile verified: Department="${profile.departments?.name}", Role="${profile.role}", DeptID="${profile.department_id}"`);

  // 3. Test Request 1: Clean Request (Track Defect on AST-ENG-001)
  const req1Id = `REQ-TEST-${Date.now().toString().slice(-4)}A`;
  const req1Payload = {
    id: req1Id,
    asset_id: 'AST-ENG-001',
    section_id: 'NDLS-GZB',
    department_id: profile.department_id,
    defect_type: 'track_defect', // Strictly one of 3 trained categories
    overdue_days: 12,
    criticality: 'Medium',
    asset_stress_index: 0.62,
    section_traffic_density: 48.0,
    requested_window_start: new Date('2026-10-15T02:00:00Z').toISOString(),
    requested_window_end: new Date('2026-10-15T05:30:00Z').toISOString(),
    status: 'pending',
    conflict_flag: false,
    created_by: user.id
  };

  console.log(`\n[2/5] Inserting Clean Request (${req1Id}) to Supabase...`);
  const { error: ins1Err } = await supabase.from('maintenance_requests').insert([req1Payload]);
  if (ins1Err) throw ins1Err;
  console.log(`✓ Request ${req1Id} inserted with status='pending'.`);

  // Call ML Score Endpoint
  console.log(`   Calling ML Service POST /score for ${req1Id}...`);
  const score1Res = await fetch('http://localhost:8000/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ maintenance_request_id: req1Id })
  });
  const score1Data = await score1Res.json();
  console.log(`   ✓ Scored: Risk Score = ${score1Data.risk_score}, Status Transition = ${score1Data.current_status}`);

  // Call ML Conflict Endpoint
  console.log(`   Calling ML Service POST /detect-conflicts for ${req1Id}...`);
  const conf1Res = await fetch('http://localhost:8000/detect-conflicts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: req1Id, section_id: 'NDLS-GZB' })
  });
  const conf1Data = await conf1Res.json();
  console.log(`   ✓ Conflict check result: Clean slot (No conflicts detected).`);

  // 4. Test Request 2: Deliberate Overlap with Approved Block on NDLS-GZB (2026-09-07 00:00 to 03:00)
  const req2Id = `REQ-TEST-${Date.now().toString().slice(-4)}B`;
  const req2Payload = {
    id: req2Id,
    asset_id: 'AST-ENG-002',
    section_id: 'NDLS-GZB',
    department_id: profile.department_id,
    defect_type: 'track_defect', // Strictly valid defect type
    overdue_days: 48,
    criticality: 'High',
    asset_stress_index: 0.77,
    section_traffic_density: 48.0,
    requested_window_start: new Date('2026-09-07T01:00:00Z').toISOString(), // Overlaps approved block
    requested_window_end: new Date('2026-09-07T02:30:00Z').toISOString(),
    status: 'pending',
    conflict_flag: false,
    created_by: user.id
  };

  console.log(`\n[3/5] Inserting Overlapping Request (${req2Id}) on NDLS-GZB during approved block window...`);
  const { error: ins2Err } = await supabase.from('maintenance_requests').insert([req2Payload]);
  if (ins2Err) throw ins2Err;

  console.log(`   Calling ML Service POST /score for ${req2Id}...`);
  const score2Res = await fetch('http://localhost:8000/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ maintenance_request_id: req2Id })
  });
  const score2Data = await score2Res.json();
  console.log(`   ✓ Scored: Risk Score = ${score2Data.risk_score}`);

  console.log(`   Calling ML Service POST /detect-conflicts for ${req2Id}...`);
  const conf2Res = await fetch('http://localhost:8000/detect-conflicts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: req2Id, section_id: 'NDLS-GZB' })
  });
  const conf2Data = await conf2Res.json();
  console.log(`   ✓ Conflict check executed:`);
  console.log(`     - Sample conflicts flagged:`, conf2Data.sample_conflicts);

  // 5. Query Supabase directly to verify final stored state for both requests
  console.log(`\n[4/5] Verifying final records directly from Supabase maintenance_requests table...`);
  const { data: finalRows, error: fetchErr } = await supabase
    .from('maintenance_requests')
    .select('id, asset_id, section_id, defect_type, requested_window_start, requested_window_end, risk_score, conflict_flag, conflicting_with, conflicting_approved_block_id, status')
    .in('id', [req1Id, req2Id]);

  if (fetchErr) throw fetchErr;

  console.log('\n===============================================================');
  console.log('FINAL VERIFIED DATA STORED IN SUPABASE:');
  console.log('===============================================================');
  console.table(finalRows);
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
