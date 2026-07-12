import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function runTest() {
  // Get default branch or mock
  let { data: branch } = await supabase.from('pos_branches').select('id, currency_code').limit(1).single();
  if (!branch) {
     // Create one
     const { data: b } = await supabase.from('pos_branches').insert({ name: 'Test', is_default: true }).select('id, currency_code').single();
     branch = b;
  }

  // Get two products
  let { data: products } = await supabase.from('pos_products').select('id, selling_price').limit(2);
  if (!products || products.length < 2) {
      await supabase.from('pos_products').insert([{ name: 'Test 1', selling_price: 10, branch_id: branch.id }, { name: 'Test 2', selling_price: 20, branch_id: branch.id }]);
      const { data: p } = await supabase.from('pos_products').select('id, selling_price').limit(2);
      products = p;
  }

  console.log('Simulating handleProcessPayment flow...');
  let currentOrderId = null; // New order flow
  let orderIdToPay = currentOrderId;

  if (!orderIdToPay) {
    const { data: order } = await supabase.rpc('pos_create_order', {
      p_branch_id: branch.id,
      p_table_number: 'TEST_TBL_1',
      p_currency_code: branch.currency_code || 'OMR'
    });
    orderIdToPay = order;
  }

  // 2. Add all items to order
  let subtotal = 0;
  for (const item of products) {
    const qty = 1;
    const lineTotal = item.selling_price * qty;
    subtotal += lineTotal;

    await supabase.from('pos_order_items').insert({
      order_id: orderIdToPay,
      product_id: item.id,
      quantity: qty,
      unit_price: item.selling_price,
      line_total: lineTotal
    });
  }

  // 3. Process payment
  const vatRate = 5.00;
  const amountTendered = subtotal + (subtotal * (vatRate / 100));
  const idempotencyKey = crypto.randomUUID();

  const { data: invoice } = await supabase.rpc('pos_close_order', {
    p_order_id: orderIdToPay,
    p_payment_method: 'cash',
    p_amount: amountTendered,
    p_vat_rate: vatRate,
    p_idempotency_key: idempotencyKey
  });

  // 4. Verify orders and items for this table
  const { data: finalOrder } = await supabase.from('pos_orders')
    .select('id, status, pos_order_items(id)')
    .eq('id', orderIdToPay)
    .single();

  console.log('Orders created for this test checkout:', finalOrder ? 1 : 0);
  console.log('Items attached to order:', finalOrder?.pos_order_items?.length);
  
  // Clean up
  await supabase.from('pos_orders').delete().eq('id', orderIdToPay);
}

runTest();
