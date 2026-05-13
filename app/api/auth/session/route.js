import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';
import { createSessionToken, readSessionToken, SESSION_COOKIE_NAME } from '../../../../lib/session';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const isFlagEnabled = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value || '').trim().toLowerCase();
  return ['true', 't', '1', 'yes', 'si', 'sí'].includes(normalized);
};

const buildUserSession = (userRow) => ({
  id: userRow.id,
  name: userRow.name,
  admin: isFlagEnabled(userRow.admin),
  alertador: isFlagEnabled(userRow.alertador),
  validador: isFlagEnabled(userRow.validador),
  agent: userRow.agent || userRow.agente || '',
});

const clearSessionCookie = (response) => {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });
};

export async function GET(request) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = readSessionToken(sessionToken);

    if (!session) {
      const response = NextResponse.json({ error: 'Sesión no válida.' }, { status: 401 });
      clearSessionCookie(response);
      return response;
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const userResponse = await supabaseAdmin
      .from('scorms_users')
      .select('id, name, admin, alertador, validador, agent, agente')
      .eq('id', session.id)
      .limit(1)
      .maybeSingle();

    if (userResponse.error || !userResponse.data) {
      const response = NextResponse.json({ error: 'No se pudo reconectar la sesión.' }, { status: 401 });
      clearSessionCookie(response);
      return response;
    }

    const user = buildUserSession(userResponse.data);
    const renewedToken = createSessionToken(user);
    const response = NextResponse.json({ user, refreshed: true });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: renewedToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error?.message || 'Error interno al refrescar la sesión.',
      },
      { status: 500 },
    );
  }
}
