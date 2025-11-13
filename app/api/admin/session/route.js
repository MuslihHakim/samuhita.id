import { NextResponse } from 'next/server';
import {
  rotateAdminSession,
  setAdminSessionCookie,
} from '../../../../lib/auth/adminSession';
import { requireAdminSession } from '../../../../lib/auth/requireAdminSession';
import { fetchAdminUserById } from '../../../../lib/services/admin';

export async function GET(request) {
  const session = await requireAdminSession();

  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.refreshNeeded) {
    try {
      const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
      const ipAddress = forwardedFor.split(',')[0]?.trim() || null;
      const userAgent = request.headers.get('user-agent') ?? null;

      const rotated = await rotateAdminSession({
        sessionId: session.sessionId,
        adminUserId: session.adminUserId,
        ipAddress,
        userAgent,
      });

      setAdminSessionCookie(rotated);
    } catch (error) {
      console.error('Failed to rotate admin session token:', error);
    }
  }

  const adminUser = await fetchAdminUserById(session.adminUserId);
  if (adminUser.status !== 200) {
    return NextResponse.json(adminUser.body, { status: adminUser.status });
  }

  return NextResponse.json({
    success: true,
    user: adminUser.body,
  });
}
