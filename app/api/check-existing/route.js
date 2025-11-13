import { NextResponse } from 'next/server';
import { checkExistingSubmission } from '../../../lib/services/submissions';

export async function GET(request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email') || undefined;
  const phoneNumber = url.searchParams.get('phone') || undefined;

  const result = await checkExistingSubmission({ email, phoneNumber });
  return NextResponse.json(result.body, { status: result.status });
}
