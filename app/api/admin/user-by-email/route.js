import { NextResponse } from 'next/server';
import { requireAdminSession } from '../../../../lib/auth/requireAdminSession';
import { fetchAdminUserByEmail } from '../../../../lib/services/admin';

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { email } = body ?? {};

    const result = await fetchAdminUserByEmail(email);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Admin user-by-email route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
