import { NextResponse } from 'next/server';
import { syncSheetsWithSupabase } from '../../../lib/services/googleSheets';

export async function GET() {
  const result = await syncSheetsWithSupabase();
  return NextResponse.json(result.body, { status: result.status });
}
