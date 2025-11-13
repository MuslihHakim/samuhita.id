import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

function stripBraceRuns(xml){
  // remove runs that are exactly '}' or '{' (with or without xml:space)
  return xml
    .replace(/<w:r>\s*<w:t(?:[^>]*)>[{}]<\/w:t>\s*<\/w:r>/g, '')
    .replace(/<w:r(?:[^>]*)>\s*<w:t(?:[^>]*)>[{}]<\/w:t>\s*<\/w:r>/g, '');
}

function insertInNextCell(xml, labelText, placeholder){
  const candidates = [
    `<w:t>${labelText}</w:t>`,
    `<w:t xml:space="preserve">${labelText}</w:t>`
  ];
  let pos = -1;
  for (const c of candidates){
    pos = xml.indexOf(c);
    if (pos >= 0) break;
  }
  if (pos < 0) return xml;
  const labelCellEnd = xml.indexOf('</w:tc>', pos);
  if (labelCellEnd < 0) return xml;
  const nextCellStart = xml.indexOf('<w:tc', labelCellEnd);
  if (nextCellStart < 0) return xml;
  const pStart = xml.indexOf('<w:p', nextCellStart);
  const afterPStart = xml.indexOf('>', pStart) + 1;
  const pEnd = xml.indexOf('</w:p>', afterPStart);
  const pPrEnd = xml.indexOf('</w:pPr>', afterPStart);
  let insertPos = afterPStart;
  if (pPrEnd > 0 && pPrEnd < pEnd) insertPos = pPrEnd + '</w:pPr>'.length;
  if (xml.slice(nextCellStart, pEnd).includes(`{{${placeholder}}}`)) return xml;
  return xml.slice(0, insertPos) + `<w:r><w:t>{{${placeholder}}}</w:t></w:r>` + xml.slice(insertPos);
}

function insertRowUnderHeader(xml, headerText, placeholders, skipCellIdx = new Set()){
  const candidates = [
    `<w:t>${headerText}</w:t>`,
    `<w:t xml:space=\"preserve\">${headerText}</w:t>`
  ];
  let headPos = -1;
  for (const c of candidates){
    headPos = xml.indexOf(c);
    if (headPos >= 0) break;
  }
  if (headPos < 0) return xml;
  const headTrEnd = xml.indexOf('</w:tr>', headPos);
  const nextTrStart = xml.indexOf('<w:tr', headTrEnd);
  const nextTrEnd = xml.indexOf('</w:tr>', nextTrStart);
  let cellPos = nextTrStart;
  let out = xml;
  let cellIdx = 0;
  for (let i=0;i<placeholders.length;i+=1){
    const ph = placeholders[i];
    let tcStart = out.indexOf('<w:tc', cellPos);
    if (tcStart < 0 || tcStart > nextTrEnd) break;
    while (skipCellIdx.has(cellIdx)){
      cellIdx++;
      tcStart = out.indexOf('<w:tc', tcStart + 1);
      if (tcStart < 0 || tcStart > nextTrEnd) return out;
    }
    const pStart = out.indexOf('<w:p', tcStart);
    const afterPStart = out.indexOf('>', pStart) + 1;
    const pEnd = out.indexOf('</w:p>', afterPStart);
    const pPrEnd = out.indexOf('</w:pPr>', afterPStart);
    let insertPos = afterPStart;
    if (pPrEnd > 0 && pPrEnd < pEnd) insertPos = pPrEnd + '</w:pPr>'.length;
    if (ph && !out.slice(tcStart, pEnd).includes(`{{${ph}}}`)){
      out = out.slice(0, insertPos) + `<w:r><w:t>{{${ph}}}</w:t></w:r>` + out.slice(insertPos);
    }
    cellIdx++;
    cellPos = tcStart + 1;
  }
  return out;
}

async function main(){
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');

  // 1) Strip stray single-brace runs
  xml = stripBraceRuns(xml);

  // 2) Insert scalars cleanly in data cells
  const pairs = [
    ['Position Apply : ', 'positionApply'],
    ['Name:', 'name'],
    ['Father', 'fatherName'],
    ['Mother', 'motherName'],
    ['Height', 'height'],
    ['Weight', 'weight'],
    ['Marital Status', 'maritalStatus'],
    ['Place of Birth', 'placeOfBirth'],
    ['Date of Birth', 'dateOfBirthFormatted'],
    ['Address:', 'address'],
    ['Religion', 'religion'],
    ['Citizenship', 'citizenship'],
    ['Issue Date', 'issueDateFormatted'],
    ['Issued By', 'issuedBy'],
    ['Exp. Date', 'expDateFormatted'],
    ['Mobile No', 'mobileNo'],
    ['Email', 'email'],
    // Emergency contact block
    ['Emergency Contact', 'emergencyContactName'],
    ['Contact Number', 'emergencyContactNumber'],
    ['Relation', 'emergencyContactRelation'],
  ];
  for (const [label, ph] of pairs){
    xml = insertInNextCell(xml, label, ph);
  }
  // Ensure emergency address exists in that Address cell only
  xml = insertInNextCell(xml, 'Address', 'emergencyContactAddress');

  // 3) Rows
  xml = insertRowUnderHeader(xml, 'Years', ['educationYears','educationSchools','educationSubjects','educationCountries']);
  xml = insertRowUnderHeader(xml, 'From', ['workDateFrom','workDateTo',null,'workPositionDetails','workReasons','workEndOfContracts'], new Set([2]));
  xml = insertRowUnderHeader(xml, 'Language', ['languageNames','languageSpeaking','languageReading','languageWriting','languageExtras']);

  zip.file('word/document.xml', xml);
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, out);
  console.log('Normalized Turkey template: cleaned braces and placed placeholders.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
