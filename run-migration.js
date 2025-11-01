require('dotenv').config({ path: './app/.env.local' });
const https = require('https');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const sql = fs.readFileSync('./add_line_items_column.sql', 'utf8');

console.log('🔄 Running database migration...');
console.log('📄 SQL:', sql.substring(0, 100) + '...');

const url = new URL(`${supabaseUrl}/rest/v1/rpc/exec_sql`);

const postData = JSON.stringify({ query: sql });

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Length': postData.length,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Migration completed successfully!');
      console.log('Response:', data);
    } else {
      console.log('⚠️ Migration may have run. Please check Supabase dashboard.');
      console.log('Status:', res.statusCode);
      console.log('Response:', data);
      console.log('\n📝 You can also run the SQL directly in Supabase Dashboard → SQL Editor');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n📝 Please run the SQL manually in Supabase Dashboard → SQL Editor:');
  console.log(sql);
});

req.write(postData);
req.end();
