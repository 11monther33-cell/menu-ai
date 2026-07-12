-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  POS & Accounting Module — HARDENED Database Migration             ║
-- ║  Run this in Supabase SQL Editor                                   ║
-- ║  All tables prefixed with pos_ to avoid conflicts                  ║
-- ║                                                                    ║
-- ║  Includes:                                                         ║
-- ║    • 14 core tables + pos_invoice_counters + pos_audit_log         ║
-- ║    • RLS policies (owner-scoped via get_my_restaurant_ids())       ║
-- ║    • Performance indexes                                           ║
-- ║    • pos_assert_branch_access() — RPC ownership guard (Fix 1)     ║
-- ║    • pos_next_invoice_number() — atomic sequential numbers (Fix 2)║
-- ║    • pos_recalculate_affected_product_costs trigger (Fix 3)       ║
-- ║    • Unique open-order-per-table constraint (Fix 4)               ║
-- ║    • Idempotency key on payments (Addition A)                     ║
-- ║    • Financial audit log (Addition B)                             ║
-- ║    • Invoice immutability trigger (Addition C)                    ║
-- ╚══════════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════════════════
-- 1. TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- 1.1 Branches
CREATE TABLE IF NOT EXISTS pos_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'OMR',
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  vat_registration_number VARCHAR(50),
  address TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 Menu Categories (POS-specific)
CREATE TABLE IF NOT EXISTS pos_menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  color VARCHAR(7) DEFAULT '#CBA358'
);

-- 1.3 Products
CREATE TABLE IF NOT EXISTS pos_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  category_id UUID REFERENCES pos_menu_categories(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(50),
  selling_price DECIMAL(10,3) NOT NULL,
  cost_price DECIMAL(10,3),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 Inventory Items
CREATE TABLE IF NOT EXISTS pos_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  current_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
  reorder_threshold DECIMAL(12,3) NOT NULL DEFAULT 0,
  cost_per_unit DECIMAL(10,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 Product Recipe (links products to inventory items)
CREATE TABLE IF NOT EXISTS pos_product_recipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES pos_products(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES pos_inventory_items(id) ON DELETE CASCADE,
  quantity_used DECIMAL(10,3) NOT NULL
);

-- 1.6 Inventory Transactions (audit trail)
CREATE TABLE IF NOT EXISTS pos_inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES pos_inventory_items(id) ON DELETE CASCADE,
  change_amount DECIMAL(12,3) NOT NULL,
  reason VARCHAR(20) NOT NULL CHECK (reason IN ('sale', 'purchase', 'waste', 'manual_adjustment', 'refund')),
  reference_order_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.7 Orders
CREATE TABLE IF NOT EXISTS pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  table_number VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'cancelled')),
  subtotal DECIMAL(10,3) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(10,3) NOT NULL DEFAULT 0,
  total DECIMAL(10,3) NOT NULL DEFAULT 0,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'OMR',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- 1.8 Order Items
CREATE TABLE IF NOT EXISTS pos_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES pos_products(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,3) NOT NULL,
  line_total DECIMAL(10,3) NOT NULL,
  cost_at_sale_time DECIMAL(10,3)
);

-- 1.9 Payments (with idempotency key — Addition A)
CREATE TABLE IF NOT EXISTS pos_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES pos_orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,3) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'card', 'other')),
  idempotency_key UUID,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.10 Invoices (immutable — no hard delete, only credit)
CREATE TABLE IF NOT EXISTS pos_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES pos_orders(id),
  invoice_number VARCHAR(30) NOT NULL,
  branch_id UUID NOT NULL REFERENCES pos_branches(id),
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  buyer_name VARCHAR(150),
  buyer_vatin VARCHAR(50),
  seller_vatin VARCHAR(50),
  seller_name VARCHAR(150),
  status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'credited')),
  format_ready_for_fawtara BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (branch_id, invoice_number)
);

-- 1.11 Invoice Line Items
CREATE TABLE IF NOT EXISTS pos_invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES pos_invoices(id) ON DELETE CASCADE,
  description VARCHAR(200) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,3) NOT NULL,
  net_amount DECIMAL(10,3) NOT NULL,
  vat_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  vat_amount DECIMAL(10,3) NOT NULL,
  total_amount DECIMAL(10,3) NOT NULL
);

