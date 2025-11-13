import { uploadCvAsset, getCvAssetPublicUrl } from './storage';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function uploadCvFile({ file, userId, fileType }) {
  if (!file || !userId) {
    return {
      status: 400,
      body: { error: 'File and userId required' },
    };
  }

  const isVideo = fileType === 'video45Detik';

  if (isVideo) {
    if (file.type !== 'video/mp4') {
      return {
        status: 400,
        body: { error: 'Only MP4 video files are allowed for Video 45 Detik' },
      };
    }

    if (file.size > MAX_VIDEO_SIZE) {
      return {
        status: 400,
        body: { error: 'Video file size must be less than 100MB' },
      };
    }
  } else {
    if (!file.type?.startsWith('image/')) {
      return {
        status: 400,
        body: { error: 'Only image files are allowed' },
      };
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return {
        status: 400,
        body: { error: 'Image file size must be less than 10MB' },
      };
    }
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${userId}/${fileType}-${Date.now()}-${file.name}`;

    const { error } = await uploadCvAsset(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (error) {
      console.error('Upload error:', error);
      return {
        status: 500,
        body: { error: 'Failed to upload file' },
      };
    }

    const { data: publicData } = getCvAssetPublicUrl(fileName);

    return {
      status: 200,
      body: {
        success: true,
        url: publicData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      status: 500,
      body: { error: 'Internal server error' },
    };
  }
}
