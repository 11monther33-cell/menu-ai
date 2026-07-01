import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function addColumns() {
  const query = `
    ALTER TABLE dishes
    ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS calories NUMERIC,
    ADD COLUMN IF NOT EXISTS protein NUMERIC,
    ADD COLUMN IF NOT EXISTS carbs NUMERIC,
    ADD COLUMN IF NOT EXISTS fat NUMERIC,
    ADD COLUMN IF NOT EXISTS taste_tags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS mood_tags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS prep_time_min INTEGER DEFAULT 15,
    ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS is_chef_special BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS stock_count INTEGER,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
  `;

  // We can't execute raw SQL easily using the JS client without an RPC function
  // Is there a way to do it via REST? Not really.
}
addColumns();
