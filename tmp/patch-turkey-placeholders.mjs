import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

function injectAfterLabel(xml, labelText, placeholder){
  const re = new RegExp(
    String.raw`(<w:t[^>]*>` + labelText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + String.raw`<\/w:t><\/w:r><\/w:p><\/w:tc><w:tc[^>]*><w:p[^>]*>(?:<w:pPr>.*?<\/w:pPr>)?)`,
    'i'
  );
  return xml.replace(re, (m, p1) => `${p1}<w:r><w:t>{{${placeholder}}}</w:t></w:r>`);
}

function injectRowAfterHeader(xml, headerText, placeholders){
  // Find header cell, then target first data row's first N <w:tc>
  const headerIdx = xml.indexOf(`<w:t>${headerText}</w:t>`);
  if (headerIdx < 0) return xml;
  // Find the end of that header row
  const trEnd = xml.indexOf('</w:tr>', headerIdx);
  if (trEnd < 0) return xml;
  // Next row start
  const nextTrStart = xml.indexOf('<w:tr', trEnd);
  if (nextTrStart < 0) return xml;
  let pos = nextTrStart;
  let out = xml;
  for (let i=0;i<placeholders.length;i+=1){
    // find i-th cell
    const tcStart = out.indexOf('<w:tc', pos);
    if (tcStart < 0) break;
    const pStart = out.indexOf('<w:p', tcStart);
    if (pStart < 0) break;
    const afterPStart = out.indexOf('>', pStart) + 1;
    const pPrEnd = out.indexOf('</w:pPr>', afterPStart);
    const contentInsertPos = pPrEnd > 0 && pPrEnd < out.indexOf('</w:p>', afterPStart)
      ? pPrEnd + '</w:pPr>'.length
      : afterPStart;
    out = out.slice(0, contentInsertPos) + `<w:r><w:t>{{${placeholders[i]}}}</w:t></w:r>` + out.slice(contentInsertPos);
    pos = tcStart + 1;
  }
  return out;
}

async function main(){
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  const docFile = zip.file('word/document.xml');
  if(!docFile){
    console.error('document.xml not found');
    process.exit(1);
  }
  let xml = await docFile.async('string');

  // Personal details
  xml = injectAfterLabel(xml, 'Position Apply : ', 'positionApply');
  xml = injectAfterLabel(xml, 'Name:', 'name');
  xml = injectAfterLabel(xml, 'Father', 'fatherName'); // label appears as Father… Name:
  xml = injectAfterLabel(xml, 'Mother', 'motherName'); // label appears as Mother… Name:
  xml = injectAfterLabel(xml, 'Height', 'height');
  xml = injectAfterLabel(xml, 'Weight', 'weight');
  xml = injectAfterLabel(xml, 'Marital Status', 'maritalStatus');
  xml = injectAfterLabel(xml, 'Place of Birth', 'placeOfBirth');
  xml = injectAfterLabel(xml, 'Date of Birth', 'dateOfBirthFormatted');
  xml = injectAfterLabel(xml, 'Address', 'address');
  xml = injectAfterLabel(xml, 'Religion', 'religion');
  xml = injectAfterLabel(xml, 'Citizenship', 'citizenship');
  xml = injectAfterLabel(xml, 'Issue Date', 'issueDateFormatted');
  xml = injectAfterLabel(xml, 'Issued By', 'issuedBy');
  xml = injectAfterLabel(xml, 'Exp. Date', 'expDateFormatted');
  xml = injectAfterLabel(xml, 'Mobile No', 'mobileNo');
  xml = injectAfterLabel(xml, 'Email', 'email');

  // Emergency contact block
  xml = injectAfterLabel(xml, 'Emergency Contact', 'emergencyContactName');
  xml = injectAfterLabel(xml, 'Contact Number', 'emergencyContactNumber');
  xml = injectAfterLabel(xml, 'Relation', 'emergencyContactRelation');
  // Address occurs multiple times; try a second pass for emergency address if empty first
  xml = injectAfterLabel(xml, 'Address', 'emergencyContactAddress');

  // Tables (use legacy-style joined columns to avoid loop authoring now)
  xml = injectRowAfterHeader(xml, 'Years', ['educationYears','educationSchools','educationSubjects','educationCountries']);
  xml = injectRowAfterHeader(xml, 'Employer', ['workDateFrom','workDateTo','workEmployerDetails','workPositionDetails','workReasons','workEndOfContracts']);
  xml = injectRowAfterHeader(xml, 'Languages', ['languageNames','languageSpeaking','languageReading','languageWriting','languageExtras']);

  zip.file('word/document.xml', xml);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, outBuf);
  console.log('Placeholders injected into Turkey template.');
}

main().catch((e)=>{ console.error(e); process.exit(1); });
