-- ============================================================
-- Migration: restaurant_staff table (PIN-based, no email)
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS restaurant_staff (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  branch_id       UUID REFERENCES pos_branches(id) ON DELETE SET NULL,
  name            VARCHAR(100) NOT NULL,
  role            TEXT NOT NULL DEFAULT 'cashier'
                    CHECK (role IN ('cashier', 'chef', 'waiter', 'branch_manager')),
  pin_code        VARCHAR(6) NOT NULL,
  permissions     JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_staff_restaurant_id
  ON restaurant_staff(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_staff_branch_id
  ON restaurant_staff(branch_id);

ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_owner_manage_staff"
  ON restaurant_staff
  FOR ALL
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "super_admin_read_all_staff"
  ON restaurant_staff
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
  );

-- Policy: allow public to read active staff list for the PIN login terminal
CREATE POLICY "public_read_active_staff"
  ON restaurant_staff
  FOR SELECT
  USING (is_active = true);
