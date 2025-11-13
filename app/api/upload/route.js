import { NextResponse } from 'next/server';
import { uploadCvFile } from '../../../lib/services/uploads';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const fileType = formData.get('fileType');

    const result = await uploadCvFile({ file, userId, fileType });
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Upload route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
