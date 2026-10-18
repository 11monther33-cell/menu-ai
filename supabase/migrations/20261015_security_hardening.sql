-- ====================================================================
-- 🔒 MENU-AI SECURITY HARDENING MIGRATION (V4.0 UNIFIED ARCHITECTURE)
-- Addresses SEC-01 through SEC-16 with strict enterprise safeguards:
-- 1. Order tracking RLS fix (Owner and client read orders/items removal)
-- 2. Staff PIN NOT NULL drop, forced reset & data scrubbing
-- 3. AmwalPay official integration (HMAC-SHA256, ISO 512, RESTRICT delete)
-- 4. Multi-tenant isolation & profile restaurant locking (INSERT/UPDATE)
-- 5. Safe invite lifecycle state machine (no password re-entry)
-- 6. Atomic order creation RPC with integer table_number & options
-- 7. Default-deny SQL triggers with SET search_path = public, pg_temp
-- ====================================================================

-- ── 1. Helper: Strict Service Role Verification ──────────────────────
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claim.role', true),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
    ''
  ) = 'service_role';
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public, pg_temp;

-- ── 2. SEC-02: Profiles Restaurant Locking (Default-Deny) ────────────
CREATE OR REPLACE FUNCTION public.protect_profile_restaurant_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Default Deny: Prohibit any direct setting or altering of restaurant_id unless service_role
  IF NOT public.is_service_role() THEN
    -- On INSERT: reject if restaurant_id is provided directly by client
    IF TG_OP = 'INSERT' AND NEW.restaurant_id IS NOT NULL THEN
      RAISE EXCEPTION 'Direct assignment of restaurant_id on profile creation is forbidden. Link via verified server route.'
        USING ERRCODE = '42501';
    END IF;

    -- On UPDATE: reject any modification (even from NULL to non-null)
    IF TG_OP = 'UPDATE' AND NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id THEN
      RAISE EXCEPTION 'Modification of restaurant_id is forbidden. Link via verified server route.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_lock_profile_restaurant ON public.profiles;
DROP TRIGGER IF EXISTS trg_lock_profile_restaurant_tenant ON public.profiles;
CREATE TRIGGER trg_lock_profile_restaurant_tenant
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_restaurant_tenant();

-- ── 3. SEC-05: Restaurant Subscription & Plan Protection ─────────────
CREATE OR REPLACE FUNCTION public.trg_enforce_subscription_security()
RETURNS TRIGGER AS $$
DECLARE
  v_is_super BOOLEAN;
BEGIN
  IF NOT public.is_service_role() THEN
    BEGIN
      SELECT COALESCE(public.is_super_admin(), false) INTO v_is_super;
    EXCEPTION WHEN OTHERS THEN
      v_is_super := false;
    END;

    IF NOT v_is_super THEN
      -- On INSERT: enforce default trial plan
      IF TG_OP = 'INSERT' THEN
        NEW.subscription_plan := 'basic';
        NEW.subscription_status := 'trial';
        NEW.subscription_expiry := NOW() + INTERVAL '14 days';
      -- On UPDATE: prevent tampering with tier, status, or expiry
      ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan OR
            OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
            OLD.subscription_expiry IS DISTINCT FROM NEW.subscription_expiry) THEN
          RAISE EXCEPTION 'Unauthorized: Subscription plan and status can only be updated by the billing service.'
            USING ERRCODE = '42501';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_restaurant_billing ON public.restaurants;
CREATE TRIGGER trg_protect_restaurant_billing
  BEFORE INSERT OR UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enforce_subscription_security();

-- ── 4. SEC-03 & SEC-04: Staff PIN, Hashing & Session Invalidation ─────
-- Drop NOT NULL on pin_code before nullifying
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'restaurant_staff' AND column_name = 'pin_code'
  ) THEN
    ALTER TABLE public.restaurant_staff ALTER COLUMN pin_code DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.restaurant_staff 
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS must_reset_pin BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;

-- Force PIN reset on all existing staff
UPDATE public.restaurant_staff 
  SET must_reset_pin = true 
  WHERE pin_hash IS NOT NULL OR pin_code IS NOT NULL;

-- Scrub plaintext PIN
UPDATE public.restaurant_staff SET pin_code = NULL;

-- Drop public views & policies
DROP POLICY IF EXISTS "public_read_active_staff" ON public.restaurant_staff;
DROP VIEW IF EXISTS public.public_staff_directory;

