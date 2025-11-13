import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

function injectByContains(xml, labelSubstr, placeholder){
  const labelPos = xml.indexOf(labelSubstr);
  if (labelPos < 0) return xml;
  // find nearest opening <w:t ...> before labelPos
  const tOpenPos = xml.lastIndexOf('<w:t', labelPos);
  const tClosePos = xml.indexOf('</w:t>', labelPos);
  if (tOpenPos < 0 || tClosePos < 0) return xml;
  const labelCellEnd = xml.indexOf('</w:tc>', tClosePos);
  if (labelCellEnd < 0) return xml;
  const nextCellStart = xml.indexOf('<w:tc', labelCellEnd);
  if (nextCellStart < 0) return xml;
  const pStart = xml.indexOf('<w:p', nextCellStart);
  if (pStart < 0) return xml;
  const afterPStart = xml.indexOf('>', pStart) + 1;
  const pEnd = xml.indexOf('</w:p>', afterPStart);
  const pPrEnd = xml.indexOf('</w:pPr>', afterPStart);
  let insertPos = afterPStart;
  if (pPrEnd > 0 && pPrEnd < pEnd) insertPos = pPrEnd + '</w:pPr>'.length;
  const run = `<w:r><w:t>{{${placeholder}}}</w:t></w:r>`;
  return xml.slice(0, insertPos) + run + xml.slice(insertPos);
}

async function main(){
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');

  const toInject = [
    ['Father', 'fatherName'],
    ['Mother', 'motherName'],
    ['Height', 'height'],
    ['Weight', 'weight'],
    ['Marital Status', 'maritalStatus'],
    ['Place of Birth', 'placeOfBirth'],
    ['Date of Birth', 'dateOfBirthFormatted'],
    ['Religion', 'religion'],
    ['Citizenship', 'citizenship'],
    ['Issue Date', 'issueDateFormatted'],
    ['Issued By', 'issuedBy'],
    ['Exp. Date', 'expDateFormatted'],
    ['Mobile No', 'mobileNo'],
    ['Email', 'email'],
  ];
  for (const [label, ph] of toInject){
    // skip if already present
    if (xml.includes(`{{${ph}}}`)) continue;
    xml = injectByContains(xml, label, ph);
  }

  zip.file('word/document.xml', xml);
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, out);
  console.log('Additional scalars injected.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
