import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseServerClient() {
  if (!supabaseUrl) {
    throw new Error(
      'Falta NEXT_PUBLIC_SUPABASE_URL para inicializar Supabase en el servidor.',
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Falta NEXT_PUBLIC_SUPABASE_ANON_KEY para inicializar Supabase en el servidor.',
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
