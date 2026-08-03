CREATE TABLE IF NOT EXISTS pos_whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL UNIQUE,
    facts JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE pos_whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users (and service role) to read/write for now, or just public for the edge function
CREATE POLICY "Enable read access for service role" ON pos_whatsapp_sessions
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert access for service role" ON pos_whatsapp_sessions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update access for service role" ON pos_whatsapp_sessions
    FOR UPDATE
    USING (true);
