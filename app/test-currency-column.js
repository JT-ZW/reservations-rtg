// Test if currency column exists in bookings table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCurrencyColumn() {
  console.log('Checking if currency column exists in bookings table...\n');
  
  try {
    // Try to query currency column
    const { data, error } = await supabase
      .from('bookings')
      .select('id, currency, total_amount')
      .limit(5);
    
    if (error) {
      console.error('❌ Error querying currency column:', error.message);
      console.log('\n⚠️  The currency column does NOT exist in the bookings table.');
      console.log('📝 You need to run the migration in Supabase SQL Editor:');
      console.log('\nALTER TABLE bookings ADD COLUMN currency VARCHAR(3) DEFAULT \'USD\' NOT NULL;');
      console.log('ALTER TABLE bookings ADD CONSTRAINT bookings_currency_check CHECK (currency IN (\'ZWG\', \'USD\'));');
      console.log('CREATE INDEX idx_bookings_currency ON bookings(currency);');
      return false;
    }
    
    console.log('✅ Currency column exists!');
    console.log(`\n📊 Sample bookings with currency data:`);
    console.table(data);
    
    // Check currency distribution
    const { data: currencyStats } = await supabase
      .from('bookings')
      .select('currency')
      .not('currency', 'is', null);
    
    const usdCount = currencyStats?.filter(b => b.currency === 'USD').length || 0;
    const zwgCount = currencyStats?.filter(b => b.currency === 'ZWG').length || 0;
    
    console.log(`\n💰 Currency Distribution:`);
    console.log(`   USD bookings: ${usdCount}`);
    console.log(`   ZWG bookings: ${zwgCount}`);
    console.log(`   Total bookings: ${currencyStats?.length || 0}`);
    
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

testCurrencyColumn()
  .then(success => {
    if (success) {
      console.log('\n✅ Currency reporting feature is ready to use!');
      console.log('🎯 You can now filter reports by USD or ZWG in the Reports page.');
    } else {
      console.log('\n⚠️  Please run the database migration first.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
