import { supabaseAdmin } from './supabase-server';
import { uploadCvAsset, getCvAssetPublicUrl } from './storage';

const SIGNATURE_ALLOWED_STATUSES = new Set(['idle', 'processing', 'ready', 'failed', 'completed', 'pending']);
const SIGNATURE_STATUS_MAP = {
  completed: 'ready',
  pending: 'processing',
};

const SIGNATURE_SERVICE_TIMEOUT_MS = 20000;
const SIGNATURE_SERVICE_URL = process.env.SIGNATURE_SERVICE_URL;

function normalizeStatus(status) {
  if (!status) return 'idle';
  const lower = String(status).toLowerCase();
  return SIGNATURE_STATUS_MAP[lower] || (SIGNATURE_ALLOWED_STATUSES.has(lower) ? lower : 'idle');
}

function buildStoragePaths(userId, extension) {
  const timestamp = Date.now();
  const sanitizedExt = extension.startsWith('.') ? extension.slice(1) : extension;
  const ext = sanitizedExt || 'png';
  const basePath = `signatures/${userId}`;
  return {
    originalPath: `${basePath}/original-${timestamp}.${ext}`,
    processedPath: `${basePath}/transparent-${timestamp}.png`,
  };
}

async function ensureCvData(userId, payload) {
  const now = new Date().toISOString();
  const dataWithTimestamp = {
    ...payload,
    signatureUpdatedAt: payload.signatureUpdatedAt ?? now,
  };

  const { data: existing } = await supabaseAdmin
    .from('cv_data')
    .select('id')
    .eq('userId', userId)
    .maybeSingle();

  if (existing?.id) {
    await supabaseAdmin
      .from('cv_data')
      .update(dataWithTimestamp)
      .eq('userId', userId);
    return existing.id;
  }

  const insertPayload = {
    userId,
    ...dataWithTimestamp,
    createdAt: now,
  };

  const { data: inserted } = await supabaseAdmin
    .from('cv_data')
    .insert([insertPayload])
    .select('id')
    .single();

  return inserted?.id || null;
}

