import { NextResponse } from 'next/server';
import { initDatabaseSQL } from '../../../lib/init-db';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Please run this SQL in Supabase SQL Editor',
    sql: initDatabaseSQL,
    url: 'https://supabase.com/dashboard/project/erdtyrhjktnewrvyuwqv/sql',
  });
}
