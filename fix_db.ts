import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function fixAndClean() {
  console.log('--- 1. CLEANUP 3 ORPHAN ORDERS ---');
  // The IDs from the previous log
  const orphanIds = [
    'd0946b5a-e7ee-45cd-aece-9ebceeb00a4a',
    'ccd59682-1d57-41a9-b7b2-65f573c7b398',
    'db818815-ca8f-4ed3-ae8e-4a69bc92f9f1'
  ];
  
  // Actually, we shouldn't delete them according to the user:
  // "تُلغى بحالة cancelled مو تُحذف نهائياً"
  for (const id of orphanIds) {
    const { error } = await supabase.from('pos_orders').update({ status: 'cancelled' }).eq('id', id);
    if (error) console.error(`Error updating order ${id}:`, error);
    else console.log(`Order ${id} marked as cancelled.`);
  }

  console.log('\n--- 2. FIX VAT_RATE IN DB ---');
  // I will use REST API to just update any branch with null vat_rate to 5.00.
  const { error: vatErr } = await supabase.from('pos_branches').update({ vat_rate: 5.00 }).is('vat_rate', null);
  if (vatErr) console.error('Error updating vat_rate:', vatErr);
  else console.log('All branches with null vat_rate updated to 5.00.');
}

fixAndClean();
