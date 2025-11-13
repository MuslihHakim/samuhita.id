import { NextResponse } from 'next/server';
import { createAdminUser } from '../../../lib/services/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, username, password } = body ?? {};

    const result = await createAdminUser({ email, username, password });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Init admin route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
