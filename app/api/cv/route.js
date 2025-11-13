import { NextResponse } from 'next/server';
import { saveCvData, fetchCvData } from '../../../lib/services/cv';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, ...cvData } = body ?? {};

    const result = await saveCvData(userId, cvData);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('CV POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  const result = await fetchCvData(userId || undefined);
  return NextResponse.json(result.body, { status: result.status });
}
