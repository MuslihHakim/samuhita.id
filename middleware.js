import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'admin_session';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PAYMENTS_COOKIE_NAME = 'payments_access_token';
const PAYMENTS_PASSWORD = process.env.PAYMENTS_ACCESS_PASSWORD || 'biayakeluarnegeri';

async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyAdminSession(token) {
  if (!token || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { valid: false };
  }

  try {
    const tokenHash = await hashToken(token);
    const nowIso = new Date().toISOString();

    const url = new URL('/rest/v1/admin_sessions', SUPABASE_URL);
    url.searchParams.set('select', 'id,admin_user_id,expires_at');
    url.searchParams.set('token_hash', `eq.${tokenHash}`);
    url.searchParams.set('expires_at', `gt.${nowIso}`);
    url.searchParams.set('limit', '1');

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Failed to verify admin session via middleware:', response.status);
      return { valid: false };
    }

    const data = await response.json();
    const session = Array.isArray(data) ? data[0] : null;
    if (!session) {
      return { valid: false };
    }

    return { valid: true };
  } catch (error) {
    console.error('Middleware admin session verification error:', error);
    return { valid: false };
  }
}

function unauthorizedResponse(request, { isPage }) {
  if (isPage) {
    const loginUrl = new URL('/login', request.url);
    if (request.nextUrl.pathname && request.nextUrl.pathname !== '/login') {
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    }
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

function paymentsUnauthorizedResponse(request) {
  const redirectUrl = new URL('/admin', request.url);
  redirectUrl.searchParams.set('paymentsAuth', 'required');
  if (request.nextUrl.pathname && request.nextUrl.pathname !== '/admin') {
    redirectUrl.searchParams.set('paymentsRedirect', request.nextUrl.pathname);
  }
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (request.method === 'OPTIONS') {
    return NextResponse.next();
  }

  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/admin/session')) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return unauthorizedResponse(request, { isPage: isAdminPage });
  }

  const verification = await verifyAdminSession(sessionCookie);
  if (!verification.valid) {
    return unauthorizedResponse(request, { isPage: isAdminPage });
  }

  if (pathname.startsWith('/admin/payments')) {
    const paymentsCookie = request.cookies.get(PAYMENTS_COOKIE_NAME)?.value;
    if (!paymentsCookie) {
      return paymentsUnauthorizedResponse(request);
    }

    const expectedPaymentsHash = await hashToken(PAYMENTS_PASSWORD);
    if (paymentsCookie !== expectedPaymentsHash) {
      return paymentsUnauthorizedResponse(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
