import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { requireAdminSession } from '../../../../../lib/auth/requireAdminSession';

const PAYMENTS_PASSWORD = process.env.PAYMENTS_ACCESS_PASSWORD || 'biayakeluarnegeri';
const PAYMENTS_COOKIE_NAME = 'payments_access_token';
const PAYMENTS_COOKIE_MAX_AGE = 60 * 60; // 1 hour

function hashValue(value) {
  return createHash('sha256').update(value).digest('hex');
}

const PAYMENTS_COOKIE_VALUE = hashValue(PAYMENTS_PASSWORD);

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    // no-op, treat as missing body
  }

  const providedPassword = typeof body?.password === 'string' ? body.password.trim() : '';
  if (providedPassword !== PAYMENTS_PASSWORD) {
    return NextResponse.json({ error: 'Password salah' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(PAYMENTS_COOKIE_NAME, PAYMENTS_COOKIE_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin/payments',
    maxAge: PAYMENTS_COOKIE_MAX_AGE,
  });
  return response;
}
