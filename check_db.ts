import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function test() {
  const { data, error } = await supabase.from('dishes').select('*').limit(1);
  if (error) {
    console.error("DB Error:", error);
  } else {
    console.log("Success. First dish keys:", data[0] ? Object.keys(data[0]) : "No dishes yet");
  }
}

test();
