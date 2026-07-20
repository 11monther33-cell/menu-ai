require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkModels() {
  const { data, error } = await supabase
    .from('product_3d_models')
    .select('*');

  if (error) {
    console.error('Error fetching product_3d_models:', error);
    return;
  }

  console.log(`Found ${data.length} models in product_3d_models table.`);
  data.forEach((m, idx) => {
    console.log(`[${idx+1}] Product ID: ${m.product_id}, Status: ${m.status}, File: ${m.usdz_url}`);
  });
}

checkModels();
