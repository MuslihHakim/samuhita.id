import { NextResponse } from 'next/server';
import { requireAdminSession } from '../../../../lib/auth/requireAdminSession';
import { purgeSubmissions } from '../../../../lib/services/submissions';

export async function DELETE(request) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const emailPattern = url.searchParams.get('emailPattern') || undefined;

  const result = await purgeSubmissions({ emailPattern });
  return NextResponse.json(result.body, { status: result.status });
}
