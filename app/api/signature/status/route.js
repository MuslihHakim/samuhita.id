import { NextResponse } from 'next/server';
import { getSignatureStatus } from '../../../../lib/services/signature';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const userId = url.searchParams.get('userId') || undefined;

    const result = await getSignatureStatus({ userId, jobId });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Signature status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
