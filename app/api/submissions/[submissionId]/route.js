import { NextResponse } from 'next/server';
import { requireAdminSession } from '../../../../lib/auth/requireAdminSession';
import { deleteSubmissionById } from '../../../../lib/services/submissions';

export async function DELETE(request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { submissionId } = params ?? {};

  if (!submissionId) {
    return NextResponse.json(
      { error: 'Submission ID required' },
      { status: 400 },
    );
  }

  const result = await deleteSubmissionById(submissionId);
  return NextResponse.json(result.body, { status: result.status });
}
