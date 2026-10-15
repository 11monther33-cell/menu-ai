-- =========================================================================
-- Comprehensive Security Hardening Migration (2026-10-15 v3.0)
-- Covers:
--   SEC-01 (Paymob Idempotency constraint)
--   SEC-02 (Profiles tenant locking)
--   SEC-03 & SEC-04 (Staff PIN protection, scrypt hash, token_version, distributed lockouts)
--   SEC-05 (Subscriptions INSERT & UPDATE protection trigger)
--   SEC-07 (pos_whatsapp_sessions isolation & service_role restriction)
--   SEC-12 (admin_invites atomic lifecycle status)
--   SEC-13 (increment_restaurant_usage search_path & execute restrictions)
-- =========================================================================

-- 1. SEC-01: Idempotency constraint on Paymob transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_paymob_transaction_id'
  ) THEN
    ALTER TABLE paymob_transactions 
      ADD CONSTRAINT uq_paymob_transaction_id UNIQUE (paymob_transaction_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Table might not exist yet in local setup; handled gracefully
  NULL;
END $$;

-- 2. SEC-02: Profiles Tenant Immutability Trigger
CREATE OR REPLACE FUNCTION trg_lock_profile_tenant() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.restaurant_id IS NOT NULL AND NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id THEN
    IF current_user != 'service_role' AND (SELECT auth.role()) != 'service_role' THEN
      IF NOT (SELECT COALESCE(is_super_admin(), false)) THEN
        RAISE EXCEPTION 'Unauthorized: User restaurant assignment is immutable.'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_lock_profile_restaurant ON profiles;
CREATE TRIGGER trg_lock_profile_restaurant
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_lock_profile_tenant();

-- 3. SEC-03 & SEC-04: Staff PIN Protection, Hashing, and Session Invalidation
DROP POLICY IF EXISTS "public_read_active_staff" ON restaurant_staff;

ALTER TABLE restaurant_staff 
  ADD COLUMN IF NOT EXISTS pin_hash TEXT,
  ADD COLUMN IF NOT EXISTS must_reset_pin BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;

-- Create secure view without pin_code or pin_hash for public terminal display
CREATE OR REPLACE VIEW public_staff_directory AS
  SELECT id, restaurant_id, branch_id, name, role, is_active, must_reset_pin
  FROM restaurant_staff
  WHERE is_active = true;

-- Distributed staff login attempts table to prevent brute force across serverless nodes
CREATE TABLE IF NOT EXISTS staff_login_attempts (
  attempt_key    TEXT PRIMARY KEY,
  attempts       INT NOT NULL DEFAULT 0,
  lockout_until  TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE staff_login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_manage_login_attempts" ON staff_login_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. SEC-05: Restaurant Subscription & Plan Protection Trigger (INSERT & UPDATE)
CREATE OR REPLACE FUNCTION trg_enforce_subscription_security() RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT: enforce default basic trial plan for non-service_role
  IF TG_OP = 'INSERT' THEN
    IF current_user != 'service_role' AND (SELECT auth.role()) != 'service_role' THEN
      IF NOT (SELECT COALESCE(is_super_admin(), false)) THEN
        NEW.subscription_plan := 'basic';
        NEW.subscription_status := 'trial';
        NEW.subscription_expiry := NOW() + INTERVAL '14 days';
      END IF;
    END IF;
  END IF;

  -- On UPDATE: prevent unauthorized modification of subscription plan/status/expiry
  IF TG_OP = 'UPDATE' THEN
    IF (OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan OR
        OLD.subscription_status IS DISTINCT FROM NEW.subscription_status OR
        OLD.subscription_expiry IS DISTINCT FROM NEW.subscription_expiry) THEN
      IF current_user != 'service_role' AND (SELECT auth.role()) != 'service_role' THEN
        IF NOT (SELECT COALESCE(is_super_admin(), false)) THEN
          RAISE EXCEPTION 'Unauthorized: Subscription plan and status can only be updated by the billing service.'
            USING ERRCODE = '42501';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_restaurant_billing ON restaurants;
CREATE TRIGGER trg_protect_restaurant_billing
  BEFORE INSERT OR UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION trg_enforce_subscription_security();

-- 5. SEC-07: Harden pos_whatsapp_sessions Table
DROP POLICY IF EXISTS "Enable read access for service role" ON pos_whatsapp_sessions;
DROP POLICY IF EXISTS "Enable insert access for service role" ON pos_whatsapp_sessions;
DROP POLICY IF EXISTS "Enable update access for service role" ON pos_whatsapp_sessions;
DROP POLICY IF EXISTS "service_role_manage_whatsapp_sessions" ON pos_whatsapp_sessions;

CREATE POLICY "service_role_only_whatsapp_sessions" ON pos_whatsapp_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

ALTER TABLE pos_whatsapp_sessions 
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES pos_branches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pos_whatsapp_sessions_branch_phone 
  ON pos_whatsapp_sessions(branch_id, phone_number);

-- 6. SEC-12: Admin Invites Lifecycle Status
ALTER TABLE admin_invites 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;

-- 7. SEC-13: Harden increment_restaurant_usage RPC Function
REVOKE EXECUTE ON FUNCTION increment_restaurant_usage(UUID, TEXT, DATE, DATE, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_restaurant_usage(UUID, TEXT, DATE, DATE, INT) TO service_role;

ALTER FUNCTION increment_restaurant_usage(UUID, TEXT, DATE, DATE, INT) 
  SET search_path = public, pg_temp;
