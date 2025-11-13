import { generateWordCV } from '../lib/cv-generator.js';
import { writeFileSync } from 'fs';

const data = {
  name: 'Test & User',
  positionApply: 'Engineer',
  education: [
    { years: '2010-2013', schoolName: 'SMAN 1', subject: 'Science', country: 'IDN' },
    { years: '2014-2018', schoolName: 'Universitas', subject: 'Engineering', country: 'IDN' }
  ],
  workExperience: [
    { dateFrom: '2015-01-01', dateTo: '2017-01-01', employerDetails: 'Company A\nCity', positionDetails: 'Staff', reasonToLeave: 'Finish', endOfContract: '2017-01-01' },
    { dateFrom: '2018-02-01', dateTo: '2020-03-01', employerDetails: 'Company B\nTown', positionDetails: 'Lead', reasonToLeave: 'Better offer', endOfContract: '2020-03-01' }
  ],
  languages: [
    { language: 'English', speaking: 'Good', reading: 'Good', writing: 'Good' },
    { language: 'Turkish', speaking: 'Basic', reading: 'Basic', writing: 'Basic' }
  ],
  computerSkills: 'Word, Excel'
};

const buffer = await generateWordCV(data);
writeFileSync('../tmp-test.docx', buffer);
console.log('doc written');

