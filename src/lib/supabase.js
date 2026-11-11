import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://moxvgzzlqkkfumzzgldw.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  '';

const isKeyValid = supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key_here' && 
  supabaseAnonKey.length > 20;

export const createClient = () => {
  return isKeyValid ? createSupabaseClient(supabaseUrl, supabaseAnonKey) : null;
};

export const supabase = isKeyValid 
  ? createSupabaseClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = Boolean(supabase);

console.log(
  isSupabaseConfigured 
    ? '✅ Connected to Supabase Cloud (' + supabaseUrl + ')' 
    : 'ℹ️ Running in Local Interactive Mode (Supabase URL ready at ' + supabaseUrl + ')'
);
