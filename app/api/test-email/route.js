import { NextResponse } from 'next/server';
import { sendTestCredentialsEmail } from '../../../lib/services/email';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name } = body ?? {};

    const result = await sendTestCredentialsEmail({ email, name });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Test email route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
