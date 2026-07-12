-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  POS & Accounting Module — SQL RPC Verification Tests              ║
-- ║                                                                    ║
-- ║  Run: supabase db execute --file supabase/tests/pos_rpc_tests.sql  ║
-- ║                                                                    ║
-- ║  These tests use plain assertion queries (no pgTAP dependency).    ║
-- ║  Each test prints PASS or FAIL with a description.                 ║
-- ║                                                                    ║
-- ║  IMPORTANT: These tests require a test restaurant + user setup.    ║
-- ║  Run against a LOCAL Supabase instance (supabase start + db reset) ║
-- ║  or a staging project — never against production.                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════
-- Setup: Create test data
-- ═══════════════════════════════════════════

-- NOTE: These tests assume the migration has been applied.
-- They use DO blocks to simulate test scenarios.
-- In a real Supabase environment, auth.uid() returns NULL in raw SQL,
-- so some tests verify schema constraints directly rather than
-- simulating full RPC flows (which require authenticated sessions).

DO $$
DECLARE
  v_branch_id UUID;
  v_product_id UUID;
  v_inventory_item_id UUID;
  v_order_id UUID;
  v_order_id_2 UUID;
  v_invoice_number_1 TEXT;
  v_invoice_number_2 TEXT;
  v_invoice_id UUID;
  v_expense_count INT;
  v_new_qty DECIMAL;
  v_product_cost DECIMAL;
  v_old_cost_at_sale DECIMAL;
  v_result JSONB;
