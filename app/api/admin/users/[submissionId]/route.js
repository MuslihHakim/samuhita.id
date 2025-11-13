import { NextResponse } from 'next/server';
import { requireAdminSession } from '../../../../../lib/auth/requireAdminSession';
import { deleteUserAndData } from '../../../../../lib/services/admin';

export async function DELETE(_request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { submissionId } = params ?? {};

  if (!submissionId) {
    return NextResponse.json({ error: 'Submission ID is required.' }, { status: 400 });
  }

  const result = await deleteUserAndData(submissionId);
  return NextResponse.json(result.body, { status: result.status });
}
