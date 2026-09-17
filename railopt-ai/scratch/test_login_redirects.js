const path = require('path');
const fs = require('fs');

const { createClient } = require(path.resolve('frontend/node_modules/@supabase/supabase-js'));

const envContent = fs.readFileSync('frontend/.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

async function testAccount(email, password, label) {
  console.log(`\n========================================`);
  console.log(`Testing Login for ${label}`);
  console.log(`Email: ${email}`);
  console.log(`========================================`);

  // Create isolated client instance
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    console.error('❌ Login Error:', authError.message);
    return false;
  }

  console.log('✅ Supabase Auth Successful! User UID:', authData.user.id);

  // Query users_profile
  const { data: profile, error: profileError } = await supabase
    .from('users_profile')
    .select('id, role, department_id, departments(id, name)')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    console.error('❌ Profile Query Error:', profileError.message);
    return false;
  }

  console.log('✅ Profile Query Successful!');
  console.log('   - Role from DB:', profile.role);
  console.log('   - Department Name:', profile.departments?.name);

  // Determine Redirect Route (matching frontend Login.jsx logic)
  const redirectRoute = profile.role === 'admin' ? '/risk-queue' : '/submit-request';
  console.log(`🚀 Redirect Target determined post-auth: "${redirectRoute}"`);

  return {
    email,
    uid: authData.user.id,
    role: profile.role,
    department: profile.departments?.name,
    redirectRoute
  };
}

async function main() {
  const user1 = await testAccount('dept.engineer.1788774306608@railopt.com', 'TestPassword123!', '1. Regular Department User');
  const user2 = await testAccount('admin.controller@railopt.com', 'TestPassword123!', '2. Promoted Section Controller (Admin)');

  console.log('\n========================================');
  console.log('SUMMARY OF AUTH & ROLE-BASED ROUTING TEST');
  console.log('========================================');
  console.table([user1, user2]);
}

main().catch(console.error);
