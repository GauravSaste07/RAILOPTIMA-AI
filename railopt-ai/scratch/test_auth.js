const path = require('path');
const fs = require('fs');

const { createClient } = require(path.resolve('frontend/node_modules/@supabase/supabase-js'));

const envContent = fs.readFileSync('frontend/.env', 'utf8');
const supabaseUrl = envContent.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const supabaseAnonKey = envContent.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('--- Step 1: Query Departments ---');
  const { data: depts, error: deptErr } = await supabase.from('departments').select('*');
  if (deptErr) throw deptErr;
  console.log('Available Departments:', depts);

  const engDept = depts.find(d => d.name === 'Engineering');

  // Account 1: Regular Department User
  const deptUserEmail = `dept.engineer.${Date.now()}@railopt.com`;
  const password = 'TestPassword123!';

  console.log(`\n--- Step 2: Sign Up Department User (${deptUserEmail}) ---`);
  const { data: user1Data, error: u1Err } = await supabase.auth.signUp({
    email: deptUserEmail,
    password,
    options: {
      data: {
        department_id: engDept.id,
        department: engDept.name,
        role: 'user'
      }
    }
  });
  if (u1Err) throw u1Err;
  console.log('Signed up user 1 ID:', user1Data.user?.id);

  // Account 2: Admin Controller Account
  const adminEmail = `admin.controller.${Date.now()}@railopt.com`;
  console.log(`\n--- Step 3: Sign Up Admin User (${adminEmail}) ---`);
  const { data: user2Data, error: u2Err } = await supabase.auth.signUp({
    email: adminEmail,
    password,
    options: {
      data: {
        department_id: engDept.id,
        department: engDept.name,
        role: 'user'
      }
    }
  });
  if (u2Err) throw u2Err;
  console.log('Signed up user 2 ID:', user2Data.user?.id);

  return {
    user1: { id: user1Data.user?.id, email: deptUserEmail, password },
    user2: { id: user2Data.user?.id, email: adminEmail, password }
  };
}

main().then(res => {
  fs.writeFileSync('scratch/test_accounts.json', JSON.stringify(res, null, 2));
  console.log('\nSignup completed. Accounts saved to scratch/test_accounts.json');
}).catch(err => {
  console.error('Error in auth test:', err);
  process.exit(1);
});
