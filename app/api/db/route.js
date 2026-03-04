import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { readSessionToken, SESSION_COOKIE_NAME } from '../../../lib/session';

export async function POST(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionCookie = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split('=')[1];

  const session = readSessionToken(sessionCookie);

  if (!session) {
    return NextResponse.json({ error: { message: 'Sesión no válida.' } }, { status: 401 });
  }

  const body = await request.json();
  if (!body?.table || !body?.action) {
    return NextResponse.json({ error: { message: 'Petición incompleta.' } }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();
  let query = supabaseAdmin.from(body.table);

  if (body.action === 'select') {
    query = query.select(body.select || '*');
  } else if (body.action === 'insert') {
    query = query.insert(body.payload);
  } else if (body.action === 'update') {
    query = query.update(body.payload);
  } else if (body.action === 'delete') {
    query = query.delete();
  }

  for (const filter of body.filters || []) {
    if (filter.type === 'eq') {
      query = query.eq(filter.column, filter.value);
    }
    if (filter.type === 'in' && Array.isArray(filter.value)) {
      query = query.in(filter.column, filter.value);
    }
  }

  for (const order of body.orders || []) {
    query = query.order(order.column, { ascending: order.ascending !== false });
  }

  if (typeof body.limit === 'number') {
    query = query.limit(body.limit);
  }

  if (body.select && body.action !== 'select') {
    query = query.select(body.select);
  }

  if (body.expect === 'single') {
    query = query.single();
  }
  if (body.expect === 'maybeSingle') {
    query = query.maybeSingle();
  }

  const response = await query;
  return NextResponse.json(response);
}
