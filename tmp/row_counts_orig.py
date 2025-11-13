import zipfile
import xml.etree.ElementTree as ET
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile('TEMPLATE CV TURKEY with Emergency number .docx') as z:
    root = ET.fromstring(z.read('word/document.xml'))
    table = root.findall('.//w:tbl', ns)[0]
    for idx in (18,19,22,23):
        row = table.findall('w:tr', ns)[idx]
        print(idx, len(row.findall('w:tc', ns)))
