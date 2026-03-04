import { getSupabaseAdminClient } from './supabaseAdmin';

export function getSupabaseServerClient() {
  return getSupabaseAdminClient();
}
