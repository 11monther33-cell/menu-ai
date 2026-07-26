-- ====================================================================
-- WHATSAPP AI SALES AGENT MIGRATION
-- "موظف مبيعات واتساب"
-- ====================================================================

-- 1. Extend pos_branches for WhatsApp Connection
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT; -- Stored encrypted at app level
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE pos_branches ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT false;

-- 2. Official Meta QR Codes Table
CREATE TABLE IF NOT EXISTS whatsapp_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  meta_qr_code_id TEXT NOT NULL,
  deep_link_url TEXT NOT NULL,
  prefilled_message TEXT,
  qr_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Branch Knowledge Base / FAQs Table
CREATE TABLE IF NOT EXISTS pos_branch_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. WhatsApp Conversations Table
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'customer' | 'ai' | 'agent'
  message_text TEXT NOT NULL,
  meta_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. POS Order Requests (from WhatsApp natural language orders)
CREATE TABLE IF NOT EXISTS pos_order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES pos_branches(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  order_summary TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  total_price NUMERIC(10,2),
  status TEXT DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled' | 'fulfilled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexing for high-performance querying
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_branch ON whatsapp_qr_codes(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_faq_branch ON pos_branch_faq(branch_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_branch ON whatsapp_conversations(branch_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_phone ON whatsapp_conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_msg_conv ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_req_branch ON pos_order_requests(branch_id);

-- Enable RLS
ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_branch_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_requests ENABLE ROW LEVEL SECURITY;

-- Allow owners & service role full access
DROP POLICY IF EXISTS "Owner manage whatsapp_qr_codes" ON whatsapp_qr_codes;
CREATE POLICY "Owner manage whatsapp_qr_codes" ON whatsapp_qr_codes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owner manage pos_branch_faq" ON pos_branch_faq;
CREATE POLICY "Owner manage pos_branch_faq" ON pos_branch_faq FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owner manage whatsapp_conversations" ON whatsapp_conversations;
CREATE POLICY "Owner manage whatsapp_conversations" ON whatsapp_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owner manage whatsapp_messages" ON whatsapp_messages;
CREATE POLICY "Owner manage whatsapp_messages" ON whatsapp_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owner manage pos_order_requests" ON pos_order_requests;
CREATE POLICY "Owner manage pos_order_requests" ON pos_order_requests FOR ALL USING (true) WITH CHECK (true);