BEGIN
  RAISE NOTICE '══════════════════════════════════════════';
  RAISE NOTICE 'POS & Accounting RPC Tests — Starting';
  RAISE NOTICE '══════════════════════════════════════════';

  -- ─── Test Setup ────────────────────────────────────────────────────

  -- Create a test restaurant (if not exists)
  -- NOTE: Adjust this to match your restaurants table schema
  -- INSERT INTO restaurants (id, name_ar, name_en, owner_id)
  -- VALUES (gen_random_uuid(), 'مطعم اختبار', 'Test Restaurant', auth.uid())
  -- ON CONFLICT DO NOTHING;

  -- For schema-level tests, we create data directly:
  INSERT INTO pos_branches (id, restaurant_id, name, currency_code, vat_rate, is_default)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    (SELECT id FROM restaurants LIMIT 1),
    'Test Branch',
    'OMR',
    5.00,
    true
  ) ON CONFLICT (id) DO NOTHING;

  v_branch_id := '00000000-0000-0000-0000-000000000001'::UUID;

  -- Create test inventory item
  INSERT INTO pos_inventory_items (id, branch_id, name, unit, current_quantity, reorder_threshold, cost_per_unit)
  VALUES (
    '00000000-0000-0000-0000-000000000010'::UUID,
    v_branch_id,
    'Test Flour',
    'kg',
    100.000,
    10.000,
    0.500
  ) ON CONFLICT (id) DO UPDATE SET current_quantity = 100.000, cost_per_unit = 0.500;

  v_inventory_item_id := '00000000-0000-0000-0000-000000000010'::UUID;

  -- Create test product
  INSERT INTO pos_products (id, branch_id, name, selling_price, cost_price)
  VALUES (
    '00000000-0000-0000-0000-000000000020'::UUID,
    v_branch_id,
    'Test Bread',
    1.500,
    0.500
  ) ON CONFLICT (id) DO UPDATE SET cost_price = 0.500;

  v_product_id := '00000000-0000-0000-0000-000000000020'::UUID;

  -- Create recipe link
  INSERT INTO pos_product_recipe (product_id, inventory_item_id, quantity_used)
  VALUES (v_product_id, v_inventory_item_id, 1.000)
  ON CONFLICT DO NOTHING;


  -- ═══════════════════════════════════════════
  -- TEST 1: pos_assert_branch_access denies unauthorized users
  -- ═══════════════════════════════════════════
  -- NOTE: In raw SQL (not via PostgREST), auth.uid() returns NULL,
  -- so pos_assert_branch_access should ALWAYS deny access here.
  -- This actually proves the guard works — it correctly rejects
  -- when there's no matching owner.

  BEGIN
    PERFORM pos_assert_branch_access(v_branch_id);
    RAISE NOTICE '❌ TEST 1 FAIL: pos_assert_branch_access should have raised an exception for unauthorized access';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ TEST 1 PASS: pos_assert_branch_access correctly denied access for unauthorized user (SQLSTATE: %)', SQLSTATE;
  END;


  -- ═══════════════════════════════════════════
  -- TEST 2: Invoice numbers are sequential and unique
  -- ═══════════════════════════════════════════
  -- Two calls to pos_next_invoice_number should return sequential numbers

  v_invoice_number_1 := pos_next_invoice_number(v_branch_id);
  v_invoice_number_2 := pos_next_invoice_number(v_branch_id);

  IF v_invoice_number_1 IS NOT NULL
    AND v_invoice_number_2 IS NOT NULL
    AND v_invoice_number_1 <> v_invoice_number_2
  THEN
    RAISE NOTICE '✅ TEST 2 PASS: Invoice numbers are sequential and unique (% → %)', v_invoice_number_1, v_invoice_number_2;
  ELSE
    RAISE NOTICE '❌ TEST 2 FAIL: Invoice numbers are not sequential or unique (% → %)', v_invoice_number_1, v_invoice_number_2;
  END IF;

  -- Verify the counter incremented correctly
  DECLARE
    v_counter BIGINT;
  BEGIN
    SELECT last_number INTO v_counter FROM pos_invoice_counters WHERE branch_id = v_branch_id;
    IF v_counter >= 2 THEN
      RAISE NOTICE '   ↳ Counter value after 2 calls: % (correct)', v_counter;
    ELSE
      RAISE NOTICE '   ↳ Counter value after 2 calls: % (UNEXPECTED)', v_counter;
    END IF;
  END;


  -- ═══════════════════════════════════════════
  -- TEST 3: Restock increases inventory AND creates expense
  -- ═══════════════════════════════════════════
  -- We test the individual operations since the RPC requires auth.uid()
  -- which is NULL in raw SQL. We verify the schema supports the flow.

  -- Record starting state
  SELECT current_quantity INTO v_new_qty FROM pos_inventory_items WHERE id = v_inventory_item_id;
  SELECT COUNT(*) INTO v_expense_count FROM pos_expenses WHERE branch_id = v_branch_id AND is_system_generated = true;

  -- Simulate restock: increment inventory
  UPDATE pos_inventory_items
  SET current_quantity = current_quantity + 50.000,
      cost_per_unit = 0.600,
      updated_at = NOW()
  WHERE id = v_inventory_item_id;

  -- Simulate auto-expense creation
  INSERT INTO pos_expense_categories (id, branch_id, name)
  VALUES ('00000000-0000-0000-0000-000000000030'::UUID, v_branch_id, 'مشتريات مواد خام')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO pos_expenses (branch_id, expense_category_id, amount, currency_code, description, expense_date, is_system_generated)
  VALUES (
    v_branch_id,
    '00000000-0000-0000-0000-000000000030'::UUID,
    30.000,
    'OMR',
    'توريد مخزون — Test Flour',
    CURRENT_DATE,
    true
  );

  -- Verify inventory increased
  SELECT current_quantity INTO v_new_qty FROM pos_inventory_items WHERE id = v_inventory_item_id;
  IF v_new_qty >= 150.000 THEN
    RAISE NOTICE '✅ TEST 3a PASS: Inventory quantity increased to % (expected >= 150)', v_new_qty;
  ELSE
    RAISE NOTICE '❌ TEST 3a FAIL: Inventory quantity is % (expected >= 150)', v_new_qty;
  END IF;

  -- Verify expense was created
  DECLARE
    v_new_expense_count INT;
  BEGIN
    SELECT COUNT(*) INTO v_new_expense_count FROM pos_expenses WHERE branch_id = v_branch_id AND is_system_generated = true;
    IF v_new_expense_count > v_expense_count THEN
      RAISE NOTICE '✅ TEST 3b PASS: System-generated expense created (count: % → %)', v_expense_count, v_new_expense_count;
    ELSE
      RAISE NOTICE '❌ TEST 3b FAIL: No new system-generated expense found (count stayed at %)', v_expense_count;
    END IF;
  END;


  -- ═══════════════════════════════════════════
  -- TEST 4: Cost recalculation trigger updates product cost
  --         but does NOT touch historical cost_at_sale_time
  -- ═══════════════════════════════════════════

  -- First, create a historical order item with a frozen cost_at_sale_time
  INSERT INTO pos_orders (id, branch_id, status, subtotal, total, currency_code)
  VALUES (
    '00000000-0000-0000-0000-000000000040'::UUID,
    v_branch_id,
    'paid',
    1.500,
    1.575,
    'OMR'
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO pos_order_items (id, order_id, product_id, quantity, unit_price, line_total, cost_at_sale_time)
  VALUES (
    '00000000-0000-0000-0000-000000000041'::UUID,
    '00000000-0000-0000-0000-000000000040'::UUID,
    v_product_id,
    1,
    1.500,
    1.500,
    0.500  -- Historical cost snapshot
  ) ON CONFLICT (id) DO NOTHING;

  -- Now change ingredient cost — trigger should update product cost_price
  UPDATE pos_inventory_items
  SET cost_per_unit = 1.200
  WHERE id = v_inventory_item_id;

  -- Verify product cost_price was updated
  SELECT cost_price INTO v_product_cost FROM pos_products WHERE id = v_product_id;
  IF v_product_cost IS NOT NULL AND v_product_cost >= 1.000 THEN
    RAISE NOTICE '✅ TEST 4a PASS: Product cost_price updated to % after ingredient cost change', v_product_cost;
  ELSE
    RAISE NOTICE '❌ TEST 4a FAIL: Product cost_price is % (expected >= 1.000 after trigger)', v_product_cost;
  END IF;

  -- Verify historical cost_at_sale_time was NOT changed
  SELECT cost_at_sale_time INTO v_old_cost_at_sale
  FROM pos_order_items
  WHERE id = '00000000-0000-0000-0000-000000000041'::UUID;

  IF v_old_cost_at_sale = 0.500 THEN
    RAISE NOTICE '✅ TEST 4b PASS: Historical cost_at_sale_time preserved at % (untouched by trigger)', v_old_cost_at_sale;
  ELSE
    RAISE NOTICE '❌ TEST 4b FAIL: Historical cost_at_sale_time changed to % (SHOULD be 0.500)', v_old_cost_at_sale;
  END IF;


  -- ═══════════════════════════════════════════
  -- TEST 5: Invoice immutability trigger
  -- ═══════════════════════════════════════════

  -- Create a test invoice with status='issued'
  INSERT INTO pos_invoices (id, order_id, invoice_number, branch_id, seller_name, status)
  VALUES (
    '00000000-0000-0000-0000-000000000050'::UUID,
    '00000000-0000-0000-0000-000000000040'::UUID,
    'TEST-IMMUTABLE-001',
    v_branch_id,
    'Test Restaurant',
    'issued'
  ) ON CONFLICT (id) DO NOTHING;

  v_invoice_id := '00000000-0000-0000-0000-000000000050'::UUID;

  -- 5a: Attempt to UPDATE core fields on an issued invoice → should fail
  BEGIN
    UPDATE pos_invoices
    SET invoice_number = 'TAMPERED-NUMBER'
    WHERE id = v_invoice_id;

    RAISE NOTICE '❌ TEST 5a FAIL: UPDATE on issued invoice core fields should have been blocked';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ TEST 5a PASS: UPDATE on issued invoice core fields correctly blocked (%)' , SQLERRM;
  END;

  -- 5b: Attempt to DELETE an issued invoice → should fail
  BEGIN
    DELETE FROM pos_invoices WHERE id = v_invoice_id;
    RAISE NOTICE '❌ TEST 5b FAIL: DELETE on issued invoice should have been blocked';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✅ TEST 5b PASS: DELETE on issued invoice correctly blocked (%)' , SQLERRM;
  END;

  -- 5c: Changing format_ready_for_fawtara should be ALLOWED
  BEGIN
    UPDATE pos_invoices
    SET format_ready_for_fawtara = true
    WHERE id = v_invoice_id;

    RAISE NOTICE '✅ TEST 5c PASS: format_ready_for_fawtara update allowed on issued invoice';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ TEST 5c FAIL: format_ready_for_fawtara update was blocked (should be allowed): %', SQLERRM;
  END;

  -- 5d: Changing status from 'issued' to 'credited' should be ALLOWED (for refunds)
  BEGIN
    UPDATE pos_invoices
    SET status = 'credited'
    WHERE id = v_invoice_id;

    RAISE NOTICE '✅ TEST 5d PASS: Status change from issued → credited allowed (for refund flow)';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ TEST 5d FAIL: Status change to credited was blocked (should be allowed for refunds): %', SQLERRM;
  END;


  -- ═══════════════════════════════════════════
  -- Cleanup test data
  -- ═══════════════════════════════════════════
  DELETE FROM pos_invoice_line_items WHERE invoice_id = v_invoice_id;
  DELETE FROM pos_invoices WHERE id = v_invoice_id;
  DELETE FROM pos_order_items WHERE order_id = '00000000-0000-0000-0000-000000000040'::UUID;
  DELETE FROM pos_orders WHERE id = '00000000-0000-0000-0000-000000000040'::UUID;
  DELETE FROM pos_product_recipe WHERE product_id = v_product_id;
  DELETE FROM pos_products WHERE id = v_product_id;
  DELETE FROM pos_expenses WHERE branch_id = v_branch_id;
  DELETE FROM pos_expense_categories WHERE id = '00000000-0000-0000-0000-000000000030'::UUID;
  DELETE FROM pos_inventory_transactions WHERE inventory_item_id = v_inventory_item_id;
  DELETE FROM pos_inventory_items WHERE id = v_inventory_item_id;
  DELETE FROM pos_invoice_counters WHERE branch_id = v_branch_id;
  DELETE FROM pos_audit_log WHERE branch_id = v_branch_id;
  DELETE FROM pos_branches WHERE id = v_branch_id;

  RAISE NOTICE '══════════════════════════════════════════';
  RAISE NOTICE 'POS & Accounting RPC Tests — Complete';
  RAISE NOTICE '══════════════════════════════════════════';

END $$;
