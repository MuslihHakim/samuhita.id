import { NextResponse } from 'next/server';
import { createJob } from '../../../../lib/services/jobs';
import { requireAdminSession } from '../../../../lib/auth/requireAdminSession';

export async function GET(request) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
  const sortBy = (url.searchParams.get('sortBy') || 'updatedAt');
  const sortDir = (url.searchParams.get('sortDir') || 'desc');
  const status = url.searchParams.get('status') || undefined; // 'draft' | 'published'
  const search = url.searchParams.get('search') || undefined;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ items: [], page, total: 0, hasMore: false }, { status: 200 });
  }
  const { adminListJobs } = await import('../../../../lib/services/jobs');
  const result = await adminListJobs({ page, limit, sortBy, sortDir, status, search });
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const payload = await request.json();
    const result = await createJob(payload, { adminUserId: session.adminUserId });
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
