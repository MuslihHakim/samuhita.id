import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

async function loadXml(){
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml').async('string');
  return { zip, docXml };
}

function insertInNextCell(xml, labelText, placeholder){
  const labelPos = xml.indexOf(`<w:t>${labelText}</w:t>`);
  const labelPresPos = labelPos >=0 ? labelPos : xml.indexOf(`<w:t xml:space="preserve">${labelText}</w:t>`);
  const pos = labelPresPos >= 0 ? labelPresPos : labelPos;
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
  const headPos = xml.indexOf(`<w:t>${headerText}</w:t>`);
  const headPos2 = headPos >= 0 ? headPos : xml.indexOf(`<w:t xml:space="preserve">${headerText}</w:t>`);
  const pos = headPos2 >= 0 ? headPos2 : headPos;
  if (pos < 0) return xml;
  const headTrEnd = xml.indexOf('</w:tr>', pos);
  const nextTrStart = xml.indexOf('<w:tr', headTrEnd);
  const nextTrEnd = xml.indexOf('</w:tr>', nextTrStart);
  let cellPos = nextTrStart;
  let out = xml;
  let cellIdx = 0;
  for (let i=0;i<placeholders.length;i+=1){
    const ph = placeholders[i];
    // Advance to next cell, skipping as needed
    let tcStart = out.indexOf('<w:tc', cellPos);
    if (tcStart < 0 || tcStart > nextTrEnd) break;
    while (skipCellIdx.has(cellIdx)){
      cellIdx++;
      tcStart = out.indexOf('<w:tc', tcStart + 1);
      if (tcStart < 0 || tcStart > nextTrEnd) return out;
    }
    if (!ph) { cellIdx++; cellPos = tcStart + 1; continue; }
    const pStart = out.indexOf('<w:p', tcStart);
    const afterPStart = out.indexOf('>', pStart) + 1;
    const pEnd = out.indexOf('</w:p>', afterPStart);
    const pPrEnd = out.indexOf('</w:pPr>', afterPStart);
    let insertPos = afterPStart;
    if (pPrEnd > 0 && pPrEnd < pEnd) insertPos = pPrEnd + '</w:pPr>'.length;
    if (!out.slice(tcStart, pEnd).includes(`{{${ph}}}`)){
      out = out.slice(0, insertPos) + `<w:r><w:t>{{${ph}}}</w:t></w:r>` + out.slice(insertPos);
    }
    cellIdx++;
    cellPos = tcStart + 1;
  }
  return out;
}

async function main(){
  const { zip, docXml } = await loadXml();
  let xml = docXml;
  // Personal details scalars
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
    ['Emergency Contact', 'emergencyContactName'],
    ['Contact Number', 'emergencyContactNumber'],
    ['Relation', 'emergencyContactRelation'],
  ];
  for (const [label, ph] of pairs){
    xml = insertInNextCell(xml, label, ph);
  }
  // Emergency address
  xml = insertInNextCell(xml, 'Address', 'emergencyContactAddress');
  // Education
  xml = insertRowUnderHeader(xml, 'Years', ['educationYears','educationSchools','educationSubjects','educationCountries']);
  // Work experience (skip Employer column)
  xml = insertRowUnderHeader(xml, 'From', ['workDateFrom','workDateTo',null,'workPositionDetails','workReasons','workEndOfContracts'], new Set([2]));
  // Languages
  xml = insertRowUnderHeader(xml, 'Language', ['languageNames','languageSpeaking','languageReading','languageWriting','languageExtras']);

  zip.file('word/document.xml', xml);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, outBuf);
  console.log('Re-injected placeholders cleanly.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
