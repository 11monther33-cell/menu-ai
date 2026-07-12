import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function investigate() {
  console.log('--- 1 & 2. ORPHAN ORDERS ---');
  const { data: orphans, error: err1 } = await supabase
    .from('pos_orders')
    .select('id, status, table_number, created_at, pos_order_items(id)')
    .eq('status', 'open');
  
  if (err1) console.error(err1);
  else {
    console.log(`Found ${orphans.length} open orders:`);
    for (const o of orphans) {
      console.log(`Order: ${o.id} | Table: ${o.table_number} | Items: ${o.pos_order_items?.length}`);
    }
  }

  console.log('\n--- 3. CLEANUP LEAKED TEST INVOICES ---');
  // Find invoices, payments, audit logs related to the test we ran.
  // The test order was created for 'TEST_TBL_1' and deleted, but let's check invoices where order is null or has our test items.
  // Since we deleted the order, and invoice has a foreign key to order_id, did it cascade? 
  // Let's check pos_invoices
  const { data: invoices, error: err2 } = await supabase
    .from('pos_invoices')
    .select('id, invoice_number, order_id')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (err2) console.error(err2);
  else console.log('Recent Invoices:', invoices);

  // Let's check pos_payments
  const { data: payments, error: err3 } = await supabase
    .from('pos_payments')
    .select('id, order_id, amount')
    .order('paid_at', { ascending: false })
    .limit(5);
  
  if (err3) console.error(err3);
  else console.log('Recent Payments:', payments);

  console.log('\n--- 4. RPC pos_create_order CHECK ---');
  // We can query the function definition from pg_proc
  const { data: rpcDef, error: err4 } = await supabase.rpc('pos_create_order', {}).catch(e => e);
  console.log('We cannot directly query pg_proc via Rest API, we will have to check the local sql files.');

  console.log('\n--- 5. VAT RATE COLUMN CHECK ---');
  const { data: branch, error: err5 } = await supabase
    .from('pos_branches')
    .select('id, name, vat_rate')
    .limit(1)
    .single();
  
  if (err5) {
    console.error('Error fetching vat_rate:', err5.message);
  } else {
    console.log('Branch VAT Rate:', branch.vat_rate);
  }
}

investigate();
