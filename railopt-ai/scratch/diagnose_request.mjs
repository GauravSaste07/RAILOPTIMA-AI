import { createClient } from '@supabase/supabase-js';

const url = 'https://qjrpuzbmkontriuyylcl.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcnB1emJta29udHJpdXl5bGNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYzNjI4NSwiZXhwIjoyMTA0MjEyMjg1fQ.K04GuuH5TR1wP0yRh3a8Kgcx-vQWiiBAczSGtgDgKkI';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqcnB1emJta29udHJpdXl5bGNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MzYyODUsImV4cCI6MjEwNDIxMjI4NX0.yym7zLjJ7gnM7_EPZ_JwgoTS7XBA51fvwks6ZOpg08I';

const supabaseAdmin = createClient(url, serviceKey);
const supabaseAnon = createClient(url, anonKey);

async function diagnose() {
  // 1. Most recent submission
  const { data: latestRows } = await supabaseAdmin
    .from('maintenance_requests')
    .select('id, status, risk_score, conflict_flag, department_id, section_id, defect_type, created_by, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('--- 1. MOST RECENT REQUESTS IN DB ---');
  console.log(JSON.stringify(latestRows, null, 2));

  if (!latestRows || latestRows.length === 0) return;
  const recent = latestRows[0];

  // 2. Who created it?
  const { data: profile } = await supabaseAdmin
    .from('users_profile')
    .select('id, role, department_id')
    .eq('id', recent.created_by)
    .single();

  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const creatorAuth = users.find((u) => u.id === recent.created_by);

  console.log('\n--- 2. CREATOR PROFILE & ACCOUNT ---');
  console.log({
    created_by_id: recent.created_by,
    email: creatorAuth?.email,
    role: profile?.role,
    profile_department_id: profile?.department_id,
    is_admin: profile?.role === 'admin'
  });

  // 4. Exact RiskQueue.jsx query simulation
  console.log('\n--- 4. EXACT RiskQueue.jsx QUERY SIMULATION ---');
  let allRequests = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAnon
      .from('maintenance_requests')
      .select(`
        id,
        asset_id,
        section_id,
        defect_type,
        requested_window_start,
        requested_window_end,
        risk_score,
        conflict_flag,
        conflicting_with,
        conflicting_approved_block_id,
        status,
        overdue_days,
        asset_stress_index,
        criticality,
        section_traffic_density,
        department_id,
        created_at,
        departments(id, name)
      `)
      .in('status', ['pending', 'scored', 'proposed'])
      .order('risk_score', { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Query error:', error);
      break;
    }
    if (data && data.length > 0) {
      allRequests = allRequests.concat(data);
      from += pageSize;
      if (data.length < pageSize) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  console.log('Total rows returned by RiskQueue query:', allRequests.length);
  const foundIndex = allRequests.findIndex((r) => r.id === recent.id);
  console.log(`Is '${recent.id}' in the returned array? ${foundIndex !== -1 ? 'YES at index ' + foundIndex : 'NO'}`);
  if (foundIndex !== -1) {
    console.log('Returned item:', JSON.stringify(allRequests[foundIndex], null, 2));
  }

  // Also check sorting in RiskQueue.jsx
  const sorted = [...allRequests].sort((a, b) => {
    if (a.risk_score === null && b.risk_score === null) return 0;
    if (a.risk_score === null) return 1;
    if (b.risk_score === null) return -1;
    return Number(b.risk_score) - Number(a.risk_score);
  });
  const sortedIndex = sorted.findIndex((r) => r.id === recent.id);
  console.log(`In RiskQueue's sorted array (sorted by risk_score desc): index = ${sortedIndex} of ${sorted.length}`);
}

diagnose().catch(console.error);
