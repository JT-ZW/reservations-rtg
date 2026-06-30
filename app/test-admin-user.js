// Test script to check admin user
// Run with: node test-admin-user.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkurrsgbzzsxfwkrnbbu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprdXJyc2dienpzeGZ3a3JuYmJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc4NDczMywiZXhwIjoyMDc3MzYwNzMzfQ.TGS1gRV58mEcMP4MW2YetNII0_ln4MxjGY0A3E7hwKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUser() {
  try {
    console.log('Checking admin user in database...\n');

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@rainbowtowers.com');

    if (usersError) {
      console.error('Error querying users table:', usersError);
      return;
    }

    console.log('Users table results:');
    console.log(JSON.stringify(users, null, 2));
    console.log('\n');

    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error listing auth users:', authError);
      return;
    }

    const adminAuthUser = authUsers.users.find(u => u.email === 'admin@rainbowtowers.com');
    
    console.log('Auth user results:');
    if (adminAuthUser) {
      console.log('Found in auth.users:');
      console.log('- ID:', adminAuthUser.id);
      console.log('- Email:', adminAuthUser.email);
      console.log('- Email confirmed:', adminAuthUser.email_confirmed_at ? 'Yes' : 'No');
      console.log('- Created:', adminAuthUser.created_at);
      console.log('- Last sign in:', adminAuthUser.last_sign_in_at || 'Never');
    } else {
      console.log('NOT found in auth.users');
    }

    // Check if IDs match
    if (users && users.length > 0 && adminAuthUser) {
      if (users[0].id === adminAuthUser.id) {
        console.log('\n✅ User IDs match - database is in sync');
      } else {
        console.log('\n❌ User IDs DO NOT match - database is out of sync!');
        console.log('   Users table ID:', users[0].id);
        console.log('   Auth user ID:', adminAuthUser.id);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminUser();