-- 1.12 Expense Categories
CREATE TABLE IF NOT EXISTS pos_expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL
);

-- 1.13 Expenses
CREATE TABLE IF NOT EXISTS pos_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  expense_category_id UUID REFERENCES pos_expense_categories(id),
  amount DECIMAL(10,3) NOT NULL,
  currency_code VARCHAR(3) NOT NULL DEFAULT 'OMR',
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_system_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.14 Invoice Counters (Fix 2 — atomic sequential invoice numbers)
CREATE TABLE IF NOT EXISTS pos_invoice_counters (
  branch_id UUID PRIMARY KEY REFERENCES pos_branches(id) ON DELETE CASCADE,
  last_number BIGINT NOT NULL DEFAULT 0
);

-- 1.15 Financial Audit Log (Addition B)
CREATE TABLE IF NOT EXISTS pos_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id),
  action TEXT NOT NULL,
  actor_user_id UUID NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════
-- 2. ENABLE ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE pos_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_product_recipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_invoice_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_audit_log ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════
-- 3. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════

-- Branches
CREATE POLICY "Owner manage pos_branches" ON pos_branches FOR ALL
  USING (restaurant_id IN (SELECT get_my_restaurant_ids()))
  WITH CHECK (restaurant_id IN (SELECT get_my_restaurant_ids()));
CREATE POLICY "Admin manage pos_branches" ON pos_branches FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Menu Categories (via branch → restaurant)
CREATE POLICY "Owner manage pos_menu_categories" ON pos_menu_categories FOR ALL
  USING (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())))
  WITH CHECK (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())));
CREATE POLICY "Admin manage pos_menu_categories" ON pos_menu_categories FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Products
CREATE POLICY "Owner manage pos_products" ON pos_products FOR ALL
  USING (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())))
  WITH CHECK (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())));
CREATE POLICY "Admin manage pos_products" ON pos_products FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Inventory Items
CREATE POLICY "Owner manage pos_inventory_items" ON pos_inventory_items FOR ALL
  USING (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())))
  WITH CHECK (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())));
CREATE POLICY "Admin manage pos_inventory_items" ON pos_inventory_items FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Product Recipe (via product → branch → restaurant)
CREATE POLICY "Owner manage pos_product_recipe" ON pos_product_recipe FOR ALL
  USING (product_id IN (SELECT id FROM pos_products WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))))
  WITH CHECK (product_id IN (SELECT id FROM pos_products WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))));
CREATE POLICY "Admin manage pos_product_recipe" ON pos_product_recipe FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Inventory Transactions
CREATE POLICY "Owner manage pos_inventory_transactions" ON pos_inventory_transactions FOR ALL
  USING (inventory_item_id IN (SELECT id FROM pos_inventory_items WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))))
  WITH CHECK (inventory_item_id IN (SELECT id FROM pos_inventory_items WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))));
CREATE POLICY "Admin manage pos_inventory_transactions" ON pos_inventory_transactions FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Orders
CREATE POLICY "Owner manage pos_orders" ON pos_orders FOR ALL
  USING (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())))
  WITH CHECK (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())));
CREATE POLICY "Admin manage pos_orders" ON pos_orders FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Order Items (via order → branch → restaurant)
CREATE POLICY "Owner manage pos_order_items" ON pos_order_items FOR ALL
  USING (order_id IN (SELECT id FROM pos_orders WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))))
  WITH CHECK (order_id IN (SELECT id FROM pos_orders WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))));
CREATE POLICY "Admin manage pos_order_items" ON pos_order_items FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Payments (via order → branch → restaurant)
CREATE POLICY "Owner manage pos_payments" ON pos_payments FOR ALL
  USING (order_id IN (SELECT id FROM pos_orders WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))))
  WITH CHECK (order_id IN (SELECT id FROM pos_orders WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))));
CREATE POLICY "Admin manage pos_payments" ON pos_payments FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Invoices
CREATE POLICY "Owner manage pos_invoices" ON pos_invoices FOR ALL
  USING (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())))
  WITH CHECK (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())));
