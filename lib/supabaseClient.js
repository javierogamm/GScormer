import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Falta NEXT_PUBLIC_SUPABASE_URL. Configúrala en .env.local y en Vercel (Environment Variables).',
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Falta NEXT_PUBLIC_SUPABASE_ANON_KEY. Configúrala en .env.local y en Vercel (Environment Variables).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
