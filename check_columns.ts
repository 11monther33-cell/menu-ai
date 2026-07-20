import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const sbUrl = process.env.VITE_SUPABASE_URL || '';
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const sb = createClient(sbUrl, sbKey);

async function checkColumns() {
  const { data, error } = await sb.from('restaurants').select('*').limit(1);
  if (error) {
    console.error('Error fetching restaurants:', error);
  } else {
    console.log('Columns available in restaurants:', data && data.length > 0 ? Object.keys(data[0]) : 'No rows to infer columns, or success');
  }
}

checkColumns();
