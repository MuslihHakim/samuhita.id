import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

function injectByScan(xml, label, placeholder){
  let idx = xml.indexOf(`<w:t>${label}</w:t>`);
  if (idx < 0) {
    idx = xml.indexOf(`<w:t xml:space="preserve">${label}</w:t>`);
  }
  if (idx < 0) return xml; // label not found
  const labelCellEnd = xml.indexOf('</w:tc>', idx);
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
  const docFile = zip.file('word/document.xml');
  let xml = await docFile.async('string');

  const pairs = [
    ['Position Apply : ', 'positionApply'],
    ['Name:', 'name'],
    ["Father", 'fatherName'],
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
    ['Emergency Contact', 'emergencyContactName'],
    ['Contact Number', 'emergencyContactNumber'],
    ['Relation', 'emergencyContactRelation'],
  ];

  for(const [label, ph] of pairs){
    xml = injectByScan(xml, label, ph);
  }
  // Emergency address: try a second Address injection after emergency block by scanning from that area
  xml = injectByScan(xml, 'Address', 'address');
  xml = injectByScan(xml, 'Address', 'emergencyContactAddress');

  zip.file('word/document.xml', xml);
  const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, outBuf);
  console.log('Scalars injected.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
