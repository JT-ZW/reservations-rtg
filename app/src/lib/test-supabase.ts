/**
 * Supabase Connection Test Script
 * Run this to verify database connectivity
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  try {
    // Create client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Supabase client created successfully');
    console.log(`📍 Project URL: ${supabaseUrl}\n`);

    // Test 1: Check connection
    console.log('Test 1: Checking database connection...');
    const { data, error } = await supabase.from('_supabase_migrations').select('version').limit(1);
    
    if (error) {
      // This is expected if tables don't exist yet
      if (error.code === '42P01') {
        console.log('⚠️  No tables found (expected at Phase 1)');
        console.log('✅ Connection established successfully!\n');
      } else {
        console.error('❌ Connection error:', error.message);
        return false;
      }
    } else {
      console.log('✅ Database connection successful!');
      console.log('✅ Found migration data:', data);
    }

    // Test 2: Check Auth
    console.log('\nTest 2: Checking Auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return false;
    }
    
    console.log('✅ Auth service is accessible');
    console.log('   Current session:', authData.session ? 'Active' : 'No active session (expected)');

    // Test 3: Check Storage
    console.log('\nTest 3: Checking Storage service...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Storage error:', storageError.message);
      return false;
    }
    
    console.log('✅ Storage service is accessible');
    console.log(`   Available buckets: ${buckets?.length || 0}`);
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => console.log(`   - ${bucket.name}`));
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(50));
    console.log('✅ Database connection: Working');
    console.log('✅ Authentication service: Working');
    console.log('✅ Storage service: Working');
    console.log('\n✨ Your Supabase setup is ready for Phase 2!\n');
    
    return true;

  } catch (err) {
    console.error('\n❌ FATAL ERROR:', err);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check your .env file has correct values');
    console.error('2. Verify your Supabase project is active');
    console.error('3. Ensure you have internet connectivity');
    return false;
  }
}

// Run test if executed directly
if (require.main === module) {
  testSupabaseConnection().then(success => {
    process.exit(success ? 0 : 1);
  });
}
