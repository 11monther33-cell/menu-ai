import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const sbUrl = process.env.VITE_SUPABASE_URL || '';
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = createClient(sbUrl, sbKey);

async function checkAdminInvites() {
  console.log('Checking admin_invites table...');
  const { data, error } = await sb.from('admin_invites').select('*').limit(1);
  if (error) {
    console.error('Error querying admin_invites:', error);
  } else {
    console.log('Success! Table exists. Data:', data);
  }
}

checkAdminInvites();
