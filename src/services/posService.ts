import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface POSBranch {
  id: string;
  restaurant_id: string;
  name: string;
  currency_code: string;
  vat_rate: number;
  vat_registration_number?: string;
  address?: string;
  is_default: boolean;
}

export interface POSMenuCategory {
  id: string;
  branch_id: string;
  name: string;
  display_order: number;
  color: string;
}

export interface POSProduct {
  id: string;
  branch_id: string;
  category_id?: string;
  name: string;
  sku?: string;
  selling_price: number;
  cost_price?: number;
  is_active: boolean;
  created_at: string;
  category_name?: string;
  recipe?: POSRecipeItem[];
}

export interface POSRecipeItem {
  id?: string;
  product_id?: string;
  inventory_item_id: string;
  quantity_used: number;
  item_name?: string;
  unit?: string;
}

export interface POSInventoryItem {
  id: string;
  branch_id: string;
  name: string;
  unit: string;
  current_quantity: number;
  reorder_threshold: number;
  cost_per_unit: number;
  is_low_stock?: boolean;
  created_at: string;
  updated_at: string;
}

export interface POSOrder {
  id: string;
  branch_id: string;
  table_number?: string;
  status: 'open' | 'paid' | 'cancelled';
  subtotal: number;
  vat_amount: number;
  total: number;
  currency_code: string;
  created_by?: string;
  created_at: string;
  closed_at?: string;
  items?: POSOrderItem[];
}

export interface POSOrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  cost_at_sale_time?: number;
  product_name?: string;
}

export interface POSPayment {
  id: string;
  order_id: string;
  amount: number;
  method: 'cash' | 'card' | 'other';
  paid_at: string;
}

export interface POSInvoice {
  id: string;
  order_id: string;
  invoice_number: string;
  branch_id: string;
  issue_date: string;
  buyer_name?: string;
  buyer_vatin?: string;
  seller_vatin?: string;
  seller_name?: string;
  status: 'issued' | 'credited';
  format_ready_for_fawtara: boolean;
  line_items?: POSInvoiceLineItem[];
  order?: POSOrder;
}

export interface POSInvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  net_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
}

export interface POSExpenseCategory {
  id: string;
  branch_id: string;
  name: string;
}

export interface POSExpense {
  id: string;
  branch_id: string;
  expense_category_id?: string;
  amount: number;
  currency_code: string;
  description?: string;
  expense_date: string;
  is_system_generated: boolean;
  created_by?: string;
  created_at: string;
  category_name?: string;
}

export interface POSInventoryTransaction {
  id: string;
  inventory_item_id: string;
  change_amount: number;
  reason: string;
  reference_order_id?: string;
  created_by?: string;
  created_at: string;
}

export interface SalesSummaryRow {
  product_name: string;
  total_quantity_sold: number;
  total_revenue: number;
  total_profit: number;
}

export interface ProfitLossData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

// ═══════════════════════════════════════════
// Branch Management
// ═══════════════════════════════════════════

export async function getOrCreateBranch(restaurantId: string): Promise<POSBranch | null> {
  // Try to get existing default branch
  const { data: existing } = await supabase
    .from('pos_branches')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_default', true)
    .single();

  if (existing) return existing as POSBranch;

  // Call RPC to create default branch
  const { data: branchId, error } = await supabase.rpc('pos_ensure_default_branch', {
    p_restaurant_id: restaurantId
  });

  if (error) {
    console.error('Failed to create default branch:', error);
    return null;
  }

  // Fetch the newly created branch
  const { data: newBranch } = await supabase
    .from('pos_branches')
    .select('*')
    .eq('id', branchId)
    .single();

  return newBranch as POSBranch;
}

export async function updateBranch(branchId: string, updates: Partial<POSBranch>) {
  const { data, error } = await supabase
    .from('pos_branches')
    .update(updates)
    .eq('id', branchId)
    .select()
    .single();

  if (error) throw error;
  return data as POSBranch;
}

// ═══════════════════════════════════════════
// Menu Categories
// ═══════════════════════════════════════════