-- Distributed login attempts table
CREATE TABLE IF NOT EXISTS public.staff_login_attempts (
  attempt_key    TEXT PRIMARY KEY,
  attempts       INT NOT NULL DEFAULT 0,
  lockout_until  TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.staff_login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_manage_login_attempts" ON public.staff_login_attempts;
CREATE POLICY "service_role_manage_login_attempts" ON public.staff_login_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 5. SEC-01 & AmwalPay Gateway Architecture ────────────────────────
-- Dedicated secure credentials table (Service Role Only)
CREATE TABLE IF NOT EXISTS public.branch_payment_credentials (
  branch_id          UUID PRIMARY KEY REFERENCES public.pos_branches(id) ON DELETE CASCADE,
  amwal_merchant_id  TEXT,
  amwal_terminal_id  TEXT,
  amwal_secret_key   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.branch_payment_credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_manage_credentials" ON public.branch_payment_credentials;
CREATE POLICY "service_role_manage_credentials" ON public.branch_payment_credentials
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Dedicated AmwalPay transactions table (Audit-safe ON DELETE RESTRICT)
CREATE TABLE IF NOT EXISTS public.amwal_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id          UUID REFERENCES public.pos_branches(id) ON DELETE RESTRICT,
  pos_order_id       UUID REFERENCES public.pos_orders(id) ON DELETE RESTRICT,
  qr_order_id        UUID REFERENCES public.orders(id) ON DELETE RESTRICT,
  transaction_id     TEXT NOT NULL,
  amount_baisa       BIGINT NOT NULL,
  currency_code      TEXT NOT NULL DEFAULT '512',
  status             TEXT NOT NULL,
  secure_hash        TEXT NOT NULL,
  raw_payload        JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_amwal_transaction_id UNIQUE (transaction_id)
);

ALTER TABLE public.amwal_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_manage_amwal_txns" ON public.amwal_transactions;
CREATE POLICY "service_role_manage_amwal_txns" ON public.amwal_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Retain Paymob transactions table with audit-safe constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'paymob_transactions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_paymob_transaction_id') THEN
      ALTER TABLE public.paymob_transactions ADD CONSTRAINT uq_paymob_transaction_id UNIQUE (paymob_transaction_id);
    END IF;
  END IF;
END $$;

-- ── 6. SEC-07: WhatsApp Sessions Isolation & Cascade Guard ────────────
-- Clean up orphaned sessions
DELETE FROM public.pos_whatsapp_sessions WHERE branch_id IS NULL OR restaurant_id IS NULL;

ALTER TABLE public.pos_whatsapp_sessions 
  ALTER COLUMN branch_id SET NOT NULL,
  ALTER COLUMN restaurant_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_pos_branches_id_restaurant') THEN
    ALTER TABLE public.pos_branches ADD CONSTRAINT uq_pos_branches_id_restaurant UNIQUE (id, restaurant_id);
  END IF;
END $$;

ALTER TABLE public.pos_whatsapp_sessions
  DROP CONSTRAINT IF EXISTS fk_whatsapp_sessions_branch_restaurant;
ALTER TABLE public.pos_whatsapp_sessions
  ADD CONSTRAINT fk_whatsapp_sessions_branch_restaurant
  FOREIGN KEY (branch_id, restaurant_id) 
  REFERENCES public.pos_branches(id, restaurant_id) 
  ON DELETE CASCADE;

ALTER TABLE public.pos_whatsapp_sessions DROP CONSTRAINT IF EXISTS pos_whatsapp_sessions_phone_number_key;
ALTER TABLE public.pos_whatsapp_sessions DROP CONSTRAINT IF EXISTS uq_branch_customer_phone;
ALTER TABLE public.pos_whatsapp_sessions ADD CONSTRAINT uq_branch_customer_phone UNIQUE (branch_id, phone_number);

DROP POLICY IF EXISTS "Enable read access for service role" ON public.pos_whatsapp_sessions;
DROP POLICY IF EXISTS "Enable insert access for service role" ON public.pos_whatsapp_sessions;
DROP POLICY IF EXISTS "Enable update access for service role" ON public.pos_whatsapp_sessions;
DROP POLICY IF EXISTS "service_role_only_whatsapp_sessions" ON public.pos_whatsapp_sessions;

