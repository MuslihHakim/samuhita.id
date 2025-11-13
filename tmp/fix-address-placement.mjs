import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

async function main(){
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');

  // 1) Remove accidental personal address inside emergency block: drop {{address}} when it immediately follows {{emergencyContactAddress}}
  xml = xml.replace(/\{\{emergencyContactAddress\}\}<\/w:t><\/w:r><w:r><w:t>\{\{address\}\}/g, '{{emergencyContactAddress}}');

  // 2) Ensure personal Address in personal-details section is present next to the first 'Address' label before 'Emergency Contact'
  const emergencyIdx = xml.indexOf('Emergency Contact');
  const searchStart = 0;
  const addrLabel = 'Address';
  let addrIdx = xml.indexOf(`<w:t>${addrLabel}</w:t>`, searchStart);
  let inserted = false;
  while (addrIdx !== -1 && addrIdx < emergencyIdx) {
    // Check if next cell contains {{address}}
    const labelCellEnd = xml.indexOf('</w:tc>', addrIdx);
    if (labelCellEnd === -1) break;
    const nextCellStart = xml.indexOf('<w:tc', labelCellEnd);
    if (nextCellStart === -1) break;
    const nextCellEnd = xml.indexOf('</w:tc>', nextCellStart);
    const nextCellXml = xml.slice(nextCellStart, nextCellEnd);
    if (!nextCellXml.includes('{{address}}')) {
      // insert at start of its first paragraph after <w:p...>
      const pStart = xml.indexOf('<w:p', nextCellStart);
      const afterPStart = xml.indexOf('>', pStart) + 1;
      const pEnd = xml.indexOf('</w:p>', afterPStart);
      const pPrEnd = xml.indexOf('</w:pPr>', afterPStart);
      let insertPos = afterPStart;
      if (pPrEnd > 0 && pPrEnd < pEnd) insertPos = pPrEnd + '</w:pPr>'.length;
      xml = xml.slice(0, insertPos) + '<w:r><w:t>{{address}}</w:t></w:r>' + xml.slice(insertPos);
      inserted = true;
      break;
    }
    addrIdx = xml.indexOf(`<w:t>${addrLabel}</w:t>`, addrIdx + 1);
  }

  zip.file('word/document.xml', xml);
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, out);
  console.log('Fixed address placement in Turkey template.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
