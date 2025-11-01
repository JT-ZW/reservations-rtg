/**
 * Create Admin User Script
 * 
 * This script creates a super admin user in Supabase Auth
 * and adds them to the users table with admin role.
 * 
 * Usage: node create-admin.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key (has admin privileges)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('🚀 Creating admin user...\n');

  // Admin user details
  const adminUser = {
    email: 'admin@rainbowtowers.com',
    password: 'Admin@123456',  // Change this to a secure password
    full_name: 'System Administrator',
    role: 'admin',
    phone: '+263771234567'
  };

  try {
    // Step 1: Create user in Supabase Auth
    console.log('📝 Step 1: Creating user in Supabase Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminUser.email,
      password: adminUser.password,
      email_confirm: true,  // Auto-confirm email
      user_metadata: {
        full_name: adminUser.full_name
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  User already exists in Auth. Checking users table...');
        
        // Get existing user
        const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
        const user = existingAuthUser.users.find(u => u.email === adminUser.email);
        
        if (user) {
          // Check if user exists in users table
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (checkError && checkError.code === 'PGRST116') {
            // User not in users table, add them
            console.log('📝 Adding user to users table...');
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: user.id,
                email: adminUser.email,
                full_name: adminUser.full_name,
                role: adminUser.role,
                phone: adminUser.phone,
                is_active: true
              });

            if (insertError) {
              console.error('❌ Error adding user to users table:', insertError.message);
              return;
            }

            console.log('✅ Admin user added to users table successfully!');
          } else if (existingUser) {
            console.log('ℹ️  User already exists in users table');
            console.log(`   Role: ${existingUser.role}`);
            console.log(`   Status: ${existingUser.is_active ? 'Active' : 'Inactive'}`);
            
            // Update to admin if not already
            if (existingUser.role !== 'admin') {
              console.log('📝 Updating user role to admin...');
              const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'admin' })
                .eq('id', user.id);

              if (updateError) {
                console.error('❌ Error updating role:', updateError.message);
              } else {
                console.log('✅ User role updated to admin');
              }
            }
          }
        }
      } else {
        console.error('❌ Error creating auth user:', authError.message);
        return;
      }
    } else {
      console.log('✅ Auth user created successfully!');
      console.log(`   User ID: ${authUser.user.id}`);

      // Step 2: Add user to users table
      console.log('\n📝 Step 2: Adding user to users table...');
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          email: adminUser.email,
          full_name: adminUser.full_name,
          role: adminUser.role,
          phone: adminUser.phone,
          is_active: true
        });

      if (insertError) {
        console.error('❌ Error adding user to users table:', insertError.message);
        console.log('⚠️  Auth user created but not in users table. Please add manually.');
        return;
      }

      console.log('✅ User added to users table successfully!');
    }

    // Step 3: Verify user
    console.log('\n📝 Step 3: Verifying admin user...');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', adminUser.email)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying user:', verifyError.message);
      return;
    }

    console.log('✅ Admin user verified successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 ADMIN USER CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Admin User Details:');
    console.log(`   Email:     ${adminUser.email}`);
    console.log(`   Password:  ${adminUser.password}`);
    console.log(`   Name:      ${verifyUser.full_name}`);
    console.log(`   Role:      ${verifyUser.role}`);
    console.log(`   Phone:     ${verifyUser.phone}`);
    console.log(`   Status:    ${verifyUser.is_active ? 'Active' : 'Inactive'}`);
    console.log(`   User ID:   ${verifyUser.id}`);
    console.log('\n🔐 Login Instructions:');
    console.log(`   1. Go to http://localhost:3000/login`);
    console.log(`   2. Enter email: ${adminUser.email}`);
    console.log(`   3. Enter password: ${adminUser.password}`);
    console.log(`   4. You'll have full admin access to all features`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

// Run the script
createAdminUser();
