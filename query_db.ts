import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkOrphans() {
  const { data: orders, error } = await supabase
    .from('pos_orders')
    .select('id, status, created_at, pos_order_items(id)')
    .eq('status', 'open');

  if (error) {
    console.error('Error fetching orders:', error);
    return;
  }

  console.log('Open orders found:', orders.length);
  for (const o of orders) {
    console.log(`- Order ${o.id}: ${o.pos_order_items?.length || 0} items`);
  }
}

checkOrphans();
