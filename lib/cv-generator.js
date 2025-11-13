import path from 'path';
import os from 'os';
import { readFile, writeFile as fsWriteFile, mkdtemp as fsMkdtemp } from 'fs/promises';
import { spawn } from 'child_process';
import { createReport } from 'docx-templates';
import { TemplateHandler, MimeType } from 'easy-template-x';
import { jsPDF } from 'jspdf';

const TEMPLATE_PATH = path.resolve(process.cwd(), 'lib', 'templates', 'cv-template.docx');
const EASY_TEMPLATE_PATH = path.resolve(
  process.cwd(),
  'lib',
  'templates',
  'cv-template-turkey.docx',
);

let easyTemplateBufferCache = null;
// Use default single-brace delimiters: {tag}, {#each}, {/each}
const easyTemplateHandler = new TemplateHandler();

function shouldCacheTemplateBuffer() {
  const flag = (process.env.CV_TEMPLATE_CACHE || '').toLowerCase();
  if (flag === 'on' || flag === 'true') return true;
  if (flag === 'off' || flag === 'false') return false;
  // Default: cache in production, no-cache in dev
  return process.env.NODE_ENV === 'production';
}

async function loadEasyTemplateBuffer() {
  if (easyTemplateBufferCache && shouldCacheTemplateBuffer()) {
    return easyTemplateBufferCache;
  }

  try {
    const buf = await readFile(EASY_TEMPLATE_PATH);
    easyTemplateBufferCache = shouldCacheTemplateBuffer() ? buf : null;
    return buf;
  } catch (error) {
    easyTemplateBufferCache = null;
    if (error && error.code === 'ENOENT') {
      throw new Error(
        'Easy-template-x: template not found at lib/templates/cv-template-turkey.docx. Please add the Turkey CV template.',
      );
    }
    throw error;
  }
}

function toEasyMimeType(contentType = '', url = '') {
  const ct = String(contentType || '').toLowerCase();
  const lowerUrl = String(url || '').toLowerCase();
  if (ct.includes('png') || lowerUrl.endsWith('.png')) return MimeType.Png;
  if (ct.includes('jpeg') || ct.includes('jpg') || lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
    return MimeType.Jpeg;
  }
  if (ct.includes('gif') || lowerUrl.endsWith('.gif')) return MimeType.Gif;
  if (ct.includes('bmp') || lowerUrl.endsWith('.bmp')) return MimeType.Bmp;
  if (ct.includes('svg') || lowerUrl.endsWith('.svg')) return MimeType.Svg;
  // Fallback to JPEG if unknown
  return MimeType.Jpeg;
}

async function fetchImageAsPluginContent(url, { width, height, altText } = {}) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    const format = toEasyMimeType(contentType, url);
    // easy-template-x image content
    const imageContent = {
      _type: 'image',
      source: buffer,
      format,
    };
    if (typeof width === 'number') imageContent.width = width;
    if (typeof height === 'number') imageContent.height = height;
    if (altText) imageContent.altText = altText;
    return imageContent;
  } catch (e) {
    console.warn('Failed to fetch image for template:', url, e?.message || e);
    return null;
  }
}

const SKILL_LABELS = {
  attentiveListening: 'Attentive listening and effective oral communication skills',
  problemSolving: 'Great at problem solving',
  createIdeas: 'Ability to quickly create and apply ideas and solutions',
  criticalThinker: 'Critical thinker',
  discipline: 'Discipline',
  responsible: 'Responsible',
  teamwork: 'Able to work with a team',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function safeText(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Strip characters disallowed in XML 1.0 to avoid Word repair prompts
  // Allowed: \u0009, \u000A, \u000D, and \u0020-\uD7FF, \uE000-\uFFFD
  return s.replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]/g, '');
}

function formatDate(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return DATE_FORMATTER.format(date);
  } catch (error) {
    return '';
  }
}

