import crypto from 'crypto';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../supabase';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getAdminSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export async function createAdminSession({
  adminUserId,
  ipAddress,
  userAgent,
} = {}) {
  if (!adminUserId) {
    throw new Error('adminUserId is required to create a session');
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const { error } = await supabaseAdmin
    .from('admin_sessions')
    .insert({
      admin_user_id: adminUserId,
      token_hash: tokenHash,
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('Failed to create admin session:', error);
    throw new Error('Unable to create admin session');
  }

  return { token, expiresAt };
}

export async function verifyAdminSession(token) {
  if (!token) {
    return { valid: false };
  }

  try {
    const tokenHash = hashToken(token);
    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('id, admin_user_id, expires_at')
      .eq('token_hash', tokenHash)
      .gt('expires_at', nowIso)
      .maybeSingle();

    if (error) {
      console.error('Error verifying admin session:', error);
      return { valid: false, error: 'verification_failed' };
    }

    if (!data) {
      return { valid: false };
    }

    return {
      valid: true,
      sessionId: data.id,
      adminUserId: data.admin_user_id,
      expiresAt: data.expires_at,
    };
  } catch (error) {
    console.error('verifyAdminSession exception:', error);
    return { valid: false, error: 'verification_exception' };
  }
}

export async function revokeAdminSession(token) {
  if (!token) {
    return;
  }

  try {
    const tokenHash = hashToken(token);
    const { error } = await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('token_hash', tokenHash);

    if (error) {
      console.error('Failed to revoke admin session:', error);
    }
  } catch (error) {
    console.error('revokeAdminSession exception:', error);
  }
}

export async function revokeAdminSessionById(sessionId) {
  if (!sessionId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('admin_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to revoke admin session by id:', error);
  }
}

export async function clearAdminSessions(adminUserId) {
  if (!adminUserId) {
    return;
  }

  const { error } = await supabaseAdmin
    .from('admin_sessions')
    .delete()
    .eq('admin_user_id', adminUserId);

  if (error) {
    console.error('Failed to clear admin sessions:', error);
  }
}

export async function rotateAdminSession({
  sessionId,
  adminUserId,
  ipAddress,
  userAgent,
} = {}) {
  if (!sessionId || !adminUserId) {
    throw new Error('sessionId and adminUserId are required to rotate session');
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const { error } = await supabaseAdmin
    .from('admin_sessions')
    .update({
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    })
    .eq('id', sessionId)
    .eq('admin_user_id', adminUserId);

  if (error) {
    console.error('Failed to rotate admin session:', error);
    throw new Error('Unable to rotate admin session');
  }

  return { token, expiresAt };
}

export function setAdminSessionCookie({ token, expiresAt }) {
  const cookieStore = cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  });
}

export function clearAdminSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function readAdminSessionCookie() {
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}
