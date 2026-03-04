import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

export function getSupabaseAdminClient() {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Falta SUPABASE_URL para inicializar Supabase Admin en backend.');
  }

  if (!supabaseServiceRoleKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para inicializar Supabase Admin en backend.');
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
