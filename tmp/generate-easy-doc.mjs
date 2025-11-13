import path from 'path';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';
import { generateWordCVEasy } from '../lib/cv-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sampleCvData = {
  positionApply: 'Caregiver',
  name: 'Ayu Lestari',
  fatherName: 'Budi Santoso',
  motherName: 'Siti Aminah',
  height: '158 cm',
  weight: '50 kg',
  maritalStatus: 'Single',
  placeOfBirth: 'Jakarta',
  dateOfBirth: '1994-06-21',
  address: 'Jl. Merdeka No. 15, Jakarta',
  religion: 'Islam',
  citizenship: 'Indonesia',
  idnPassportNo: 'A1234567',
  issueDate: '2023-01-05',
  issuedBy: 'Immigration Jakarta',
  expDate: '2028-01-05',
  mobileNo: '+62 812 3456 7890',
  email: 'ayu.lestari@example.com',
  emergencyContactName: 'Dewi Lestari',
  emergencyContactNumber: '+62 811 222 333',
  emergencyContactRelation: 'Sister',
  emergencyContactAddress: 'Jl. Sudirman No. 20, Jakarta',
  computerSkills: 'Microsoft Word, Excel, Email',
  skills: {
    attentiveListening: true,
    problemSolving: true,
    createIdeas: false,
    criticalThinker: true,
    discipline: true,
    responsible: true,
    teamwork: true,
  },
  education: [
    { years: '2006 - 2009', schoolName: 'SMP Negeri 1 Jakarta', subject: 'General', country: 'Indonesia' },
    { years: '2009 - 2012', schoolName: 'SMA Negeri 4 Jakarta', subject: 'Science', country: 'Indonesia' },
  ],
  workExperience: [
    {
      dateFrom: '2018-04-01',
      dateTo: '2021-03-31',
      employerName: 'Happy Family',
      employerAddress: 'Ankara, Turkey',
      employerPhone: '+90 555 123 456',
      positionDetails: 'Live-in caregiver for two children',
      reasonToLeave: 'End of contract',
      endOfContract: '2021-03-31',
    },
    {
      dateFrom: '2021-07-01',
      dateTo: '2024-06-30',
      employerName: 'Green Villa Residence',
      employerAddress: 'Istanbul, Turkey',
      employerPhone: '+90 555 789 012',
      positionDetails: 'Housekeeper and cook',
      reasonToLeave: 'Family returned to homeland',
      endOfContract: '2024-06-30',
    },
  ],
  languages: [
    { language: 'Indonesian', speaking: 'Excellent', reading: 'Excellent', writing: 'Excellent', extra: '' },
    { language: 'English', speaking: 'Good', reading: 'Good', writing: 'Good', extra: 'TOEIC 650' },
    { language: 'Turkish', speaking: 'Basic', reading: 'Basic', writing: 'Basic', extra: '' },
  ],
};

async function main() {
  const buffer = await generateWordCVEasy(sampleCvData);
  if (!buffer || !buffer.length) {
    throw new Error('generateWordCVEasy returned an empty buffer');
  }

  const outputPath = path.resolve(__dirname, 'generated-easy.docx');
  await writeFile(outputPath, buffer);
  console.log(`DOCX generated at ${outputPath} (${buffer.length} bytes)`);
}

main().catch((error) => {
  console.error('Failed to generate sample DOCX:', error);
  process.exitCode = 1;
});
