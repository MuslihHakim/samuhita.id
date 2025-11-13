import { supabase, supabaseAdmin } from './supabase-server';
import {
  generateWordCV,
  generateWordCVEasy,
  generatePDFCV,
  generatePDFViaLibreOffice,
  extractAndProcessImages,
  generateCVFileName,
} from '../cv-generator';

export {
  generateWordCV,
  generatePDFCV,
  extractAndProcessImages,
  generateCVFileName,
};

const SIGNATURE_STATUS_VALUES = new Set(['idle', 'processing', 'ready', 'failed', 'completed']);

function normalizeSignatureState(status) {
  if (!status) return null;
  const lower = String(status).toLowerCase();
  if (SIGNATURE_STATUS_VALUES.has(lower)) {
    return lower === 'completed' ? 'ready' : lower;
  }
  return null;
}

export async function saveCvData(userId, cvData) {
  if (!userId) {
    return {
      status: 400,
      body: { error: 'User ID required' },
    };
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    return {
      status: 400,
      body: { error: 'Invalid user ID format' },
    };
  }

  const cleanCvData = sanitizeCvPayload(cvData);

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('cv_data')
      .select('id')
      .eq('userId', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('CV fetch error:', fetchError);
      return {
        status: 500,
        body: { error: 'Failed to save CV data: ' + fetchError.message },
      };
    }

    const payload = { ...cleanCvData, updatedAt: new Date().toISOString() };

    let result;
    if (existing) {
      result = await supabase
        .from('cv_data')
        .update(payload)
        .eq('userId', userId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('cv_data')
        .insert([{ userId, ...payload }])
        .select()
        .single();
    }

    if (result.error) {
      console.error('CV save error:', result.error);
      return {
        status: 500,
        body: { error: 'Failed to save CV data: ' + result.error.message },
      };
    }

    // Sync profession to submissions for this user (if available)
    try {
      const submissionUpdates = {};
      const professionValue = cleanCvData.profession || cleanCvData.positionApply || null;
      if (professionValue !== undefined) {
        submissionUpdates.profession = professionValue || null;
      }

      const normalizedName =
        typeof cleanCvData.name === 'string' ? cleanCvData.name : '';
      if (normalizedName) {
        submissionUpdates.fullName = normalizedName;
      }

      if (Object.keys(submissionUpdates).length > 0) {
        await supabaseAdmin
          .from('submissions')
          .update(submissionUpdates)
          .eq('userId', userId);
      }
    } catch (syncErr) {
      console.warn('Submission field sync skipped:', syncErr?.message || syncErr);
    }

    return {
      status: 200,
      body: {
        success: true,
        message: 'CV saved successfully',
        data: result.data,
      },
    };
  } catch (error) {
    console.error('CV save exception:', error);
    return {
      status: 500,
      body: { error: 'Internal server error: ' + error.message },
    };
  }
}

export async function fetchCvData(userId) {
  if (!userId) {
    return {
      status: 400,
      body: { error: 'User ID required' },
    };
  }

  try {
    const [cvResult, submissionResult] = await Promise.all([
      supabase.from('cv_data').select('*').eq('userId', userId).single(),
      supabase
        .from('submissions')
        .select('fullName, email, phoneNumber')
        .eq('userId', userId)
        .single(),
    ]);

    const { data, error } = cvResult;
    const {
      data: submission,
      error: submissionError,
    } = submissionResult;

    if (error && error.code !== 'PGRST116') {
      console.error('CV fetch error:', error);
      return {
        status: 500,
        body: { error: 'Failed to fetch CV data' },
      };
    }

    if (submissionError && submissionError.code !== 'PGRST116') {
      console.warn('Submission lookup for CV fallback failed:', submissionError);
    }

    const responseBody = data ? { ...data } : {};
    const hasCvRecord = Boolean(data?.id);

    const submissionName =
      typeof submission?.fullName === 'string'
        ? submission.fullName.trim()
        : '';
    const submissionEmail =
      typeof submission?.email === 'string' ? submission.email.trim() : '';
    const submissionPhone =
      typeof submission?.phoneNumber === 'string'
        ? submission.phoneNumber.trim()
        : '';

    const applyIfMissing = (value, key) => {
      if (!value) return;
      const current = responseBody[key];
      if (current == null) {
        responseBody[key] = value;
        return;
      }
      if (typeof current === 'string' && current.trim().length === 0) {
        responseBody[key] = value;
      }
    };

    applyIfMissing(submissionName, 'name');
    applyIfMissing(submissionEmail, 'email');
    applyIfMissing(submissionPhone, 'mobileNo');

    return {
      status: 200,
      body: {
        ...responseBody,
        cvExists: hasCvRecord,
      },
    };
  } catch (error) {
    console.error('CV fetch exception:', error);
    return {
      status: 500,
      body: { error: 'Internal server error' },
    };
  }
}

