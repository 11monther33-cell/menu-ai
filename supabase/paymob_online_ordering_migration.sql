-- PAYMOB ONLINE ORDERING & GOOGLE MAPS MIGRATION

-- 1. Extend pos_orders for Delivery/Pickup and Online Ordering
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS fulfillment_type TEXT NOT NULL DEFAULT 'dine_in';
-- fulfillment_type values: 'dine_in' | 'pickup' | 'delivery'
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE pos_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 2. Extend pos_branches for Paymob Credentials (Stored encrypted at app level) and Google Maps
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS paymob_api_key TEXT;
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS paymob_integration_id TEXT;
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS paymob_hmac_secret TEXT;
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS google_rating DECIMAL(3,1);
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS google_rating_count INTEGER;
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS google_rating_updated_at TIMESTAMP WITH TIME ZONE;

-- 3. Create paymob_transactions table for financial hardening and idempotency
CREATE TABLE IF NOT EXISTS paymob_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES pos_orders(id) ON DELETE CASCADE,
  paymob_transaction_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,3) NOT NULL,
  status TEXT NOT NULL, -- 'pending' | 'success' | 'failed' | 'refunded'
  raw_webhook_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_paymob_txn_order ON paymob_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_paymob_txn_ext_id ON paymob_transactions(paymob_transaction_id);

-- Enable RLS on paymob_transactions
ALTER TABLE paymob_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for paymob_transactions (Staff/Admin access)
DROP POLICY IF EXISTS "Owner manage paymob_transactions" ON paymob_transactions;
CREATE POLICY "Owner manage paymob_transactions" ON paymob_transactions 
FOR ALL USING (
  order_id IN (
    SELECT id FROM pos_orders WHERE branch_id IN (
      SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())
    )
  )
) WITH CHECK (
  order_id IN (
    SELECT id FROM pos_orders WHERE branch_id IN (
      SELECT id FROM pos_branches WHERE restaurant_id IN (SELECT get_my_restaurant_ids())
    )
  )
);

-- Service role bypasses RLS naturally, which is what the webhook will use.
