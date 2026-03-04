import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

export function getSupabaseAdminClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseServerAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseKey = supabaseServiceRoleKey || supabaseServerAnonKey;

  if (!supabaseUrl) {
    throw new Error('Falta SUPABASE_URL para inicializar Supabase en backend.');
  }

  if (!supabaseKey) {
    throw new Error('Falta clave Supabase en backend. Define SUPABASE_SERVICE_ROLE_KEY (recomendado) o SUPABASE_ANON_KEY para compatibilidad.');
  }

  cachedClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
