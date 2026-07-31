import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkSchema() {
  const { data, error } = await supabase.from('dishes').select('*').limit(1);
  if (error) {
    console.error("Select failed:", error);
  } else {
    if (data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
    } else {
      console.log("No data, but query succeeded");
    }
  }
}

checkSchema();
