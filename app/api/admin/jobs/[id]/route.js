import { NextResponse } from 'next/server';
import { getJobById, updateJob, deleteJob } from '../../../../../lib/services/jobs';
import { requireAdminSession } from '../../../../../lib/auth/requireAdminSession';

export async function GET(_request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = params || {};
  const result = await getJobById(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PUT(request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const payload = await request.json();
    const { id } = params || {};
    const result = await updateJob(id, payload);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = params || {};
  const result = await deleteJob(id);
  return NextResponse.json(result.body, { status: result.status });
}

