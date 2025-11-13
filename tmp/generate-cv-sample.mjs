(async () => {
  const fs = await import('fs');
  const path = await import('path');
  const { pathToFileURL } = await import('url');
  const modUrl = pathToFileURL(path.resolve(process.cwd(), 'lib', 'cv-generator.js')).href;
  const { generateWordCVEasy } = await import(modUrl);
  const cvData = {
    profession: 'Cook',
    name: 'Test User',
    gender: 'Male',
    fatherName: 'Dad',
    motherName: 'Mom',
    height: '170',
    weight: '65',
    maritalStatus: 'Single',
    placeOfBirth: 'Jakarta',
    dateOfBirth: '1995-05-20',
    address: 'Jl. Contoh 123',
    religion: 'Islam',
    citizenship: 'Indonesia',
    idnPassportNo: 'A1234567',
    issueDate: '2020-01-01',
    issuedBy: 'Jakarta',
    expDate: '2025-01-01',
    mobileNo: '08123456789',
    email: 'test@example.com',
    emergencyContactName: 'Emergency Contact',
    emergencyContactNumber: '081298765432',
    emergencyContactRelation: 'Sibling',
    emergencyContactAddress: 'Jl. Darurat 456',
    education: [
      { years: '2010-2013', schoolName: 'SMK 1', subject: 'Hospitality', country: 'ID' },
      { years: '2013-2016', schoolName: 'Politeknik', subject: 'Culinary', country: 'ID' }
    ],
    workExperience: [
      { dateFrom: '2017-01-01', dateTo: '2019-06-01', employerName: 'Resto A', employerAddress: 'Bandung', employerPhone: '022-xxx', contactPerson: 'HR', positionDetails: 'Cook Helper', reasonToLeave: 'Pindah kota', endOfContract: '2019-06-01' },
      { dateFrom: '2019-07-01', dateTo: '2022-08-01', companyName: 'Hotel B', companyAddress: 'Jakarta', companyPhone: '021-yyy', contactPerson: 'Manager', positionDetails: 'Line Cook', reasonToLeave: 'Kontrak selesai', endOfContract: '2022-08-01' }
    ],
    languages: [
      { language: 'English', speaking: 'Good', reading: 'Good', writing: 'Good' },
      { language: 'Turkish', speaking: 'Basic', reading: 'Basic', writing: 'Basic' }
    ],
    computerSkills: 'MS Word, Excel; Email',
    skills: { attentiveListening: true, problemSolving: true, teamwork: true }
  };
  const buf = await generateWordCVEasy(cvData);
  const outPath = path.resolve(process.cwd(), 'tmp', 'generated-easy-local.docx');
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  await fs.promises.writeFile(outPath, Buffer.from(buf));
  console.log('Generated:', outPath);
})();
