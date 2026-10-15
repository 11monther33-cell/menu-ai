const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let envContent = '';
try { envContent = fs.readFileSync('C:/Users/techb/.gemini/antigravity/scratch/menu-ai/.env', 'utf8'); } catch(e) {}
const env = {};
envContent.split('\n').forEach(l => {
  const parts = l.split('=');
  const k = parts[0]?.trim();
  const v = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
  if (k) env[k] = v;
});

const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
console.log('Using URL:', url, 'Key exists:', !!key);

if (!url || !key) {
  console.log('No Supabase credentials found in .env');
  process.exit(0);
}

const sb = createClient(url, key);

async function run() {
  const { data: rest, error: restErr } = await sb.from('restaurants').select('id, name_ar, name_en, owner_id').limit(10);
  console.log('Restaurants:', rest, 'RestErr:', restErr);

  const { data: staff, error: staffErr } = await sb.from('restaurant_staff').select('*');
  console.log('All Staff records:', staff, 'StaffErr:', staffErr);
}

run();
