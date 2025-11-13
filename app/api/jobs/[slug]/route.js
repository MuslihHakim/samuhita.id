import { NextResponse } from 'next/server';

export async function GET(_request, { params }) {
  try {
    const { slug } = params || {};
    if (!slug) return NextResponse.json({ error: 'Slug required' }, { status: 400 });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const { getJobBySlug } = await import('../../../../lib/services/jobs');
    const result = await getJobBySlug(slug);
    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
