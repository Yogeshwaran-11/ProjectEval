import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pbfnhqmzypydhqsuxqur.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isKeyValid = supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' && 
  supabaseAnonKey.length > 20;

export const supabase = isKeyValid 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = Boolean(supabase);

console.log(
  isSupabaseConfigured 
    ? '✅ Connected to Supabase Cloud' 
    : 'ℹ️ Running in Local Interactive Mode (Supabase URL ready at ' + supabaseUrl + ')'
);
