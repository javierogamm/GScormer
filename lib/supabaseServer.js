import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseServerClient() {
  if (!supabaseUrl) {
    throw new Error(
      'Falta SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL para inicializar Supabase en el servidor.',
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Falta SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY para inicializar Supabase en el servidor.',
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
