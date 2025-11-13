import { NextResponse } from 'next/server';
import { requireAdminSession } from '../../../../../lib/auth/requireAdminSession';
import { fetchCredentialsForSubmission } from '../../../../../lib/services/admin';

export async function GET(request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { submissionId } = params ?? {};

  const result = await fetchCredentialsForSubmission(submissionId);
  return NextResponse.json(result.body, { status: result.status });
}
