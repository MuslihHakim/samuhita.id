import path from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.resolve(__dirname, '../lib/templates/cv-template-turkey.docx');

// Scalars expected by prepareEasyTemplateData
const scalarFields = [
  'positionApply','name','fatherName','motherName','height','weight','maritalStatus',
  'placeOfBirth','dateOfBirthFormatted','address','religion','citizenship','idnPassportNo',
  'issueDateFormatted','issuedBy','expDateFormatted','mobileNo','email',
  'emergencyContactName','emergencyContactNumber','emergencyContactRelation','emergencyContactAddress',
  'computerSkillsSummary','skillsSummary',
];

const loops = [
  { name: 'education', fields: ['years','schoolName','subject','country'] },
  { name: 'workExperience', fields: ['dateFromFormatted','dateToFormatted','employerDetails','positionDetails','reasonToLeave','endOfContract'] },
  { name: 'languages', fields: ['language','speaking','reading','writing','extra'] },
];

function findPlaceholders(xml) {
  const re = /\{\{([^}]+)\}\}/g;
  const found = new Set();
  for (const m of xml.matchAll(re)) {
    found.add(m[1].trim());
  }
  return found;
}

async function main() {
  const buf = await readFile(templatePath);
  const zip = await JSZip.loadAsync(buf);
  const docXml = await zip.file('word/document.xml')?.async('string');
  if (!docXml) {
    console.error('Could not read word/document.xml from template');
    process.exit(1);
  }

  const placeholders = findPlaceholders(docXml);

  const missingScalars = scalarFields.filter((f) => !placeholders.has(f));
  const loopIssues = [];
  for (const loop of loops) {
    const start = `#each ${loop.name}`;
    const end = `/each`;
    const hasStart = placeholders.has(start);
    const hasEnd = placeholders.has(end);
    const missingFields = loop.fields.filter((f) => !placeholders.has(f));
    loopIssues.push({ loop: loop.name, hasStart, hasEnd, missingFields });
  }

  console.log('Template placeholder audit (cv-template-turkey.docx)');
  console.log('-----------------------------------------------------');
  console.log('Scalars missing:', missingScalars.length ? missingScalars : 'none');
  console.log();
  for (const issue of loopIssues) {
    console.log(`Loop: ${issue.loop}`);
    console.log(' - hasStart {{#each ...}}:', issue.hasStart);
    console.log(' - hasEnd   {{/each}}     :', issue.hasEnd);
    console.log(' - missing fields         :', issue.missingFields.length ? issue.missingFields : 'none');
    console.log();
  }

  console.log('Note: Add placeholders exactly as shown, without styling breaks.');
}

main().catch((e) => { console.error(e); process.exit(1); });

