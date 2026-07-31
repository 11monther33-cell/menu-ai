import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function clearData() {
  const { error } = await supabase
    .from('pos_branches')
    .update({ 
      whatsapp_phone_number_id: null
    })
    .not('id', 'is', null);

  if (error) {
    console.error('Error clearing data:', error);
  } else {
    console.log('Dummy whatsapp_phone_number_id cleared successfully!');
  }
}

clearData();
