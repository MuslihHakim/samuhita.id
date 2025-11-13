import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

async function main(){
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');

  // Find personal Address: 'Address:' before Emergency Contact
  const emergencyIdx = xml.indexOf('Emergency Contact');
  const addrIdx = xml.indexOf('<w:t>Address:</w:t>');
  if (addrIdx !== -1 && addrIdx < emergencyIdx){
    const labelCellEnd = xml.indexOf('</w:tc>', addrIdx);
    const nextCellStart = xml.indexOf('<w:tc', labelCellEnd);
    const pStart = xml.indexOf('<w:p', nextCellStart);
    const afterPStart = xml.indexOf('>', pStart) + 1;
    const pEnd = xml.indexOf('</w:p>', afterPStart);
    const pPrEnd = xml.indexOf('</w:pPr>', afterPStart);
    let insertPos = afterPStart;
    if (pPrEnd > 0 && pPrEnd < pEnd) insertPos = pPrEnd + '</w:pPr>'.length;
    if (!xml.slice(nextCellStart, pEnd).includes('{{address}}')){
      xml = xml.slice(0, insertPos) + '<w:r><w:t>{{address}}</w:t></w:r>' + xml.slice(insertPos);
      console.log('Inserted personal address placeholder');
    } else {
      console.log('Personal address already present');
    }
  } else {
    console.log('Could not locate personal address label before emergency block');
  }

  zip.file('word/document.xml', xml);
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, out);
}

main().catch(e=>{ console.error(e); process.exit(1); });
