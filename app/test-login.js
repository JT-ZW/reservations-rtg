/**
 * Test Login - Check if Supabase auth and database are working
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Testing Supabase Connection and Login...\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Anon Key:', supabaseKey ? '✓ Present' : '✗ Missing');

async function testLogin() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n📝 Step 1: Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      console.log('\n💡 This likely means the database tables are not set up yet.');
      console.log('   Please run the SQL scripts in Supabase SQL Editor.');
      return;
    }

    console.log('✅ Database connection successful!');

    console.log('\n📝 Step 2: Attempting to sign in...');
    console.log('   Email: admin@rainbowtowers.com');
    console.log('   Password: Admin@123456');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@rainbowtowers.com',
      password: 'Admin@123456',
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      
      if (error.message.includes('Invalid login credentials')) {
        console.log('\n💡 The user exists but the password is incorrect, OR');
        console.log('   The user does not exist in Supabase Auth.');
        console.log('\n   Try running: node create-admin.js');
      }
      return;
    }

    if (!data.user) {
      console.error('❌ No user data returned');
      return;
    }

    console.log('✅ Authentication successful!');
    console.log('   User ID:', data.user.id);
    console.log('   Email:', data.user.email);

    console.log('\n📝 Step 3: Checking user profile in database...');
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ User profile not found:', profileError.message);
      console.log('\n💡 The user authenticated but has no profile in the users table.');
      console.log('   Try running: node create-admin.js');
      return;
    }

    console.log('✅ User profile found!');
    console.log('   Name:', userProfile.full_name);
    console.log('   Role:', userProfile.role);
    console.log('   Active:', userProfile.is_active);

    if (!userProfile.is_active) {
      console.warn('⚠️  User account is inactive!');
      return;
    }

    console.log('\n📝 Step 4: Checking auth_activity_log table...');
    const { error: logError } = await supabase
      .from('auth_activity_log')
      .select('count')
      .limit(1);

    if (logError) {
      console.warn('⚠️  auth_activity_log table not accessible:', logError.message);
      console.log('   Login will work but activity logging may fail.');
    } else {
      console.log('✅ auth_activity_log table is accessible!');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Login should work in the browser now!');
    console.log('   Go to: http://localhost:3000/login');
    console.log('   Email: admin@rainbowtowers.com');
    console.log('   Password: Admin@123456');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testLogin();
