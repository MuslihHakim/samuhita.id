import { NextResponse } from 'next/server';
import { testSheetsConnectivity } from '../../../lib/services/googleSheets';

export async function GET() {
  const result = await testSheetsConnectivity();
  return NextResponse.json(result.body, { status: result.status });
}
