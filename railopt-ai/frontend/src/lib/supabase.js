import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[RailOpt AI] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Configure these in your Vercel Project Environment Variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

