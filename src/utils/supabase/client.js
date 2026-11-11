import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://moxvgzzlqkkfumzzgldw.supabase.co';

const supabaseKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  '';

export const createClient = () => {
  if (!supabaseKey) {
    console.warn('Supabase key not provided in environment variables');
  }
  return createSupabaseClient(supabaseUrl, supabaseKey);
};

export default createClient;

