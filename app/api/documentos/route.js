import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { readSessionToken, SESSION_COOKIE_NAME } from '../../../lib/session';

export async function GET(request) {
  const sessionToken = request.headers
    .get('cookie')
    ?.split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split('=')[1];

  const session = readSessionToken(sessionToken);

  if (!session) {
    return NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('documentos')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
