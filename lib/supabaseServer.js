import { supabaseAdmin } from './supabaseAdmin';

export function getSupabaseServerClient() {
  return supabaseAdmin;
}
