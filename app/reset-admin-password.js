// Reset admin password script
// Run with: node reset-admin-password.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkurrsgbzzsxfwkrnbbu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprdXJyc2dienpzeGZ3a3JuYmJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTc4NDczMywiZXhwIjoyMDc3MzYwNzMzfQ.TGS1gRV58mEcMP4MW2YetNII0_ln4MxjGY0A3E7hwKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdminPassword() {
  try {
    const newPassword = 'Admin123!'; // Change this to your desired password
    const email = 'admin@rainbowtowers.com';

    console.log(`Resetting password for ${email}...`);

    // Update password using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      '57abc7bc-a126-445f-8fd6-24410c3216e5',
      { password: newPassword }
    );

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\n✅ Password reset successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log('\n⚠️  Remember to change this password after logging in!');

  } catch (error) {
    console.error('Error:', error);
  }
}

resetAdminPassword();