CREATE POLICY "Admin manage pos_invoices" ON pos_invoices FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Invoice Line Items (via invoice → branch → restaurant)
CREATE POLICY "Owner manage pos_invoice_line_items" ON pos_invoice_line_items FOR ALL
  USING (invoice_id IN (SELECT id FROM pos_invoices WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))))
  WITH CHECK (invoice_id IN (SELECT id FROM pos_invoices WHERE branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids()))));
CREATE POLICY "Admin manage pos_invoice_line_items" ON pos_invoice_line_items FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Expense Categories
CREATE POLICY "Owner manage pos_expense_categories" ON pos_expense_categories FOR ALL
  USING (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())))
  WITH CHECK (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())));
CREATE POLICY "Admin manage pos_expense_categories" ON pos_expense_categories FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Expenses
CREATE POLICY "Owner manage pos_expenses" ON pos_expenses FOR ALL
  USING (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())))
  WITH CHECK (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())));
CREATE POLICY "Admin manage pos_expenses" ON pos_expenses FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Invoice Counters (via branch → restaurant)
CREATE POLICY "Owner manage pos_invoice_counters" ON pos_invoice_counters FOR ALL
  USING (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())))
  WITH CHECK (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())));
CREATE POLICY "Admin manage pos_invoice_counters" ON pos_invoice_counters FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());

-- Audit Log (via branch → restaurant)
CREATE POLICY "Owner read pos_audit_log" ON pos_audit_log FOR SELECT
  USING (branch_id IN (SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())));
CREATE POLICY "Admin manage pos_audit_log" ON pos_audit_log FOR ALL
  USING (is_super_admin()) WITH CHECK (is_super_admin());