async function callSignatureService(buffer, mimeType) {
  if (!SIGNATURE_SERVICE_URL) {
    throw new Error('Signature service URL is not configured.');
  }

  const endpoint = SIGNATURE_SERVICE_URL.replace(/\/+$/, '') + '/process';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SIGNATURE_SERVICE_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
      },
      body: buffer,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Signature service error (${response.status}): ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    return {
      buffer: Buffer.from(arrayBuffer),
      contentType,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function getPublicUrl(path) {
  if (!path) return null;
  const { data } = getCvAssetPublicUrl(path);
  return data?.publicUrl || null;
}

async function updateJob(jobId, changes) {
  const payload = {
    ...changes,
    updatedAt: new Date().toISOString(),
  };

  await supabaseAdmin
    .from('signature_jobs')
    .update(payload)
    .eq('id', jobId);
}

async function processSignatureJob(jobRecord, { buffer, mimeType }) {
  try {
    const processed = await callSignatureService(buffer, mimeType);
    const { processedPath } = buildStoragePaths(jobRecord.userId, 'png');

    const storeResult = await uploadCvAsset(processedPath, processed.buffer, {
      contentType: processed.contentType || 'image/png',
      upsert: true,
    });

    if (storeResult.error) {
      throw new Error(storeResult.error.message || 'Failed to store processed signature');
    }

    const transparentUrl = getPublicUrl(processedPath);

    await updateJob(jobRecord.id, {
      status: 'completed',
      processedPath,
      error: null,
    });

    await ensureCvData(jobRecord.userId, {
      signatureTransparentUrl: transparentUrl,
      signatureStatus: 'ready',
      signatureError: null,
      signatureJobId: jobRecord.id,
    });

    return transparentUrl;
  } catch (error) {
    console.error('Signature processing error:', error);
    await updateJob(jobRecord.id, {
      status: 'failed',
      error: error.message,
    });

    await ensureCvData(jobRecord.userId, {
      signatureStatus: 'failed',
      signatureError: error.message,
      signatureJobId: jobRecord.id,
    });

    return null;
  }
}

export async function startSignatureProcessing({ userId, buffer, fileName, mimeType }) {
  if (!userId) {
    return {
      status: 400,
      body: { error: 'User ID is required' },
    };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return {
      status: 400,
      body: { error: 'Invalid user ID format' },
    };
  }

  const extensionFromMime = mimeType === 'image/png' ? 'png' : 'jpg';
  const { originalPath } = buildStoragePaths(userId, extensionFromMime);

  const uploadResult = await uploadCvAsset(originalPath, buffer, {
    contentType: mimeType,
    upsert: true,
  });

  if (uploadResult.error) {
    console.error('Signature original upload error:', uploadResult.error);
    return {
      status: 500,
      body: { error: 'Failed to store original signature' },
    };
  }

  const originalUrl = getPublicUrl(originalPath);
  const now = new Date().toISOString();

  const { data: jobRecord, error: jobError } = await supabaseAdmin
    .from('signature_jobs')
    .insert([
      {
        userId,
        status: 'processing',
        originalPath,
        originalFileName: fileName || null,
        mimeType: mimeType || null,
        createdAt: now,
        updatedAt: now,
      },
    ])
    .select('*')
    .single();

  if (jobError) {
    console.error('Signature job creation error:', jobError);
    return {
      status: 500,
      body: { error: 'Failed to record signature job' },
    };
  }

  await ensureCvData(userId, {
    signatureOriginalUrl: originalUrl,
    signatureTransparentUrl: null,
    signatureStatus: 'processing',
    signatureError: null,
    signatureJobId: jobRecord.id,
    signatureUpdatedAt: now,
  });

  // Fire-and-forget background processing
  processSignatureJob(jobRecord, { buffer, mimeType }).catch((error) => {
    console.error('Signature background processing failed:', error);
  });

  return {
    status: 202,
    body: {
      success: true,
      jobId: jobRecord.id,
      status: 'processing',
      originalUrl,
      transparentUrl: null,
      updatedAt: now,
      message: 'Signature upload received. Processing has started.',
    },
  };
}

export async function getSignatureStatus({ userId, jobId }) {
  if (!jobId) {
    return {
      status: 400,
      body: { error: 'Job ID is required' },
    };
  }

  const { data: jobRecord, error: jobError } = await supabaseAdmin
    .from('signature_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  if (jobError) {
    console.error('Signature job fetch error:', jobError);
    return {
      status: 500,
      body: { error: 'Failed to fetch signature job' },
    };
  }

  if (!jobRecord) {
    return {
      status: 404,
      body: { error: 'Signature job not found' },
    };
  }

  if (userId && jobRecord.userId !== userId) {
    return {
      status: 403,
      body: { error: 'Not authorized to view this job' },
    };
  }

  const { data: cvData } = await supabaseAdmin
    .from('cv_data')
    .select('signatureOriginalUrl, signatureTransparentUrl, signatureStatus, signatureError, signatureUpdatedAt, signatureJobId')
    .eq('userId', jobRecord.userId)
    .maybeSingle();

  const normalizedStatus = normalizeStatus(cvData?.signatureStatus || jobRecord.status);

  return {
    status: 200,
    body: {
      jobId: jobRecord.id,
      status: normalizedStatus,
      originalUrl: cvData?.signatureOriginalUrl || getPublicUrl(jobRecord.originalPath),
      transparentUrl: cvData?.signatureTransparentUrl || getPublicUrl(jobRecord.processedPath),
      error: cvData?.signatureError || jobRecord.error || null,
      updatedAt: cvData?.signatureUpdatedAt || jobRecord.updatedAt,
    },
  };
}
