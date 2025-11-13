import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

function findRowStartContaining(xml, text){
  const tIdx = xml.indexOf(text);
  if (tIdx < 0) return -1;
  // Walk back to enclosing row start
  let pos = tIdx;
  while (pos >= 0){
    if (xml.substr(pos, 4) === '<w:tr') return pos;
    pos--;
  }
  return -1;
}

function insertPlaceholdersIntoNextRow(xml, headerText, placeholders, skipIndices = new Set()){
  const headerRowStart = findRowStartContaining(xml, headerText);
  if (headerRowStart < 0) return xml;
  const headerRowEnd = xml.indexOf('</w:tr>', headerRowStart);
  const nextRowStart = xml.indexOf('<w:tr', headerRowEnd);
  if (nextRowStart < 0) return xml;
  const nextRowEnd = xml.indexOf('</w:tr>', nextRowStart);
  let pos = nextRowStart;
  let out = xml;
  let cellIdx = 0;
  for (let i=0;i<placeholders.length;i+=1){
    const ph = placeholders[i];
    if (!ph) { cellIdx++; continue; }
    // advance to next cell, skipping any to skipIndices
    let tcStart = out.indexOf('<w:tc', pos);
    if (tcStart < 0 || tcStart > nextRowEnd) break;
    // move forward if this index is marked to skip
    while (skipIndices.has(cellIdx)){
      cellIdx++;
      tcStart = out.indexOf('<w:tc', tcStart + 1);
      if (tcStart < 0 || tcStart > nextRowEnd) return out;
    }
    const pStart = out.indexOf('<w:p', tcStart);
    const afterPStart = out.indexOf('>', pStart) + 1;
    const pEnd = out.indexOf('</w:p>', afterPStart);
    const pPrEnd = out.indexOf('</w:pPr>', afterPStart);
    let insertPos = afterPStart;
    if (pPrEnd > 0 && pPrEnd < pEnd) insertPos = pPrEnd + '</w:pPr>'.length;
    const run = `<w:r><w:t>{{${ph}}}</w:t></w:r>`;
    out = out.slice(0, insertPos) + run + out.slice(insertPos);
    pos = tcStart + 1;
    cellIdx++;
  }
  return out;
}

async function main(){
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');

  // Work experience: columns From, To, Employer..., Position..., Reason..., End...
  // We skip Employer column (3rd cell)
  if (!xml.includes('{{workDateFrom}}')){
    xml = insertPlaceholdersIntoNextRow(
      xml,
      'From',
      ['workDateFrom','workDateTo',null,'workPositionDetails','workReasons','workEndOfContracts'],
      new Set([2])
    );
  }

  // Languages table: Language, Speaking, Reading, Writing
  if (!xml.includes('{{languageNames}}')){
    xml = insertPlaceholdersIntoNextRow(
      xml,
      'Language',
      ['languageNames','languageSpeaking','languageReading','languageWriting','languageExtras']
    );
  }

  zip.file('word/document.xml', xml);
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, out);
  console.log('Inserted work and language placeholders into first data rows.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
