export const coordinatorOptionsByAddedBy = {
  Office: [
    'Bu Ayu',
    'Bu Farida',
    'Bu Imas',
    'Bu Desy',
    'Haris',
    'Ibu',
    'Ibu Widi',
    'Icha',
    'Medsos',
    'Office',
    'Pak Akbar',
    'Pak Edi',
    'Pak Irawan',
    'Pak Ketut',
    'Pak Marhaba',
    'Pak Tut Surabaya',
    'Pak Syamsul Madura',
    'Widi',
    'Wiwik',
    'Jogja Office',
    'CC Lampung',
    'Individual',
    'CITI',
    'EPQI',
    'GEC',
    'GODC',
    'LTE',
    'CC Jogja',
    'SMILEZONE',
    'Ex Turkey',
    'Agus LPK ZMI',
    'Widi LPM ZMI',
    'PANDAWA',
    'None',
  ],
};

export function getCoordinatorOptions(addedBy) {
  if (!addedBy) return [];
  return coordinatorOptionsByAddedBy[addedBy] ?? [];
}

