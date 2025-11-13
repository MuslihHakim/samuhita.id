import { NextResponse } from 'next/server';
import {
  clearAdminSessionCookie,
  readAdminSessionCookie,
  revokeAdminSession,
} from '../../../../lib/auth/adminSession';

export async function POST() {
  const token = readAdminSessionCookie();

  if (token) {
    await revokeAdminSession(token);
  }

  clearAdminSessionCookie();

  return NextResponse.json({ success: true });
}
