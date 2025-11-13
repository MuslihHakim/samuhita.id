import { NextResponse } from 'next/server';
import { requireAdminSession } from '../../../../lib/auth/requireAdminSession';
import { fetchSubmissionByUserId } from '../../../../lib/services/admin';

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId } = body ?? {};

    const result = await fetchSubmissionByUserId(userId);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Admin submission-by-user-id route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
