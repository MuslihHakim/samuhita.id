import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

function injectRowAfterHeader(xml, headerText, placeholders){
  const headerIdx = xml.indexOf(`<w:t>${headerText}</w:t>`);
  if (headerIdx < 0) return xml;
  const trEnd = xml.indexOf('</w:tr>', headerIdx);
  if (trEnd < 0) return xml;
  const nextTrStart = xml.indexOf('<w:tr', trEnd);
  if (nextTrStart < 0) return xml;
  let pos = nextTrStart;
  let out = xml;
  for (let i=0;i<placeholders.length;i+=1){
    const tcStart = out.indexOf('<w:tc', pos);
    if (tcStart < 0) break;
    const pStart = out.indexOf('<w:p', tcStart);
    if (pStart < 0) break;
    const afterPStart = out.indexOf('>', pStart) + 1;
    const pEnd = out.indexOf('</w:p>', afterPStart);
    const pPrEnd = out.indexOf('</w:pPr>', afterPStart);
    let insertPos = afterPStart;
    if (pPrEnd > 0 && pPrEnd < pEnd) insertPos = pPrEnd + '</w:pPr>'.length;
    const run = `<w:r><w:t>{{${placeholders[i]}}}</w:t></w:r>`;
    out = out.slice(0, insertPos) + run + out.slice(insertPos);
    pos = tcStart + 1;
  }
  return out;
}

async function main(){
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');

  if(!xml.includes('{{workDateFrom}}')){
    xml = injectRowAfterHeader(xml, 'Employer', ['workDateFrom','workDateTo','workEmployerDetails','workPositionDetails','workReasons','workEndOfContracts']);
  }
  if(!xml.includes('{{languageNames}}')){
    xml = injectRowAfterHeader(xml, 'Language', ['languageNames','languageSpeaking','languageReading','languageWriting','languageExtras']);
  }

  zip.file('word/document.xml', xml);
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, out);
  console.log('Row placeholders injected for work/language if possible.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
