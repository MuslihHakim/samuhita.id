import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '../../../../../lib/auth/requireAdminSession';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const session = await requireAdminSession();
  if (!session.authenticated) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');
    const documentType = formData.get('documentType'); // 'mcu' | 'visa' | 'contract'

    // Validate inputs
    if (!file || !userId || !documentType) {
      return Response.json(
        { error: 'File, userId, and documentType are required' },
        { status: 400 }
      );
    }

    // Validate document type
    if (!['mcu', 'visa', 'contract'].includes(documentType)) {
      return Response.json(
        { error: 'Invalid document type. Must be "mcu", "visa" or "contract"' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: 'File type must be JPG, PNG, PDF, or WebP' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${userId}-${documentType}-${timestamp}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('cv-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase storage error:', error);
      return Response.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cv-photos')
      .getPublicUrl(fileName);

    return Response.json({
      success: true,
      fileUrl: publicUrl,
      fileName: fileName,
      documentType: documentType
    });

  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
