import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co';

if (!isConfigured) {
  // 🔒 Don't log credential status to console
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: isConfigured, // Don't try to persist if not configured
    }
  }
);

export const isSupabaseConfigured = !!isConfigured;
