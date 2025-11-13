import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

const templatePath = path.resolve('lib', 'templates', 'cv-template-turkey.docx');

async function main(){
  const buf = await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  let xml = await zip.file('word/document.xml').async('string');
  // Replace all double braces with single braces
  xml = xml.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
  zip.file('word/document.xml', xml);
  const out = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.writeFile(templatePath, out);
  console.log('Converted double braces to single braces in Turkey template.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