function formatDateOrText(value) {
  return formatDate(value) || safeText(value);
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildEducationRows(education) {
  const rows = ensureArray(education)
    .map((item) => ({
      years: safeText(item?.years),
      schoolName: safeText(item?.schoolName),
      subject: safeText(item?.subject),
      country: safeText(item?.country),
    }))
    .filter((row) => Object.values(row).some((val) => val));

  if (rows.length === 0) {
    rows.push({ years: '', schoolName: '', subject: '', country: '' });
  }

  return rows;
}

function buildWorkExperienceRows(workExperience) {
  const rows = ensureArray(workExperience)
    .map((work) => {
      const employerParts = [
        safeText(work?.employerName),
        safeText(work?.companyName),
        safeText(work?.employerAddress),
        safeText(work?.companyAddress),
        safeText(work?.employerPhone),
        safeText(work?.companyPhone),
        safeText(work?.contactPerson),
        safeText(work?.employerDetails),
      ].filter((part) => part);

      const employerDetails = employerParts.join('\n');
      return {
        dateFromFormatted: formatDateOrText(work?.dateFrom),
        dateToFormatted: formatDateOrText(work?.dateTo),
        employerDetails,
        companyName: safeText(work?.companyName),
        positionDetails: safeText(work?.positionDetails),
        reasonToLeave: safeText(work?.reasonToLeave),
        endOfContract: formatDateOrText(work?.endOfContract),
      };
    })
    .filter((row) => Object.values(row).some((val) => val));

  if (rows.length === 0) {
    rows.push({
      dateFromFormatted: '',
      dateToFormatted: '',
      employerDetails: '',
      positionDetails: '',
      reasonToLeave: '',
      endOfContract: '',
    });
  }

  return rows;
}

function buildLanguageRows(languages) {
  const rows = ensureArray(languages)
    .map((lang) => ({
      language: safeText(lang?.language),
      speaking: safeText(lang?.speaking),
      reading: safeText(lang?.reading),
      writing: safeText(lang?.writing),
      extra: safeText(lang?.extra),
    }))
    .filter((row) => Object.values(row).some((val) => val));

  if (rows.length === 0) {
    rows.push({ language: '', speaking: '', reading: '', writing: '', extra: '' });
  }

  return rows;
}

function joinColumn(rows, key) {
  if (!rows || rows.length === 0) return '';
  return rows.map((row) => safeText(row[key])).join('\n');
}

function buildComputerSkillsSummary(value) {
  if (!value) return '';
  const parts = value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter((item) => item);

  if (parts.length <= 1) {
    return value.trim();
  }

  return parts.map((item) => `- ${item}`).join('\n');
}

function buildSkillsSummary(skills = {}) {
  if (!skills || typeof skills !== 'object') {
    return '';
  }

  const active = Object.entries(SKILL_LABELS)
    .filter(([key]) => skills[key])
    .map(([, label]) => `- ${label}`);

  if (active.length === 0) {
    return 'Skills not provided.';
  }

  return active.join('\n');
}

async function fetchImageBuffer(imageUrl) {
  try {
    if (!imageUrl) return null;
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

function collectPaklaringPhotos(cvData) {
  const photos = [];
  const seen = new Set();

  ensureArray(cvData?.workExperience).forEach((work, index) => {
    const url = work?.paklaringPhotoUrl;
    if (url && !seen.has(url)) {
      photos.push({ url, index });
      seen.add(url);
    }
  });

  if (cvData?.paklaringPhotoUrl && !seen.has(cvData.paklaringPhotoUrl)) {
    photos.push({ url: cvData.paklaringPhotoUrl, index: null });
  }

  return photos;
}

function buildTemplateData(cvData = {}) {
  const education = buildEducationRows(cvData.education);
  const workExperience = buildWorkExperienceRows(cvData.workExperience);
  const languageRows = buildLanguageRows(cvData.languages);
  const computerSkillsSummary = buildComputerSkillsSummary(cvData.computerSkills);
  const skillsSummary = buildSkillsSummary(cvData.skills);

  const educationYears = joinColumn(education, 'years');
  const educationSchools = joinColumn(education, 'schoolName');
  const educationSubjects = joinColumn(education, 'subject');
  const educationCountries = joinColumn(education, 'country');

  const workDateFrom = joinColumn(workExperience, 'dateFromFormatted');
  const workDateTo = joinColumn(workExperience, 'dateToFormatted');
  const workEmployerDetails = joinColumn(workExperience, 'employerDetails');
  const workPositionDetails = joinColumn(workExperience, 'positionDetails');
  const workReasons = joinColumn(workExperience, 'reasonToLeave');
  const workEndOfContracts = joinColumn(workExperience, 'endOfContract');

  const languageNames = joinColumn(languageRows, 'language');
  const languageSpeaking = joinColumn(languageRows, 'speaking');
  const languageReading = joinColumn(languageRows, 'reading');
  const languageWriting = joinColumn(languageRows, 'writing');
  const languageExtras = joinColumn(languageRows, 'extra');

  return {
    positionApply: safeText(cvData.profession || cvData.positionApply),
    gender: safeText(cvData.gender),
    name: safeText(cvData.name),
    fatherName: safeText(cvData.fatherName),
    motherName: safeText(cvData.motherName),
    height: safeText(cvData.height),
    weight: safeText(cvData.weight),
    maritalStatus: safeText(cvData.maritalStatus),
    placeOfBirth: safeText(cvData.placeOfBirth),
    dateOfBirthFormatted: formatDateOrText(cvData.dateOfBirth),
    address: safeText(cvData.address),
    religion: safeText(cvData.religion),
    citizenship: safeText(cvData.citizenship),
    idnPassportNo: safeText(cvData.idnPassportNo),
    issueDateFormatted: formatDateOrText(cvData.issueDate),
    issuedBy: safeText(cvData.issuedBy),
    expDateFormatted: formatDateOrText(cvData.expDate),
    mobileNo: safeText(cvData.mobileNo),
    email: safeText(cvData.email),
    emergencyContactName: safeText(cvData.emergencyContactName),
    emergencyContactNumber: safeText(cvData.emergencyContactNumber),
    emergencyContactRelation: safeText(cvData.emergencyContactRelation),
    emergencyContactAddress: safeText(cvData.emergencyContactAddress),
    educationYears,
    educationSchools,
    educationSubjects,
    educationCountries,
    workDateFrom,
    workDateTo,
    workEmployerDetails,
    workPositionDetails,
    workReasons,
    workEndOfContracts,
    languageNames,
    languageSpeaking,
    languageReading,
    languageWriting,
    languageExtras,
    computerSkillsSummary,
    skillsSummary,
    photo: '',
    fullBodyPhoto: '',
    passportPhoto: '',
    paklaringPhoto: '',
  };
}

export async function generateWordCV(cvData = {}) {
  const templateBuffer = await readFile(TEMPLATE_PATH);
  const data = buildTemplateData(cvData);
  const report = await createReport({
    template: templateBuffer,
    data,
    cmdDelimiter: ['{{', '}}'],
    failFast: true,
  });

  return Buffer.isBuffer(report) ? report : Buffer.from(report);
}

// Prepare data for easy-template-x (arrays for table loops, scalars for single fields)
export function prepareEasyTemplateData(cvData = {}) {
  const education = buildEducationRows(cvData.education);
  const workExperience = buildWorkExperienceRows(cvData.workExperience);
  const languages = buildLanguageRows(cvData.languages);
  const computerSkillsSummary = buildComputerSkillsSummary(cvData.computerSkills);
  const skillsSummary = buildSkillsSummary(cvData.skills);

  // Legacy-style joined columns to allow using the same placeholders
  const educationYears = joinColumn(education, 'years');
  const educationSchools = joinColumn(education, 'schoolName');
  const educationSubjects = joinColumn(education, 'subject');
  const educationCountries = joinColumn(education, 'country');

  const workDateFrom = joinColumn(workExperience, 'dateFromFormatted');
  const workDateTo = joinColumn(workExperience, 'dateToFormatted');
  const workEmployerDetails = joinColumn(workExperience, 'employerDetails');
  const workPositionDetails = joinColumn(workExperience, 'positionDetails');
  const workReasons = joinColumn(workExperience, 'reasonToLeave');
  const workEndOfContracts = joinColumn(workExperience, 'endOfContract');

  const languageNames = joinColumn(languages, 'language');
  const languageSpeaking = joinColumn(languages, 'speaking');
  const languageReading = joinColumn(languages, 'reading');
  const languageWriting = joinColumn(languages, 'writing');
  const languageExtras = joinColumn(languages, 'extra');

  return {
    // Scalars
    positionApply: safeText(cvData.profession || cvData.positionApply),
    gender: safeText(cvData.gender),
    name: safeText(cvData.name),
    fatherName: safeText(cvData.fatherName),
    motherName: safeText(cvData.motherName),
    height: safeText(cvData.height),
    weight: safeText(cvData.weight),
    maritalStatus: safeText(cvData.maritalStatus),
    placeOfBirth: safeText(cvData.placeOfBirth),
    dateOfBirthFormatted: formatDateOrText(cvData.dateOfBirth),
    address: safeText(cvData.address),
    religion: safeText(cvData.religion),
    citizenship: safeText(cvData.citizenship),
    idnPassportNo: safeText(cvData.idnPassportNo),
    issueDateFormatted: formatDateOrText(cvData.issueDate),
    issuedBy: safeText(cvData.issuedBy),
    expDateFormatted: formatDateOrText(cvData.expDate),
    mobileNo: safeText(cvData.mobileNo),
    email: safeText(cvData.email),
    emergencyContactName: safeText(cvData.emergencyContactName),
    emergencyContactNumber: safeText(cvData.emergencyContactNumber),
    emergencyContactRelation: safeText(cvData.emergencyContactRelation),
    emergencyContactAddress: safeText(cvData.emergencyContactAddress),
    computerSkillsSummary,
    skillsSummary,

    // Arrays for loops in tables
    education,
    workExperience,
    languages,

    // Legacy-style columns (so Turkey template can reuse legacy placeholders)
    educationYears,
    educationSchools,
    educationSubjects,
    educationCountries,
    workDateFrom,
    workDateTo,
    workEmployerDetails,
    workPositionDetails,
    workReasons,
    workEndOfContracts,
    languageNames,
    languageSpeaking,
    languageReading,
    languageWriting,
    languageExtras,
  };
}

export async function generateWordCVEasy(cvData = {}) {
  const templateBuffer = await loadEasyTemplateBuffer();
  const baseData = prepareEasyTemplateData(cvData);

  // Prepare images for easy-template-x. Recommended usage: place placeholder
  // images in the doc and set their Alt Text to {photo}, {fullBodyPhoto}, {passportPhoto}
  // so size/position are preserved. Width/height below are intentionally omitted
  // to respect placeholder sizing in the template.
  const [photo, fullBodyPhoto, passportPhoto] = await Promise.all([
    fetchImageAsPluginContent(cvData?.photoUrl, { altText: 'photo' }),
    fetchImageAsPluginContent(cvData?.fullBodyPhotoUrl, { altText: 'fullBodyPhoto' }),
    fetchImageAsPluginContent(cvData?.passportPhotoUrl, { altText: 'passportPhoto' }),
  ]);

  const data = {
    ...baseData,
    ...(photo ? { photo } : {}),
    ...(fullBodyPhoto ? { fullBodyPhoto } : {}),
    ...(passportPhoto ? { passportPhoto } : {}),
  };

  const rendered = await easyTemplateHandler.process(templateBuffer, data);
  return Buffer.isBuffer(rendered) ? rendered : Buffer.from(rendered);
}

export async function generatePDFCV(cvData = {}) {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  // Base line height in points for 10–12pt body text
  const lineHeight = 16;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const availableWidth = pageWidth - margin * 2;
  let y = margin;

  function ensureSpaceHeight(height) {
    if (y + height > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  }

  function addVerticalGap(size = lineHeight) {
    ensureSpaceHeight(size);
    y += size;
  }

  function writeCentered(text, size = 20, style = 'bold') {
    // Allocate vertical space according to current font size
    const blockHeight = Math.ceil(size * 1.35);
    ensureSpaceHeight(blockHeight);
    pdf.setFontSize(size);
    pdf.setFont(undefined, style);
    pdf.text(text || '', pageWidth / 2, y, { align: 'center' });
    y += blockHeight;
  }

  function addSectionHeading(title) {
    // Add a small gap before section headings to avoid collisions
    if (y > margin) {
      addVerticalGap(lineHeight * 0.8);
    }
    const height = lineHeight * 2;
    ensureSpaceHeight(height);
    pdf.setFontSize(13);
    pdf.setFont(undefined, 'bold');
    pdf.text(String(title).toUpperCase(), margin, y);
    y += lineHeight * 0.8;
    pdf.setLineWidth(0.7);
    pdf.line(margin, y, margin + availableWidth, y);
    y += lineHeight * 0.4;
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10.5);
  }

  function getLines(text, width) {
    const content = safeText(text);
    if (!content) return [''];
    const parts = content.split('\n');
    const collected = [];
    parts.forEach((part) => {
      const split = pdf.splitTextToSize(part || ' ', width);
      if (split.length === 0) {
        collected.push('');
      } else {
        collected.push(...split);
      }
    });
    return collected.length ? collected : [''];
  }

  function drawTable(headers, rows, columnWidths) {
    if (!headers.length || !columnWidths.length) return;

    const startX = margin;
    const padding = 8;

    const headerLines = headers.map((header, idx) =>
      getLines(header, columnWidths[idx] - padding * 2),
    );
    const headerHeight =
      Math.max(...headerLines.map((lines) => lines.length || 1)) * lineHeight + padding * 2;
    ensureSpaceHeight(headerHeight);
    let x = startX;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(10.5);
    headers.forEach((header, idx) => {
      const width = columnWidths[idx];
      pdf.rect(x, y, width, headerHeight);
      let textY = y + padding + lineHeight * 0.9;
      headerLines[idx].forEach((line) => {
        pdf.text(line, x + padding, textY);
        textY += lineHeight;
      });
      x += width;
    });
    y += headerHeight;

    pdf.setFont(undefined, 'normal');
    rows.forEach((row) => {
      const lineSets = row.map((cell, idx) => getLines(cell, columnWidths[idx] - padding * 2));
      const bodyHeight =
        Math.max(...lineSets.map((lines) => lines.length || 1)) * lineHeight + padding * 2;
      ensureSpaceHeight(bodyHeight);
      x = startX;
      row.forEach((cell, idx) => {
        const width = columnWidths[idx];
        pdf.rect(x, y, width, bodyHeight);
        let textY = y + padding + lineHeight * 0.9;
        lineSets[idx].forEach((line) => {
          pdf.text(line, x + padding, textY);
          textY += lineHeight;
        });
        x += width;
      });
      y += bodyHeight;
    });
    addVerticalGap(lineHeight * 0.4);
  }

  writeCentered(safeText(cvData.name) || 'NAME', 22);
  const subtitle = safeText(cvData.profession) || safeText(cvData.positionApply) || '';
  if (subtitle) {
    writeCentered(subtitle, 14, 'italic');
  }
  const contactLines = [safeText(cvData.mobileNo), safeText(cvData.email)]
    .filter((val) => val)
    .join(' | ');
  if (contactLines) {
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(11);
    ensureSpaceHeight(lineHeight);
    pdf.text(contactLines, margin, y);
    y += lineHeight;
  }
  addVerticalGap(lineHeight * 0.6);

  addSectionHeading('Personal Details');
  const personalHeaders = ['Field', 'Value', 'Field', 'Value'];
  const personalRows = [
    ['Gender', safeText(cvData.gender), '', ''],
    ['Father’s Name', safeText(cvData.fatherName), 'Mother’s Name', safeText(cvData.motherName)],
    ['Height', safeText(cvData.height), 'Weight', safeText(cvData.weight)],
    [
      'Marital Status',
      safeText(cvData.maritalStatus),
      'Place / Date of Birth',
      [safeText(cvData.placeOfBirth), formatDateOrText(cvData.dateOfBirth)]
        .filter(Boolean)
        .join(', '),
    ],
    ['Address', safeText(cvData.address), '', ''],
    ['Religion', safeText(cvData.religion), 'Citizenship', safeText(cvData.citizenship)],
    ['Passport / ID', safeText(cvData.idnPassportNo), 'Issued By', safeText(cvData.issuedBy)],
    ['Issue Date', formatDateOrText(cvData.issueDate), 'Expiry Date', formatDateOrText(cvData.expDate)],
    ['Mobile No', safeText(cvData.mobileNo), 'Email', safeText(cvData.email)],
  ];
  const personalColumnWidths = [
    availableWidth * 0.18,
    availableWidth * 0.32,
    availableWidth * 0.18,
    availableWidth * 0.32,
  ];
  drawTable(personalHeaders, personalRows, personalColumnWidths);

  addSectionHeading('Emergency Contact');
  const emergencyHeaders = ['Name', 'Contact Number', 'Relation', 'Address'];
  const emergencyRows = [
    [
      safeText(cvData.emergencyContactName),
      safeText(cvData.emergencyContactNumber),
      safeText(cvData.emergencyContactRelation),
      safeText(cvData.emergencyContactAddress),
    ],
  ];
  const emergencyColumnWidths = [
    availableWidth * 0.22,
    availableWidth * 0.22,
    availableWidth * 0.18,
    availableWidth * 0.38,
  ];
  drawTable(emergencyHeaders, emergencyRows, emergencyColumnWidths);

  addSectionHeading('Education Details');
  const educationHeaders = ['Years', 'Name of School', 'Subject / Training', 'Country'];
  const educationRows = buildEducationRows(cvData.education).map((row) => [
    row.years,
    row.schoolName,
    row.subject,
    row.country,
  ]);
  const educationColumnWidths = [
    availableWidth * 0.18,
    availableWidth * 0.34,
    availableWidth * 0.28,
    availableWidth * 0.20,
  ];
  drawTable(educationHeaders, educationRows, educationColumnWidths);

  addSectionHeading('Work Experience');
  const workHeaders = [
    'From',
    'To',
    "Employer's Name, Address, and Phone No.",
    'Position Held and brief details of work',
    'Reason to leave / End of Contract',
  ];
  const workRows = buildWorkExperienceRows(cvData.workExperience).map((row) => [
    row.dateFromFormatted,
    row.dateToFormatted,
    row.employerDetails,
    row.positionDetails,
    [row.reasonToLeave, row.endOfContract && `End: ${row.endOfContract}`]
      .filter(Boolean)
      .join('\n'),
  ]);
  const workColumnWidths = [
    availableWidth * 0.13,
    availableWidth * 0.13,
    availableWidth * 0.30,
    availableWidth * 0.22,
    availableWidth * 0.22,
  ];
  drawTable(workHeaders, workRows, workColumnWidths);

  addSectionHeading('Languages & Computer Skills');
  const languageHeaders = ['Language', 'Speaking', 'Reading', 'Writing'];
  const languageRows = buildLanguageRows(cvData.languages).map((row) => [
    row.language,
    row.speaking,
    row.reading,
    row.writing,
  ]);
  const languageColumnWidths = [
    availableWidth * 0.28,
    availableWidth * 0.24,
    availableWidth * 0.24,
    availableWidth * 0.24,
  ];
  drawTable(languageHeaders, languageRows, languageColumnWidths);

  const computerSkillsSummary = buildComputerSkillsSummary(cvData.computerSkills);
  if (computerSkillsSummary) {
    addVerticalGap(lineHeight * 0.6);
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(11);
    ensureSpaceHeight(lineHeight);
    pdf.text('Computer Skills:', margin, y);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10.5);
    y += lineHeight;
    computerSkillsSummary.split('\n').forEach((line) => {
      ensureSpaceHeight(lineHeight);
      pdf.text(`- ${line}`, margin + 12, y);
      y += lineHeight;
    });
    addVerticalGap(lineHeight * 0.4);
  }

  addSectionHeading('Skills');
  addVerticalGap(lineHeight * 0.6);
  const skillsSummary = buildSkillsSummary(cvData.skills);
  (skillsSummary ? skillsSummary.split('\n') : ['No skills provided.']).forEach((line) => {
    ensureSpaceHeight(lineHeight);
    pdf.text(line, margin, y);
    y += lineHeight;
  });

  const docs = [];
  if (cvData.photoUrl) docs.push('Pass photo');
  if (cvData.fullBodyPhotoUrl) docs.push('Full body photo');
  if (cvData.passportPhotoUrl) docs.push('Passport photo');
  collectPaklaringPhotos(cvData).forEach((photo, index) => {
    const label =
      typeof photo.index === 'number' ? `Paklaring (${photo.index + 1})` : `Paklaring ${index + 1}`;
    docs.push(label);
  });
  if (cvData.ktpPhotoUrl) docs.push('KTP');
  if (cvData.kartuKeluargaPhotoUrl) docs.push('Kartu Keluarga');
  if (cvData.skckPhotoUrl) docs.push('SKCK');
  if (cvData.aktaKelahiranPhotoUrl) docs.push('Birth certificate');

  if (docs.length) {
    addSectionHeading('Supporting Documents');
    addVerticalGap(lineHeight * 0.6);
    const docLines = pdf.splitTextToSize(docs.join(', '), availableWidth);
    docLines.forEach((line) => {
      ensureSpaceHeight(lineHeight);
      pdf.text(line, margin, y);
      y += lineHeight;
    });
    ensureSpaceHeight(lineHeight);
    pdf.text('Note: Files are supplied separately in the download package.', margin, y);
    y += lineHeight;
  }

  return Buffer.from(pdf.output('arraybuffer'));
}

async function resolveSofficeBinary() {
  if (process.env.SOFFICE_BIN) return process.env.SOFFICE_BIN;
  const candidates = [];
  // Prefer explicit Windows paths if present
  if (process.platform === 'win32') {
    candidates.push(
      'soffice.com',
      'soffice.exe',
      'C\\\\Program Files\\\\LibreOffice\\\\program\\\\soffice.com',
      'C\\\\Program Files\\\\LibreOffice\\\\program\\\\soffice.exe',
      'C\\\\Program Files (x86)\\\\LibreOffice\\\\program\\\\soffice.com',
      'C\\\\Program Files (x86)\\\\LibreOffice\\\\program\\\\soffice.exe',
    );
  } else {
    candidates.push('soffice');
  }
  return candidates[0];
}

function spawnAsync(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'ignore', ...options });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(0);
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function convertDocxToPdfViaSoffice(docxBuffer) {
  const tmpDir = await fsMkdtemp(path.join(os.tmpdir(), 'cvpdf-'));
  const inputPath = path.join(tmpDir, 'input.docx');
  const outputPath = path.join(tmpDir, 'input.pdf');
  await fsWriteFile(inputPath, docxBuffer);
  const soffice = await resolveSofficeBinary();
  const args = [
    '--headless',
    '--nologo',
    '--nofirststartwizard',
    '--convert-to',
    'pdf:writer_pdf_Export',
    '--outdir',
    tmpDir,
    inputPath,
  ];
  await spawnAsync(soffice, args);
  const pdfBuffer = await readFile(outputPath);
  return pdfBuffer;
}

export async function generatePDFViaLibreOffice(cvData = {}) {
  // First produce a DOCX with the selected engine, then convert via LibreOffice
  const docEngine = (process.env.CV_DOC_ENGINE || 'docx-templates').toLowerCase();
  let docxBuffer;
  if (docEngine === 'easy') {
    docxBuffer = await generateWordCVEasy(cvData);
  } else {
    docxBuffer = await generateWordCV(cvData);
  }

  try {
    return await convertDocxToPdfViaSoffice(docxBuffer);
  } catch (err) {
    throw new Error('LibreOffice conversion failed: ' + (err?.message || err));
  }
}

export async function extractAndProcessImages(cvData, userName, userPhone) {
  const imageFiles = [];
  const cleanName = (userName || 'Unknown').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const cleanPhone = (userPhone || '0000000000').replace(/[^0-9]/g, '');
  const paklaringPhotos = collectPaklaringPhotos(cvData);

  async function addImageToZip(imageUrl, imageType, imageSuffix) {
    try {
      if (!imageUrl) return null;
      const response = await fetch(imageUrl);
      if (!response.ok) return null;

      const buffer = Buffer.from(await response.arrayBuffer());
      let extension = '.jpg';
      const contentType = response.headers.get('content-type') || '';
      const lowerUrl = imageUrl.toLowerCase();

      if (lowerUrl.includes('.png') || contentType.includes('png')) {
        extension = '.png';
      } else if (lowerUrl.includes('.webp') || contentType.includes('webp')) {
        extension = '.webp';
      } else if (lowerUrl.includes('.gif') || contentType.includes('gif')) {
        extension = '.gif';
      }

      const fileName = `${cleanName}_${cleanPhone}_${imageSuffix}`;
      return { fileName, buffer, type: imageType, extension };
    } catch (error) {
      console.error(`Error fetching image ${imageSuffix}:`, error);
      return null;
    }
  }

  const personalDescriptors = [
    ['photo', cvData?.photoUrl, 'passport_photo'],
    ['full_body_photo', cvData?.fullBodyPhotoUrl, 'full_body_photo'],
    ['passport_photo', cvData?.passportPhotoUrl, 'passport_photo'],
  ];

  for (const [suffix, url, type] of personalDescriptors) {
    if (!url) continue;
    const image = await addImageToZip(url, type, suffix);
    if (image) imageFiles.push(image);
  }

  if (cvData?.signatureTransparentUrl) {
    const signatureClean = await addImageToZip(
      cvData.signatureTransparentUrl,
      'signature_clean',
      'signature_transparent',
    );
    if (signatureClean) imageFiles.push(signatureClean);
  }

  if (cvData?.signatureOriginalUrl) {
    const signatureOriginal = await addImageToZip(
      cvData.signatureOriginalUrl,
      'signature_original',
      'signature_original',
    );
    if (signatureOriginal) imageFiles.push(signatureOriginal);
  }

  const documentDescriptors = [
    ['ktp', cvData?.ktpPhotoUrl, 'ktp'],
    ['kartu_keluarga', cvData?.kartuKeluargaPhotoUrl, 'kartu_keluarga'],
    ['skck', cvData?.skckPhotoUrl, 'skck'],
    ['akta_kelahiran', cvData?.aktaKelahiranPhotoUrl, 'akta_kelahiran'],
  ];

  for (const [suffix, url, type] of documentDescriptors) {
    if (!url) continue;
    const image = await addImageToZip(url, type, suffix);
    if (image) imageFiles.push(image);
  }

  for (let i = 0; i < paklaringPhotos.length; i += 1) {
    const photo = paklaringPhotos[i];
    const suffix = typeof photo.index === 'number' ? `paklaring_${photo.index + 1}` : 'paklaring';
    const image = await addImageToZip(photo.url, 'paklaring', suffix);
    if (image) imageFiles.push(image);
  }

  const educationList = ensureArray(cvData?.education);
  for (let i = 0; i < educationList.length; i += 1) {
    const edu = educationList[i];
    if (!edu?.ijazahPhotoUrl) continue;
    const image = await addImageToZip(edu.ijazahPhotoUrl, 'ijazah', `ijazah_${i + 1}`);
    if (image) imageFiles.push(image);
  }

  return imageFiles;
}

export function generateCVFileName(userName, userPhone, format = 'docx') {
  const cleanName = (userName || 'CV').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const cleanPhone = (userPhone || '0000000000').replace(/[^0-9]/g, '');
  return `${cleanName}_${cleanPhone}_CV.${format}`;
}
