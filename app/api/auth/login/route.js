import { NextResponse } from 'next/server';
import { login } from '../../../../lib/services/auth';
import {
  clearAdminSessionCookie,
  createAdminSession,
  setAdminSessionCookie,
} from '../../../../lib/auth/adminSession';

export async function POST(request) {
  const body = await request.json();
  const { username, password, isAdmin } = body ?? {};

  const result = await login({ username, password, isAdmin });

  if (result.status === 200 && result.body?.user?.isAdmin) {
    try {
      const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
      const ipAddress = forwardedFor.split(',')[0]?.trim() || null;
      const userAgent = request.headers.get('user-agent') ?? null;

      const session = await createAdminSession({
        adminUserId: result.body.user.id,
        ipAddress,
        userAgent,
      });

      setAdminSessionCookie(session);
    } catch (error) {
      console.error('Failed to issue admin session:', error);
      return NextResponse.json(
        { error: 'Failed to establish admin session' },
        { status: 500 },
      );
    }
  } else {
    clearAdminSessionCookie();
  }

  return NextResponse.json(result.body, { status: result.status });
}
