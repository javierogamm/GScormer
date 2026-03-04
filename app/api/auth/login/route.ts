import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { createSessionToken, SESSION_COOKIE_NAME } from '../../../../lib/session';

const isFlagEnabled = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value || '').trim().toLowerCase();
  return ['true', 't', '1', 'yes', 'si', 'sí'].includes(normalized);
};

export async function POST(request: Request) {
  const { name, pass } = await request.json();

  const trimmedName = String(name || '').trim();
  const trimmedPass = String(pass || '').trim();

  if (!trimmedName || !trimmedPass) {
    return NextResponse.json({ error: 'Usuario y contraseña son obligatorios.' }, { status: 400 });
  }

  const response = await supabaseAdmin
    .from('scorms_users')
    .select('*')
    .eq('name', trimmedName)
    .eq('pass', trimmedPass)
    .limit(1)
    .maybeSingle();

  if (response.error || !response.data) {
    return NextResponse.json({ error: 'Credenciales no válidas.' }, { status: 401 });
  }

  const user = {
    id: response.data.id,
    name: response.data.name,
    admin: isFlagEnabled(response.data.admin),
    alertador: isFlagEnabled(response.data.alertador),
    validador: isFlagEnabled(response.data.validador),
    agent: response.data.agent || response.data.agente || '',
  };

  const sessionToken = createSessionToken(user);
  const nextResponse = NextResponse.json({ user });

  nextResponse.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  return nextResponse;
}
