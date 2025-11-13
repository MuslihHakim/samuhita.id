import xml.etree.ElementTree as ET
import sys
sys.stdout.reconfigure(encoding="utf-8")
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
root = ET.fromstring(open('tmp/template/word/document.xml', 'rb').read())
table = root.findall('.//w:tbl', ns)[0]
rows = table.findall('w:tr', ns)
for idx in (17,18,19,20,21,22,23,24):
    row = rows[idx]
    cells = row.findall('w:tc', ns)
    print(idx, len(cells), [''.join(t.text or '' for t in cell.findall('.//w:t', ns)) for cell in cells])