export async function buildCvArchive(userId, format = 'pdf') {
  if (!userId) {
    return {
      status: 400,
      body: { error: 'User ID required' },
    };
  }

  if (!['pdf', 'word'].includes(format)) {
    return {
      status: 400,
      body: { error: 'Invalid format. Use "word" or "pdf"' },
    };
  }

  try {
    const { data: cvData, error: cvError } = await supabase
      .from('cv_data')
      .select('*')
      .eq('userId', userId)
      .single();

    if (cvError || !cvData) {
      return {
        status: 404,
        body: { error: 'CV data not found. Please complete your CV first.' },
      };
    }

    let userName = cvData.name || 'Unknown';
    let userPhone = cvData.mobileNo || '0000000000';

    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
        userId,
      );
      if (userData?.user?.user_metadata?.username) {
        userName = userData.user.user_metadata.username;
      }
      if (userData?.user?.user_metadata?.phone_number) {
        userPhone = userData.user.user_metadata.phone_number;
      }
    } catch (userError) {
      console.warn('Could not fetch user metadata:', userError);
    }

    const JSZip = await import('jszip');
    const zip = new JSZip.default();

    let cvBuffer;
    let selectedEngine = null;
    let fallbackUsed = false;
    if (format === 'word') {
      const docEngine = (process.env.CV_DOC_ENGINE || 'docx-templates').toLowerCase();
      const noFallback = String(process.env.CV_NO_FALLBACK || 'false').toLowerCase() === 'true';
      try {
        if (docEngine === 'easy') {
          cvBuffer = await generateWordCVEasy(cvData);
          selectedEngine = 'easy';
        } else {
          cvBuffer = await generateWordCV(cvData);
          selectedEngine = 'docx-templates';
        }
      } catch (err) {
        console.error('Word generation error (engine=' + docEngine + '):', err);
        if (docEngine === 'easy' && !noFallback) {
          // Fallback to legacy engine only if allowed
          cvBuffer = await generateWordCV(cvData);
          selectedEngine = 'docx-templates';
          fallbackUsed = true;
        } else {
          throw err;
        }
      }
    } else {
      const pdfEngine = (process.env.PDF_ENGINE || 'jspdf').toLowerCase();
      try {
        if (pdfEngine === 'libreoffice' || pdfEngine === 'docx') {
          cvBuffer = await generatePDFViaLibreOffice(cvData);
          selectedEngine = 'pdf:libreoffice';
        } else {
          cvBuffer = await generatePDFCV(cvData);
          selectedEngine = 'pdf:jspdf';
        }
      } catch (err) {
        console.error('PDF generation error (engine=' + pdfEngine + '):', err);
        if (pdfEngine !== 'jspdf') {
          cvBuffer = await generatePDFCV(cvData);
          selectedEngine = 'pdf:jspdf';
          fallbackUsed = true;
        } else {
          throw err;
        }
      }
    }

    const cvFileName = generateCVFileName(
      userName,
      userPhone,
      format === 'word' ? 'docx' : 'pdf',
    );
    zip.file(cvFileName, cvBuffer);

    const imageFiles = await extractAndProcessImages(cvData, userName, userPhone);
    for (const imageFile of imageFiles) {
      const extension = imageFile.extension || '.jpg';
      zip.file(`${imageFile.fileName}${extension}`, imageFile.buffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const filename = `CV_${userName.replace(/\s+/g, '_')}_${format.toUpperCase()}_${
      new Date().toISOString().split('T')[0]
    }.zip`;

    return {
      status: 200,
      buffer: zipBuffer,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        ...(selectedEngine ? { 'X-CV-Engine': selectedEngine } : {}),
        ...(format === 'word' && selectedEngine ? { 'X-CV-Fallback': String(fallbackUsed) } : {}),
        ...(format === 'pdf' && selectedEngine ? { 'X-PDF-Fallback': String(fallbackUsed) } : {}),
      },
    };
  } catch (error) {
    console.error('CV generation error:', error);
    return {
      status: 500,
      body: { error: 'Failed to generate CV: ' + error.message },
    };
  }
}

function sanitizeCvPayload(cvData = {}) {
  const clean = { ...cvData };
  delete clean.cvExists;

  if (typeof clean.name === 'string') {
    clean.name = clean.name.trim();
  }

  clean.dateOfBirth = clean.dateOfBirth || null;
  clean.issueDate = clean.issueDate || null;
  clean.expDate = clean.expDate || null;

  if (clean.workExperience && Array.isArray(clean.workExperience)) {
    clean.workExperience = clean.workExperience.map((work) => {
      const current = work || {};
      const { employerDetails: _omitEmployer, ...rest } = current;

      return {
        ...rest,
        dateFrom: current.dateFrom || null,
        dateTo: current.dateTo || null,
        endOfContract: current.endOfContract || null,
        paklaringPhotoUrl: current.paklaringPhotoUrl || null,
      };
    });
  }

  if (Object.prototype.hasOwnProperty.call(clean, 'paklaringPhotoUrl')) {
    delete clean.paklaringPhotoUrl;
  }

  const normalizedSignatureStatus = normalizeSignatureState(clean.signatureStatus);
  clean.signatureStatus = normalizedSignatureStatus;
  clean.signatureJobId = clean.signatureJobId || null;
  clean.signatureOriginalUrl = clean.signatureOriginalUrl || null;
  clean.signatureTransparentUrl = clean.signatureTransparentUrl || null;
  clean.signatureError = clean.signatureError || null;
  clean.signatureUpdatedAt = clean.signatureUpdatedAt || null;

  return clean;
}
