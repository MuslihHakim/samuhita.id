import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template.docx');
const backupPath = path.resolve('lib', 'templates', 'cv-template.backup.docx');

function fixNumberingXml(xml) {
  const bullet = '•';
  const re = /(\<w:lvl[^>]*>\s*<w:numFmt[^>]*w:val="bullet"[^>]*\/>(?:.|\n|\r)*?)<w:lvlText[^>]*w:val="[^"]*"\/>/g;
  return xml.replace(re, (m, prefix) => `${prefix}<w:lvlText w:val="${bullet}"/>`);
}

async function main() {
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  const numberingFile = 'word/numbering.xml';
  const file = zip.file(numberingFile);
  if (!file) {
    console.log('No numbering.xml part; nothing to fix.');
    return;
  }
  const xml = await file.async('string');
  const fixed = fixNumberingXml(xml);
  if (fixed === xml) {
    console.log('No changes made to numbering.xml');
  } else {
    console.log('Applied bullet fixes to numbering.xml (legacy template)');
    zip.file(numberingFile, fixed);
    await fs.copyFile(templatePath, backupPath);
    const outBuf = await zip.generateAsync({ type: 'nodebuffer' });
    await fs.writeFile(templatePath, outBuf);
    console.log('Legacy template updated. Backup at', backupPath);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
