import io
import zipfile
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from lib import cv_generator

sample = {
    'name': 'Test User',
    'positionApply': 'Engineer',
    'education': [{'years': '2010-2013', 'schoolName': 'SMAN 1', 'subject': 'Science', 'country': 'ID'}],
    'workExperience': [{'dateFrom': '2015-01-01', 'dateTo': '2017-01-01', 'positionDetails': 'Staff', 'reasonToLeave': 'Finish', 'endOfContract': '2017-01-01', 'employerDetails': 'Company A'}],
    'languages': [{'language': 'English', 'speaking': 'Good', 'reading': 'Good', 'writing': 'Good'}],
}

buffer = asyncio.run(cv_generator.generateWordCV(sample))
with zipfile.ZipFile(io.BytesIO(buffer)) as z:
    xml = z.read('word/document.xml')

from xml.etree import ElementTree as ET
ET.fromstring(xml)
print('XML parsed successfully')