export async function fetchCategories(branchId: string): Promise<POSMenuCategory[]> {
  const { data, error } = await supabase
    .from('pos_menu_categories')
    .select('*')
    .eq('branch_id', branchId)
    .order('display_order');

  if (error) throw error;
  return (data || []) as POSMenuCategory[];
}

export async function createCategory(branchId: string, name: string, displayOrder: number = 0, color: string = '#CBA358') {
  const { data, error } = await supabase
    .from('pos_menu_categories')
    .insert({ branch_id: branchId, name, display_order: displayOrder, color })
    .select()
    .single();

  if (error) throw error;
  return data as POSMenuCategory;
}

export async function updateCategory(categoryId: string, updates: Partial<POSMenuCategory>) {
  const { data, error } = await supabase
    .from('pos_menu_categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) throw error;
  return data as POSMenuCategory;
}

export async function deleteCategory(categoryId: string) {
  const { error } = await supabase.from('pos_menu_categories').delete().eq('id', categoryId);
  if (error) throw error;
}

// ═══════════════════════════════════════════
// Products
// ═══════════════════════════════════════════

export async function fetchProducts(branchId: string): Promise<POSProduct[]> {
  const { data, error } = await supabase
    .from('pos_products')
    .select(`*, pos_menu_categories(name)`)
    .eq('branch_id', branchId)
    .order('name');

  if (error) throw error;

  return (data || []).map((p: any) => ({
    ...p,
    category_name: p.pos_menu_categories?.name || null
  })) as POSProduct[];
}

export async function fetchProductWithRecipe(productId: string): Promise<POSProduct | null> {
  const { data: product, error } = await supabase
    .from('pos_products')
    .select(`*, pos_menu_categories(name)`)
    .eq('id', productId)
    .single();

  if (error) throw error;

  const { data: recipe } = await supabase
    .from('pos_product_recipe')
    .select(`*, pos_inventory_items(name, unit)`)
    .eq('product_id', productId);

  return {
    ...product,
    category_name: product.pos_menu_categories?.name || null,
    recipe: (recipe || []).map((r: any) => ({
      ...r,
      item_name: r.pos_inventory_items?.name,
      unit: r.pos_inventory_items?.unit
    }))
  } as POSProduct;
}

export async function createProduct(
  branchId: string,
  product: { name: string; sku?: string; selling_price: number; category_id?: string },
  recipe?: { inventory_item_id: string; quantity_used: number }[]
) {
  // Insert product
  const { data: newProduct, error } = await supabase
    .from('pos_products')
    .insert({ branch_id: branchId, ...product })
    .select()
    .single();

  if (error) throw error;

  // Insert recipe items
  if (recipe && recipe.length > 0) {
    const recipeRows = recipe.map(r => ({
      product_id: newProduct.id,
      inventory_item_id: r.inventory_item_id,
      quantity_used: r.quantity_used
    }));

    const { error: recipeError } = await supabase
      .from('pos_product_recipe')
      .insert(recipeRows);

    if (recipeError) throw recipeError;

    // Calculate cost_price from recipe
    const { data: costData } = await supabase
      .from('pos_product_recipe')
      .select(`quantity_used, pos_inventory_items(cost_per_unit)`)
      .eq('product_id', newProduct.id);

    if (costData) {
      const costPrice = costData.reduce((sum: number, r: any) => {
        return sum + (r.quantity_used * (r.pos_inventory_items?.cost_per_unit || 0));
      }, 0);

      await supabase
        .from('pos_products')
        .update({ cost_price: costPrice })
        .eq('id', newProduct.id);
    }
  }

  return newProduct as POSProduct;
}

export async function updateProduct(
  productId: string,
  product: Partial<POSProduct>,
  recipe?: { inventory_item_id: string; quantity_used: number }[]
) {
  const { cost_price, category_name, recipe: _, ...updateFields } = product as any;

  const { data, error } = await supabase
    .from('pos_products')
    .update(updateFields)
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;

  if (recipe !== undefined) {
    // Delete old recipe
    await supabase.from('pos_product_recipe').delete().eq('product_id', productId);

    // Insert new recipe
    if (recipe.length > 0) {
      const recipeRows = recipe.map(r => ({
        product_id: productId,
        inventory_item_id: r.inventory_item_id,
        quantity_used: r.quantity_used
      }));

      await supabase.from('pos_product_recipe').insert(recipeRows);

      // Recalculate cost_price
      const { data: costData } = await supabase
        .from('pos_product_recipe')
        .select(`quantity_used, pos_inventory_items(cost_per_unit)`)
        .eq('product_id', productId);

      if (costData) {
        const costPrice = costData.reduce((sum: number, r: any) => {
          return sum + (r.quantity_used * (r.pos_inventory_items?.cost_per_unit || 0));
        }, 0);

        await supabase.from('pos_products').update({ cost_price: costPrice }).eq('id', productId);
      }
    } else {
      await supabase.from('pos_products').update({ cost_price: null }).eq('id', productId);
    }
  }

  return data as POSProduct;
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const { error } = await supabase
    .from('pos_products')
    .update({ is_active: isActive })
    .eq('id', productId);

  if (error) throw error;
}

// ═══════════════════════════════════════════
// Inventory
// ═══════════════════════════════════════════

export async function fetchInventory(branchId: string): Promise<POSInventoryItem[]> {
  const { data, error } = await supabase
    .from('pos_inventory_items')
    .select('*')
    .eq('branch_id', branchId)
    .order('name');

  if (error) throw error;

  return (data || []).map((item: any) => ({
    ...item,
    is_low_stock: item.current_quantity <= item.reorder_threshold
  })) as POSInventoryItem[];
}

export async function createInventoryItem(branchId: string, item: {
  name: string; unit: string; current_quantity: number; reorder_threshold: number; cost_per_unit: number;
}) {
  const { data, error } = await supabase
    .from('pos_inventory_items')
    .insert({ branch_id: branchId, ...item })
    .select()
    .single();

  if (error) throw error;
  return data as POSInventoryItem;
}

export async function updateInventoryItem(itemId: string, updates: Partial<POSInventoryItem>) {
  const { data, error } = await supabase
    .from('pos_inventory_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data as POSInventoryItem;
}

export async function restockInventory(itemId: string, quantity: number, totalCost: number, branchId: string) {
  const { data, error } = await supabase.rpc('pos_restock_inventory', {
    p_item_id: itemId,
    p_quantity: quantity,
    p_total_cost: totalCost,
    p_branch_id: branchId
  });

  if (error) throw error;
  return data;
}

export async function fetchInventoryTransactions(itemId: string): Promise<POSInventoryTransaction[]> {
  const { data, error } = await supabase
    .from('pos_inventory_transactions')
    .select('*')
    .eq('inventory_item_id', itemId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as POSInventoryTransaction[];
}

export async function fetchLowStock(branchId: string): Promise<POSInventoryItem[]> {
  const { data, error } = await supabase
    .from('pos_inventory_items')
    .select('*')
    .eq('branch_id', branchId)
    .filter('current_quantity', 'lte', 'reorder_threshold' as any);

  // Fallback: filter client-side if the filter doesn't work as expected
  if (error) {
    const all = await fetchInventory(branchId);
    return all.filter(i => i.current_quantity <= i.reorder_threshold);
  }

  return (data || []).map((item: any) => ({
    ...item,
    is_low_stock: true
  })) as POSInventoryItem[];
}

// ═══════════════════════════════════════════
// Orders (POS)
// ═══════════════════════════════════════════

// Fix 4: Check for existing open order on this table before creating a new one
export async function getOpenOrderForTable(branchId: string, tableNumber: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('pos_get_open_order_for_table', {
    p_branch_id: branchId,
    p_table_number: tableNumber
  });

  if (error || !data) return null;
  return data as string;
}

export async function createOrder(branchId: string, tableNumber?: string, currencyCode: string = 'OMR') {
  const { data, error } = await supabase
    .from('pos_orders')
    .insert({
      branch_id: branchId,
      table_number: tableNumber,
      currency_code: currencyCode,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data as POSOrder;
}

export async function addOrderItem(orderId: string, productId: string, quantity: number) {
  // Get product details
  const { data: product, error: prodError } = await supabase
    .from('pos_products')
    .select('selling_price, cost_price')
    .eq('id', productId)
    .single();

  if (prodError || !product) throw new Error('Product not found');

  const lineTotal = product.selling_price * quantity;

  const { error } = await supabase
    .from('pos_order_items')
    .insert({
      order_id: orderId,
      product_id: productId,
      quantity,
      unit_price: product.selling_price,
      line_total: lineTotal,
      cost_at_sale_time: product.cost_price
    });

  if (error) throw error;

  // Recalculate subtotal from all order items
  const { data: items } = await supabase
    .from('pos_order_items')
    .select('line_total')
    .eq('order_id', orderId);

  const newSubtotal = (items || []).reduce((sum: number, i: any) => sum + Number(i.line_total), 0);

  await supabase
    .from('pos_orders')
    .update({ subtotal: newSubtotal })
    .eq('id', orderId);
}

export async function removeOrderItem(itemId: string, orderId: string) {
  await supabase.from('pos_order_items').delete().eq('id', itemId);

  // Recalculate subtotal
  const { data: items } = await supabase
    .from('pos_order_items')
    .select('line_total')
    .eq('order_id', orderId);

  const newSubtotal = (items || []).reduce((sum: number, i: any) => sum + Number(i.line_total), 0);

  await supabase
    .from('pos_orders')
    .update({ subtotal: newSubtotal })
    .eq('id', orderId);
}

export async function clearOrderItems(orderId: string) {
  const { error } = await supabase.from('pos_order_items').delete().eq('order_id', orderId);
  if (error) throw error;
}

// Addition A: closeOrder now accepts an idempotency key to prevent double-payments
export async function closeOrder(
  orderId: string,
  paymentMethod: string,
  amount: number,
  vatRate: number = 5.0,
  idempotencyKey?: string
) {
  const { data, error } = await supabase.rpc('pos_close_order', {
    p_order_id: orderId,
    p_payment_method: paymentMethod,
    p_amount: amount,
    p_vat_rate: vatRate,
    p_idempotency_key: idempotencyKey || null
  });

  if (error) throw error;
  return data as {
    orderId: string;
    invoiceId: string;
    invoiceNumber: string;
    subtotal: number;
    vatAmount: number;
    total: number;
  };
}

export async function cancelOrder(orderId: string) {
  const { data, error } = await supabase.rpc('pos_cancel_order', {
    p_order_id: orderId
  });

  if (error) throw error;
  return data;
}

export async function fetchOrders(branchId: string, status?: string): Promise<POSOrder[]> {
  let query = supabase
    .from('pos_orders')
    .select('*')
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return (data || []) as POSOrder[];
}

export async function fetchOrderWithItems(orderId: string): Promise<POSOrder | null> {
  const { data: order, error } = await supabase
    .from('pos_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) return null;

  const { data: items } = await supabase
    .from('pos_order_items')
    .select(`*, pos_products(name)`)
    .eq('order_id', orderId);

  return {
    ...order,
    items: (items || []).map((i: any) => ({
      ...i,
      product_name: i.pos_products?.name
    }))
  } as POSOrder;
}

// ═══════════════════════════════════════════
// Expenses
// ═══════════════════════════════════════════

export async function fetchExpenseCategories(branchId: string): Promise<POSExpenseCategory[]> {
  const { data, error } = await supabase
    .from('pos_expense_categories')
    .select('*')
    .eq('branch_id', branchId)
    .order('name');

  if (error) throw error;
  return (data || []) as POSExpenseCategory[];
}

export async function createExpenseCategory(branchId: string, name: string) {
  const { data, error } = await supabase
    .from('pos_expense_categories')
    .insert({ branch_id: branchId, name })
    .select()
    .single();

  if (error) throw error;
  return data as POSExpenseCategory;
}

export async function fetchExpenses(branchId: string, from?: string, to?: string): Promise<POSExpense[]> {
  let query = supabase
    .from('pos_expenses')
    .select(`*, pos_expense_categories(name)`)
    .eq('branch_id', branchId)
    .order('expense_date', { ascending: false });

  if (from) query = query.gte('expense_date', from);
  if (to) query = query.lte('expense_date', to);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((e: any) => ({
    ...e,
    category_name: e.pos_expense_categories?.name
  })) as POSExpense[];
}

export async function createExpense(branchId: string, expense: {
  expense_category_id?: string;
  amount: number;
  description?: string;
  expense_date: string;
  currency_code?: string;
}) {
  const { data, error } = await supabase
    .from('pos_expenses')
    .insert({
      branch_id: branchId,
      ...expense,
      currency_code: expense.currency_code || 'OMR',
      is_system_generated: false,
      created_by: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (error) throw error;
  return data as POSExpense;
}

// ═══════════════════════════════════════════
// Invoices
// ═══════════════════════════════════════════

export async function fetchInvoices(branchId: string, search?: string): Promise<POSInvoice[]> {
  let query = supabase
    .from('pos_invoices')
    .select(`*, pos_orders(subtotal, vat_amount, total, currency_code, table_number)`)
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('invoice_number', `%${search}%`);
  }

  const { data, error } = await query.limit(200);
  if (error) throw error;

  return (data || []).map((inv: any) => ({
    ...inv,
    order: inv.pos_orders
  })) as POSInvoice[];
}

export async function fetchInvoiceWithDetails(invoiceId: string): Promise<POSInvoice | null> {
  const { data: invoice, error } = await supabase
    .from('pos_invoices')
    .select(`*, pos_orders(subtotal, vat_amount, total, currency_code, table_number)`)
    .eq('id', invoiceId)
    .single();

  if (error) return null;

  const { data: lineItems } = await supabase
    .from('pos_invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  return {
    ...invoice,
    order: invoice.pos_orders,
    line_items: lineItems || []
  } as POSInvoice;
}

// ═══════════════════════════════════════════
// Reports
// ═══════════════════════════════════════════

export async function fetchSalesSummary(branchId: string, from: string, to: string): Promise<SalesSummaryRow[]> {
  const { data, error } = await supabase
    .from('pos_order_items')
    .select(`
      quantity,
      line_total,
      cost_at_sale_time,
      pos_products(name),
      pos_orders!inner(branch_id, status, closed_at)
    `)
    .eq('pos_orders.branch_id', branchId)
    .eq('pos_orders.status', 'paid')
    .gte('pos_orders.closed_at', from)
    .lte('pos_orders.closed_at', to);

  if (error) throw error;

  // Aggregate client-side
  const productMap = new Map<string, SalesSummaryRow>();

  for (const item of (data || []) as any[]) {
    const name = item.pos_products?.name || 'Unknown';
    const existing = productMap.get(name) || { product_name: name, total_quantity_sold: 0, total_revenue: 0, total_profit: 0 };

    existing.total_quantity_sold += item.quantity;
    existing.total_revenue += Number(item.line_total);
    existing.total_profit += Number(item.line_total) - ((item.cost_at_sale_time || 0) * item.quantity);

    productMap.set(name, existing);
  }

  return Array.from(productMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);
}

export async function fetchProfitLoss(branchId: string, from: string, to: string): Promise<ProfitLossData> {
  // Revenue from paid orders
  const { data: revenueData } = await supabase
    .from('pos_orders')
    .select('total')
    .eq('branch_id', branchId)
    .eq('status', 'paid')
    .gte('closed_at', from)
    .lte('closed_at', to);

  const totalRevenue = (revenueData || []).reduce((sum: number, o: any) => sum + Number(o.total), 0);

  // Total expenses
  const { data: expenseData } = await supabase
    .from('pos_expenses')
    .select('amount')
    .eq('branch_id', branchId)
    .gte('expense_date', from)
    .lte('expense_date', to);

  const totalExpenses = (expenseData || []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses
  };
}
