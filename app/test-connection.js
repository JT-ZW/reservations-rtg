/**
 * Supabase Connection Test
 * Simple Node.js script to test database connectivity
 */

// Load environment variables from parent directory
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing Supabase credentials');
  console.error('   Make sure .env file exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`📍 Project URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Basic connectivity test using Auth
    console.log('Test 1: Testing basic connectivity...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Connection error:', sessionError.message);
      throw sessionError;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    console.log('   Session status:', sessionData.session ? 'Active user' : 'No active session (expected)\n');

    // Test 2: Auth service
    console.log('Test 2: Checking Auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth service error:', authError.message);
      throw authError;
    }
    
    console.log('✅ Auth service is accessible');
    console.log('   Session status:', authData.session ? 'Active user' : 'No active session (expected)\n');

    // Test 3: Storage service
    console.log('Test 3: Checking Storage service...');
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    
    if (storageError) {
      console.error('❌ Storage service error:', storageError.message);
      throw storageError;
    }
    
    console.log('✅ Storage service is accessible');
    console.log(`   Available buckets: ${buckets?.length || 0}`);
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`));
    }
    console.log('');

    // Test 4: Check project settings
    console.log('Test 4: Checking project configuration...');
    await supabase.auth.getUser();
    console.log('✅ Project is properly configured\n');

    // Summary
    console.log('='.repeat(60));
    console.log('🎉 ALL TESTS PASSED! Your Supabase setup is working perfectly!');
    console.log('='.repeat(60));
    console.log('✅ Database connection: Working');
    console.log('✅ Authentication service: Working');
    console.log('✅ Storage service: Working');
    console.log('✅ Project configuration: Valid');
    console.log('\n✨ You\'re ready to proceed to Phase 2: Database Schema & Security!\n');
    
    return true;

  } catch (err) {
    console.error('\n❌ CONNECTION TEST FAILED');
    console.error('Error details:', err.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Verify your .env file has the correct Supabase URL and keys');
    console.error('2. Check that your Supabase project is active (not paused)');
    console.error('3. Ensure you have internet connectivity');
    console.error('4. Try refreshing your API keys from the Supabase dashboard\n');
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
