import { NextResponse } from 'next/server';
import { startSignatureProcessing } from '../../../lib/services/signature';

export const dynamic = 'force-dynamic';

const MAX_SIGNATURE_SIZE = 8 * 1024 * 1024;
const SIGNATURE_ALLOWED_TYPES = ['image/png', 'image/jpeg'];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Signature file is required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!SIGNATURE_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only PNG or JPG signature images are supported' }, { status: 400 });
    }

    if (file.size > MAX_SIGNATURE_SIZE) {
      return NextResponse.json({ error: 'Signature file must be under 8MB' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await startSignatureProcessing({
      userId,
      buffer,
      fileName: file.name || 'signature',
      mimeType: file.type,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Signature upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
