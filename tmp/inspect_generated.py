import zipfile
import xml.etree.ElementTree as ET
import sys
sys.stdout.reconfigure(encoding="utf-8")
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
with zipfile.ZipFile('tmp/generated.docx') as z:
    root = ET.fromstring(z.read('word/document.xml'))
    table = root.findall('.//w:tbl', ns)[0]
    for idx, row in enumerate(table.findall('w:tr', ns)):
        cells = []
        for cell in row.findall('w:tc', ns):
            text = ''.join(t.text or '' for t in cell.findall('.//w:t', ns))
            cells.append(text)
        print(idx, cells)