-- ═══════════════════════════════════════════════════════════════════════
-- 4. INDEXES
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_pos_branches_restaurant ON pos_branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_pos_products_branch ON pos_products(branch_id);
CREATE INDEX IF NOT EXISTS idx_pos_products_category ON pos_products(category_id);
CREATE INDEX IF NOT EXISTS idx_pos_inventory_branch ON pos_inventory_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_pos_recipe_product ON pos_product_recipe(product_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_branch_status ON pos_orders(branch_id, status);
CREATE INDEX IF NOT EXISTS idx_pos_order_items_order ON pos_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pos_inv_transactions_item ON pos_inventory_transactions(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_pos_invoices_branch_number ON pos_invoices(branch_id, invoice_number);
CREATE INDEX IF NOT EXISTS idx_pos_expenses_branch_date ON pos_expenses(branch_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_pos_inventory_low_stock ON pos_inventory_items(branch_id, current_quantity, reorder_threshold);
CREATE INDEX IF NOT EXISTS idx_pos_audit_log_branch ON pos_audit_log(branch_id, created_at);

-- Fix 4: Partial unique index — prevent two simultaneously open orders on the same table
CREATE UNIQUE INDEX IF NOT EXISTS uniq_open_order_per_table
ON pos_orders (branch_id, table_number)
WHERE status = 'open' AND table_number IS NOT NULL;

-- Addition A: Idempotency key uniqueness on payments
CREATE UNIQUE INDEX IF NOT EXISTS uniq_payment_idempotency
ON pos_payments (idempotency_key)
WHERE idempotency_key IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Fix 1: Branch access assertion (SECURITY DEFINER guard) ─────────
-- Every RPC must call this before doing anything. RLS is bypassed by
-- SECURITY DEFINER, so this is the only trust boundary for RPCs.
CREATE OR REPLACE FUNCTION pos_assert_branch_access(p_branch_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pos_branches b
    JOIN restaurants r ON r.id = b.restaurant_id
    WHERE b.id = p_branch_id
      AND r.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied for branch %', p_branch_id
      USING ERRCODE = '42501';
  END IF;
END;
$$;


-- ─── Fix 2: Atomic invoice number generator ──────────────────────────
-- Uses UPDATE ... RETURNING on a single-row table for implicit row lock.
-- Never skips, never collides, safe under concurrent checkouts.
CREATE OR REPLACE FUNCTION pos_next_invoice_number(p_branch_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next BIGINT;
  v_branch_code TEXT;
BEGIN
  -- Ensure counter row exists (idempotent upsert)
  INSERT INTO pos_invoice_counters (branch_id, last_number)
  VALUES (p_branch_id, 0)
  ON CONFLICT (branch_id) DO NOTHING;

  -- Atomically increment and lock the row
  UPDATE pos_invoice_counters
  SET last_number = last_number + 1
  WHERE branch_id = p_branch_id
  RETURNING last_number INTO v_next;

  SELECT substr(id::text, 1, 4) INTO v_branch_code
  FROM pos_branches WHERE id = p_branch_id;

  RETURN 'INV-' || v_branch_code || '-' || v_next;
END;
$$;


-- ─── Fix 4: Open-order lookup for table recovery ─────────────────────
CREATE OR REPLACE FUNCTION pos_get_open_order_for_table(
  p_branch_id UUID,
  p_table_number TEXT
)
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM pos_orders
  WHERE branch_id = p_branch_id
    AND table_number = p_table_number
    AND status = 'open'
  LIMIT 1;
$$;


-- ═══════════════════════════════════════════════════════════════════════
-- 6. TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════

-- ─── Fix 3: Auto-recalculate product cost when ingredient cost changes ───
CREATE OR REPLACE FUNCTION pos_recalculate_affected_product_costs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.cost_per_unit IS DISTINCT FROM OLD.cost_per_unit THEN
    UPDATE pos_products p
    SET cost_price = (
      SELECT COALESCE(SUM(pr.quantity_used * ii.cost_per_unit), 0)
      FROM pos_product_recipe pr
      JOIN pos_inventory_items ii ON ii.id = pr.inventory_item_id
      WHERE pr.product_id = p.id
    )
    WHERE p.id IN (
      SELECT product_id FROM pos_product_recipe WHERE inventory_item_id = NEW.id
    );
    -- NOTE: This updates LIVE cost_price only (for pricing decisions).
    -- It must NEVER touch pos_order_items.cost_at_sale_time, which is a
    -- historical snapshot written once at sale time and must remain
    -- untouched forever for accurate historical profit reports.
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_product_costs
AFTER UPDATE ON pos_inventory_items
FOR EACH ROW
EXECUTE FUNCTION pos_recalculate_affected_product_costs();


-- ─── Addition C: Database-level invoice immutability ─────────────────
CREATE OR REPLACE FUNCTION pos_prevent_issued_invoice_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.status = 'issued' THEN
    RAISE EXCEPTION 'Issued invoices cannot be deleted, only credited via pos_cancel_order.';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'issued' THEN
    -- Only allow format_ready_for_fawtara to change in-place
    IF (NEW.invoice_number, NEW.order_id, NEW.issue_date, NEW.seller_vatin, NEW.seller_name)
       IS DISTINCT FROM
       (OLD.invoice_number, OLD.order_id, OLD.issue_date, OLD.seller_vatin, OLD.seller_name) THEN
      RAISE EXCEPTION 'Issued invoice core fields are immutable.';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_invoice_immutability
BEFORE UPDATE OR DELETE ON pos_invoices
FOR EACH ROW
EXECUTE FUNCTION pos_prevent_issued_invoice_mutation();


-- ═══════════════════════════════════════════════════════════════════════
-- 7. RPC FUNCTIONS — Transactional Business Logic (with Fix 1 guards)
-- ═══════════════════════════════════════════════════════════════════════

-- ─── pos_close_order ─────────────────────────────────────────────────
-- Payment → Inventory Deduction → Invoice Generation (single atomic txn)
-- Includes: Fix 1 (access check), Fix 2 (atomic invoice#), Addition A
-- (idempotency), Addition B (audit log)
CREATE OR REPLACE FUNCTION pos_close_order(
  p_order_id UUID,
  p_payment_method VARCHAR(20),
  p_amount DECIMAL(10,3),
  p_vat_rate DECIMAL(5,2) DEFAULT 5.00,
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_branch RECORD;
  v_item RECORD;
  v_recipe RECORD;
  v_total_used DECIMAL(12,3);
  v_vat_amount DECIMAL(10,3);
  v_total DECIMAL(10,3);
  v_invoice_id UUID;
  v_invoice_number VARCHAR(30);
  v_item_vat DECIMAL(10,3);
  v_existing_payment RECORD;
BEGIN
  -- 0. Idempotency check (Addition A): if this key was already processed, return the existing result
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_payment FROM pos_payments
    WHERE idempotency_key = p_idempotency_key LIMIT 1;

    IF FOUND THEN
      -- Already processed — return the existing invoice for this order
      SELECT jsonb_build_object(
        'orderId', o.id,
        'invoiceId', i.id,
        'invoiceNumber', i.invoice_number,
        'subtotal', o.subtotal,
        'vatAmount', o.vat_amount,
        'total', o.total
      ) INTO v_item -- reusing variable for return
      FROM pos_orders o
      JOIN pos_invoices i ON i.order_id = o.id
      WHERE o.id = v_existing_payment.order_id
      LIMIT 1;

      RETURN v_item::jsonb;
    END IF;
  END IF;

  -- 1. Lock and validate order
  SELECT * INTO v_order FROM pos_orders WHERE id = p_order_id AND status = 'open' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or already closed';
  END IF;

  -- Fix 1: Verify branch ownership BEFORE any mutation
  PERFORM pos_assert_branch_access(v_order.branch_id);

  -- 2. Calculate VAT and total
  v_vat_amount := v_order.subtotal * (p_vat_rate / 100);
  v_total := v_order.subtotal + v_vat_amount;

  -- 3. Update order status
  UPDATE pos_orders
  SET status = 'paid', vat_amount = v_vat_amount, total = v_total, closed_at = NOW()
  WHERE id = p_order_id;

  -- 4. Record payment (with idempotency key)
  INSERT INTO pos_payments (order_id, amount, method, idempotency_key)
  VALUES (p_order_id, p_amount, p_payment_method, p_idempotency_key);

  -- 5. Deduct inventory for each order item's recipe
  FOR v_item IN SELECT * FROM pos_order_items WHERE order_id = p_order_id LOOP
    FOR v_recipe IN SELECT * FROM pos_product_recipe WHERE product_id = v_item.product_id LOOP
      v_total_used := v_recipe.quantity_used * v_item.quantity;

      UPDATE pos_inventory_items
      SET current_quantity = current_quantity - v_total_used, updated_at = NOW()
      WHERE id = v_recipe.inventory_item_id;

      INSERT INTO pos_inventory_transactions (inventory_item_id, change_amount, reason, reference_order_id, created_by)
      VALUES (v_recipe.inventory_item_id, -v_total_used, 'sale', p_order_id, auth.uid());
    END LOOP;
  END LOOP;

  -- 6. Generate invoice number atomically (Fix 2)
  v_invoice_number := pos_next_invoice_number(v_order.branch_id);

  -- 7. Get branch info
  SELECT * INTO v_branch FROM pos_branches WHERE id = v_order.branch_id;

  -- 8. Create invoice
  INSERT INTO pos_invoices (order_id, invoice_number, branch_id, seller_vatin, seller_name)
  VALUES (p_order_id, v_invoice_number, v_order.branch_id, v_branch.vat_registration_number, v_branch.name)
  RETURNING id INTO v_invoice_id;

  -- 9. Create invoice line items
  FOR v_item IN
    SELECT oi.*, p.name AS product_name
    FROM pos_order_items oi
    JOIN pos_products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
  LOOP
    v_item_vat := v_item.line_total * (p_vat_rate / 100);
    INSERT INTO pos_invoice_line_items (invoice_id, description, quantity, unit_price, net_amount, vat_rate, vat_amount, total_amount)
    VALUES (v_invoice_id, v_item.product_name, v_item.quantity, v_item.unit_price, v_item.line_total, p_vat_rate, v_item_vat, v_item.line_total + v_item_vat);
  END LOOP;

  -- 10. Audit log (Addition B)
  INSERT INTO pos_audit_log (branch_id, action, actor_user_id, target_id, details)
  VALUES (
    v_order.branch_id,
    'order_paid',
    auth.uid(),
    p_order_id,
    jsonb_build_object(
      'invoiceNumber', v_invoice_number,
      'paymentMethod', p_payment_method,
      'subtotal', v_order.subtotal,
      'vatAmount', v_vat_amount,
      'total', v_total
    )
  );

  -- 11. Return result
  RETURN jsonb_build_object(
    'orderId', p_order_id,
    'invoiceId', v_invoice_id,
    'invoiceNumber', v_invoice_number,
    'subtotal', v_order.subtotal,
    'vatAmount', v_vat_amount,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── pos_restock_inventory ───────────────────────────────────────────
-- Restock + auto-create expense (single atomic txn)
-- Includes: Fix 1 (access check), Addition B (audit log)
CREATE OR REPLACE FUNCTION pos_restock_inventory(
  p_item_id UUID,
  p_quantity DECIMAL(12,3),
  p_total_cost DECIMAL(10,3),
  p_branch_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_expense_cat_id UUID;
BEGIN
  -- Fix 1: Verify branch ownership
  PERFORM pos_assert_branch_access(p_branch_id);

  -- 1. Update inventory quantity and cost_per_unit
  UPDATE pos_inventory_items
  SET current_quantity = current_quantity + p_quantity,
      cost_per_unit = CASE WHEN p_quantity > 0 THEN p_total_cost / p_quantity ELSE cost_per_unit END,
      updated_at = NOW()
  WHERE id = p_item_id
  RETURNING * INTO v_item;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found';
  END IF;

  -- 2. Record transaction
  INSERT INTO pos_inventory_transactions (inventory_item_id, change_amount, reason, created_by)
  VALUES (p_item_id, p_quantity, 'purchase', auth.uid());

  -- 3. Find or create "مشتريات مواد خام" expense category
  SELECT id INTO v_expense_cat_id FROM pos_expense_categories
  WHERE branch_id = p_branch_id AND name IN ('مشتريات مواد خام', 'Raw Materials Purchase')
  LIMIT 1;

  IF v_expense_cat_id IS NULL THEN
    INSERT INTO pos_expense_categories (branch_id, name)
    VALUES (p_branch_id, 'مشتريات مواد خام')
    RETURNING id INTO v_expense_cat_id;
  END IF;

  -- 4. Auto-create expense
  INSERT INTO pos_expenses (branch_id, expense_category_id, amount, currency_code, description, expense_date, is_system_generated, created_by)
  VALUES (
    p_branch_id,
    v_expense_cat_id,
    p_total_cost,
    (SELECT currency_code FROM pos_branches WHERE id = p_branch_id),
    'توريد مخزون — ' || v_item.name,
    CURRENT_DATE,
    true,
    auth.uid()
  );

  -- 5. Audit log (Addition B)
  INSERT INTO pos_audit_log (branch_id, action, actor_user_id, target_id, details)
  VALUES (
    p_branch_id,
    'inventory_restocked',
    auth.uid(),
    p_item_id,
    jsonb_build_object(
      'itemName', v_item.name,
      'quantity', p_quantity,
      'totalCost', p_total_cost,
      'newQuantity', v_item.current_quantity + p_quantity
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'newQuantity', v_item.current_quantity + p_quantity,
    'itemName', v_item.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── pos_cancel_order ────────────────────────────────────────────────
-- Refund → restore inventory → credit note (single atomic txn)
-- Includes: Fix 1 (access check), Fix 2 (atomic credit note#),
-- Addition B (audit log)
CREATE OR REPLACE FUNCTION pos_cancel_order(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_recipe RECORD;
  v_total_used DECIMAL(12,3);
  v_original_invoice RECORD;
  v_credit_invoice_id UUID;
  v_credit_number VARCHAR(30);
BEGIN
  -- 1. Validate order
  SELECT * INTO v_order FROM pos_orders WHERE id = p_order_id AND status = 'paid' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or not in paid status';
  END IF;

  -- Fix 1: Verify branch ownership
  PERFORM pos_assert_branch_access(v_order.branch_id);

  -- 2. Mark order as cancelled
  UPDATE pos_orders SET status = 'cancelled' WHERE id = p_order_id;

  -- 3. Restore inventory
  FOR v_item IN SELECT * FROM pos_order_items WHERE order_id = p_order_id LOOP
    FOR v_recipe IN SELECT * FROM pos_product_recipe WHERE product_id = v_item.product_id LOOP
      v_total_used := v_recipe.quantity_used * v_item.quantity;

      UPDATE pos_inventory_items
      SET current_quantity = current_quantity + v_total_used, updated_at = NOW()
      WHERE id = v_recipe.inventory_item_id;

      INSERT INTO pos_inventory_transactions (inventory_item_id, change_amount, reason, reference_order_id, created_by)
      VALUES (v_recipe.inventory_item_id, v_total_used, 'refund', p_order_id, auth.uid());
    END LOOP;
  END LOOP;

  -- 4. Mark original invoice as credited (immutability trigger allows status change from 'issued' → 'credited')
  SELECT * INTO v_original_invoice FROM pos_invoices WHERE order_id = p_order_id AND status = 'issued' LIMIT 1;
  IF FOUND THEN
    UPDATE pos_invoices SET status = 'credited' WHERE id = v_original_invoice.id;

    -- 5. Create credit note with atomic number (Fix 2)
    v_credit_number := pos_next_invoice_number(v_order.branch_id);
    -- Replace INV prefix with CN for credit notes
    v_credit_number := 'CN-' || substr(v_credit_number, 5);

    INSERT INTO pos_invoices (order_id, invoice_number, branch_id, seller_vatin, seller_name, status)
    VALUES (p_order_id, v_credit_number, v_order.branch_id, v_original_invoice.seller_vatin, v_original_invoice.seller_name, 'credited')
    RETURNING id INTO v_credit_invoice_id;
  END IF;

  -- 6. Audit log (Addition B)
  INSERT INTO pos_audit_log (branch_id, action, actor_user_id, target_id, details)
  VALUES (
    v_order.branch_id,
    'order_cancelled',
    auth.uid(),
    p_order_id,
    jsonb_build_object(
      'originalInvoiceNumber', v_original_invoice.invoice_number,
      'creditNoteNumber', v_credit_number,
      'refundedTotal', v_order.total
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'orderId', p_order_id,
    'creditNoteNumber', v_credit_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── pos_ensure_default_branch ───────────────────────────────────────
-- Safe idempotent branch creation (only creates if none exists)
CREATE OR REPLACE FUNCTION pos_ensure_default_branch(p_restaurant_id UUID)
RETURNS UUID AS $$
DECLARE
  v_branch_id UUID;
  v_restaurant_name TEXT;
BEGIN
  -- Check first — never creates duplicates
  SELECT id INTO v_branch_id
  FROM pos_branches
  WHERE restaurant_id = p_restaurant_id AND is_default = true
  LIMIT 1;

  IF v_branch_id IS NOT NULL THEN
    RETURN v_branch_id;
  END IF;

  -- Safe insert with NOT EXISTS guard (belt-and-suspenders against race)
  SELECT COALESCE(name_ar, name_en, 'الفرع الرئيسي') INTO v_restaurant_name
  FROM restaurants WHERE id = p_restaurant_id;

  INSERT INTO pos_branches (restaurant_id, name, is_default)
  SELECT p_restaurant_id, v_restaurant_name || ' — الفرع الرئيسي', true
  WHERE NOT EXISTS (SELECT 1 FROM pos_branches WHERE restaurant_id = p_restaurant_id)
  RETURNING id INTO v_branch_id;

  -- Seed default expense categories only if branch was just created
  IF v_branch_id IS NOT NULL THEN
    INSERT INTO pos_expense_categories (branch_id, name) VALUES
      (v_branch_id, 'إيجار'),
      (v_branch_id, 'رواتب'),
      (v_branch_id, 'مشتريات مواد خام'),
      (v_branch_id, 'صيانة'),
      (v_branch_id, 'أخرى');
  ELSE
    -- Race condition: another session created the branch concurrently
    SELECT id INTO v_branch_id
    FROM pos_branches
    WHERE restaurant_id = p_restaurant_id AND is_default = true
    LIMIT 1;
  END IF;

  RETURN v_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
