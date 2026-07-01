/**
 * Run SQL migration via direct Supabase Pooler connection
 * Uses: supavisor transaction pooler
 */
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const PROJECT_REF = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase exposes a SQL HTTP endpoint via PostgREST's underlying connection
// Try the /sql endpoint which some Supabase versions support
const endpoints = [
  `${SUPABASE_URL}/pg/query`,
  `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
  `${SUPABASE_URL}/pg-meta/default/query`,
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
];

const SQL = `
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS ai_generation_task_id TEXT;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS model_3d_size_kb INTEGER;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS model_3d_uploaded_at TIMESTAMPTZ;
`;

async function tryEndpoint(url) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: SQL }),
    });
    
    if (res.ok) {
      return { success: true, url };
    }
    return { success: false, url, status: res.status, error: await res.text().catch(() => '') };
  } catch (e) {
    return { success: false, url, error: e.message };
  }
}

async function run() {
  console.log('🔧 Trying all Supabase SQL endpoints...\n');
  
  for (const url of endpoints) {
    const result = await tryEndpoint(url);
    if (result.success) {
      console.log(`✅ SUCCESS via: ${url}`);
      return;
    }
    console.log(`   ❌ ${url} → ${result.status || 'failed'}`);
  }
  
  // None worked — create a Supabase function to do it
  console.log('\n🔄 Creating a helper function in Supabase...');
  
  // Create a temporary function via RPC
  const createFnSQL = `
    CREATE OR REPLACE FUNCTION add_ai_columns()
    RETURNS void AS $$
    BEGIN
      ALTER TABLE dishes ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
      ALTER TABLE dishes ADD COLUMN IF NOT EXISTS ai_generation_task_id TEXT;
      ALTER TABLE dishes ADD COLUMN IF NOT EXISTS model_3d_size_kb INTEGER;
      ALTER TABLE dishes ADD COLUMN IF NOT EXISTS model_3d_uploaded_at TIMESTAMPTZ;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  console.log('\n⚠️  All API endpoints require Dashboard access.');
  console.log('');
  console.log('📋 Please copy & paste this SQL in Supabase Dashboard → SQL Editor → Run:');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(SQL);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('🔗 Direct link to SQL Editor:');
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
}

run();