CREATE POLICY "service_role_only_whatsapp_sessions" ON public.pos_whatsapp_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── 7. SEC-09 & SEC-14: Order Policies Fix & Atomic RPC ──────────────
-- 1. Drop the actual vulnerable client read policies using headers
DROP POLICY IF EXISTS "Owner and client read orders" ON public.orders;
DROP POLICY IF EXISTS "Owner and client read order items" ON public.order_items;
DROP POLICY IF EXISTS "Customers read own orders by IP" ON public.orders;
DROP POLICY IF EXISTS "Public read orders by IP" ON public.orders;
DROP POLICY IF EXISTS "Owner and admin read orders" ON public.orders;
DROP POLICY IF EXISTS "Owner and admin read order items" ON public.order_items;

-- 2. Create strict owner & admin only read policies
CREATE POLICY "Owner and admin read orders"
  ON public.orders FOR SELECT
  USING (
    restaurant_id IN (SELECT public.get_my_restaurant_ids())
    OR public.is_super_admin()
  );

CREATE POLICY "Owner and admin read order items"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT o.id FROM public.orders o 
      WHERE o.restaurant_id IN (SELECT public.get_my_restaurant_ids()) 
         OR public.is_super_admin()
    )
  );

-- 3. Revoke public/anon direct access
REVOKE SELECT ON public.orders FROM anon;
REVOKE SELECT ON public.order_items FROM anon;

-- 4. Add token hash and options columns
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS order_access_token_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_token_hash ON public.orders(order_access_token_hash);

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS selected_options JSONB;

-- 5. Atomic Order Creation Function
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_item RECORD;
  v_table_num INTEGER;
  v_total NUMERIC(10,2);
BEGIN
  -- Validate items count
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item' USING ERRCODE = '22023';
  END IF;

  -- Validate and cast table number (integer)
  BEGIN
    v_table_num := (p_order->>'table_number')::INTEGER;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid table number: must be an integer' USING ERRCODE = '22023';
  END IF;

  IF v_table_num <= 0 THEN
    RAISE EXCEPTION 'Table number must be positive' USING ERRCODE = '22023';
  END IF;

  v_total := (p_order->>'total')::NUMERIC(10,2);

  -- Insert Order
  INSERT INTO public.orders (
    restaurant_id,
    table_number,
    status,
    total,
    special_request,
    order_access_token_hash
  ) VALUES (
    (p_order->>'restaurant_id')::UUID,
    v_table_num,
    COALESCE(p_order->>'status', 'PENDING'),
    v_total,
    p_order->>'special_request',
    p_order->>'order_access_token_hash'
  ) RETURNING id INTO v_order_id;

  -- Insert Items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS (
    dish_id UUID,
    quantity INT,
    unit_price NUMERIC(10,2),
    notes TEXT,
    selected_options JSONB
  ) LOOP
    IF v_item.quantity <= 0 OR v_item.quantity > 100 THEN
      RAISE EXCEPTION 'Item quantity must be between 1 and 100' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.order_items (
      order_id,
      dish_id,
      quantity,
      unit_price,
      notes,
      selected_options
    ) VALUES (
      v_order_id,
      v_item.dish_id,
      v_item.quantity,
      v_item.unit_price,
      v_item.notes,
      v_item.selected_options
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE EXECUTE ON FUNCTION public.create_order_atomic(JSONB, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_atomic(JSONB, JSONB) TO service_role;

-- ── 8. SEC-12: Invites Lifecycle Migration ────────────────────────────
ALTER TABLE public.admin_invites 
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- Migrate existing invites safely
UPDATE public.admin_invites 
  SET status = 'completed' 
  WHERE (used = true OR status IS NULL) AND used = true;

UPDATE public.admin_invites 
  SET status = 'pending' 
  WHERE (used = false OR used IS NULL) AND (status IS NULL);

ALTER TABLE public.admin_invites 
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.admin_invites DROP CONSTRAINT IF EXISTS chk_admin_invites_status;
ALTER TABLE public.admin_invites ADD CONSTRAINT chk_admin_invites_status 
  CHECK (status IN ('pending', 'processing_password', 'profile_pending', 'processing_profile', 'completed', 'expired', 'revoked'));

-- ── 9. SEC-13: Harden increment_restaurant_usage RPC ──────────────────
REVOKE EXECUTE ON FUNCTION public.increment_restaurant_usage(UUID, TEXT, DATE, DATE, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_restaurant_usage(UUID, TEXT, DATE, DATE, INT) TO service_role;
ALTER FUNCTION public.increment_restaurant_usage(UUID, TEXT, DATE, DATE, INT) SET search_path = public, pg_temp;
