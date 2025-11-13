import {
  readAdminSessionCookie,
  verifyAdminSession,
} from './adminSession';

const SESSION_REFRESH_THRESHOLD_MS = 1000 * 60 * 60 * 24; // 24 hours

function shouldRefreshSession(expiresAt) {
  if (!expiresAt) {
    return false;
  }

  const expiresTime = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresTime)) {
    return false;
  }

  return expiresTime - Date.now() < SESSION_REFRESH_THRESHOLD_MS;
}

export async function requireAdminSession() {
  const token = readAdminSessionCookie();

  if (!token) {
    return { authenticated: false };
  }

  const verification = await verifyAdminSession(token);

  if (!verification.valid) {
    return { authenticated: false };
  }

  return {
    authenticated: true,
    sessionToken: token,
    sessionId: verification.sessionId,
    adminUserId: verification.adminUserId,
    expiresAt: verification.expiresAt,
    refreshNeeded: shouldRefreshSession(verification.expiresAt),
  };
}
