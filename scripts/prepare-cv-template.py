import copy
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
import re

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
XML_SPACE = '{http://www.w3.org/XML/1998/namespace}space'

def tag(token: str) -> str:
    return f'{{{{{token}}}}}'

TAG_PATTERN = re.compile(r'({{[^}]+}})')

REGISTERED_NAMESPACES = {
    'wpc': 'http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas',
    'cx': 'http://schemas.microsoft.com/office/drawing/2014/chartex',
    'cx1': 'http://schemas.microsoft.com/office/drawing/2015/9/8/chartex',
    'cx2': 'http://schemas.microsoft.com/office/drawing/2015/10/21/chartex',
    'cx3': 'http://schemas.microsoft.com/office/drawing/2016/5/9/chartex',
    'cx4': 'http://schemas.microsoft.com/office/drawing/2016/5/10/chartex',
    'cx5': 'http://schemas.microsoft.com/office/drawing/2016/5/11/chartex',
    'cx6': 'http://schemas.microsoft.com/office/drawing/2016/5/12/chartex',
    'cx7': 'http://schemas.microsoft.com/office/drawing/2016/5/13/chartex',
    'cx8': 'http://schemas.microsoft.com/office/drawing/2016/5/14/chartex',
    'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'aink': 'http://schemas.microsoft.com/office/drawing/2016/ink',
    'am3d': 'http://schemas.microsoft.com/office/drawing/2017/model3d',
    'o': 'urn:schemas-microsoft-com:office:office',
    'oel': 'http://schemas.microsoft.com/office/2019/extlst',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
    'v': 'urn:schemas-microsoft-com:vml',
    'wp14': 'http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'w10': 'urn:schemas-microsoft-com:office:word',
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'w14': 'http://schemas.microsoft.com/office/word/2010/wordml',
    'w15': 'http://schemas.microsoft.com/office/word/2012/wordml',
    'w16cex': 'http://schemas.microsoft.com/office/word/2018/wordml/cex',
    'w16cid': 'http://schemas.microsoft.com/office/word/2016/wordml/cid',
    'w16': 'http://schemas.microsoft.com/office/word/2018/wordml',
    'w16du': 'http://schemas.microsoft.com/office/word/2023/wordml/word16du',
    'w16sdtdh': 'http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash',
    'w16sdtfl': 'http://schemas.microsoft.com/office/word/2024/wordml/sdtformatlock',
    'w16se': 'http://schemas.microsoft.com/office/word/2015/wordml/symex',
    'wpg': 'http://schemas.microsoft.com/office/word/2010/wordprocessingGroup',
    'wpi': 'http://schemas.microsoft.com/office/word/2010/wordprocessingInk',
    'wne': 'http://schemas.microsoft.com/office/word/2006/wordml',
    'wps': 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
}

for prefix, uri in REGISTERED_NAMESPACES.items():
    ET.register_namespace(prefix, uri)

def qn(name: str) -> str:
    prefix, local = name.split(':')
    return f"{{{NS[prefix]}}}{local}"

def get_cells(row):
    return row.findall('w:tc', NS)

def clear_paragraphs(cell):
    for child in list(cell):
        if child.tag == qn('w:p'):
            cell.remove(child)

def clone_ppr(paragraph):
    ppr = paragraph.find('w:pPr', NS) if paragraph is not None else None
    return copy.deepcopy(ppr) if ppr is not None else None

def append_paragraph(cell, text, ppr_template=None):
    p = ET.Element(qn('w:p'))
    if ppr_template is not None:
        p.append(copy.deepcopy(ppr_template))
    text = text or ''
    parts = TAG_PATTERN.split(text)
    if not parts:
        parts = ['']
    added = False
    for part in parts:
        if part == '':
            continue
        r = ET.SubElement(p, qn('w:r'))
        t = ET.SubElement(r, qn('w:t'))
        if part.startswith('<<') and part.endswith('>>'):
            t.text = part
        else:
            if part.startswith(' ') or part.endswith(' '):
                t.set(XML_SPACE, 'preserve')
            t.text = part
        added = True
    if not added:
        r = ET.SubElement(p, qn('w:r'))
        ET.SubElement(r, qn('w:t')).text = ''
    cell.append(p)

def set_cell_lines(cell, lines):
    existing_para = cell.find('w:p', NS)
    ppr_template = clone_ppr(existing_para)
    clear_paragraphs(cell)
    if not lines:
        lines = ['']
    for line in lines:
        append_paragraph(cell, line, ppr_template)

def replace_paragraph_with(root, search_text, replacement):
    for paragraph in root.findall('.//w:p', NS):
        text_nodes = paragraph.findall('.//w:t', NS)
        combined = ''.join(t.text or '' for t in text_nodes)
        if combined.strip() == search_text:
            ppr_template = paragraph.find('w:pPr', NS)
            if ppr_template is not None:
                ppr_template = copy.deepcopy(ppr_template)
            for child in list(paragraph):
                paragraph.remove(child)
            if ppr_template is not None:
                paragraph.append(ppr_template)
            r = ET.SubElement(paragraph, qn('w:r'))
            t = ET.SubElement(r, qn('w:t'))
            t.text = replacement
            break

def process(input_path: Path, output_path: Path):
    with zipfile.ZipFile(input_path, 'r') as zin:
        with zipfile.ZipFile(output_path, 'w') as zout:
            for item in zin.infolist():
                if item.filename.startswith('customXml/'):
                    continue
                data = zin.read(item.filename)
                if item.filename == 'word/document.xml':
                    data = transform_document_xml(data)
                elif item.filename == 'word/_rels/document.xml.rels':
                    data = transform_document_rels(data)
                elif item.filename == '[Content_Types].xml':
                    data = transform_content_types(data)
                zout.writestr(item, data)

def transform_content_types(data: bytes) -> bytes:
    root = ET.fromstring(data)
    ns = {'ct': 'http://schemas.openxmlformats.org/package/2006/content-types'}
    for override in list(root.findall('ct:Override', ns)):
        part_name = override.attrib.get('PartName', '')
        if part_name.startswith('/customXml/'):
            root.remove(override)
    return ET.tostring(root, encoding='utf-8', xml_declaration=True)

def transform_document_rels(data: bytes) -> bytes:
    root = ET.fromstring(data)
    ns = {'rel': 'http://schemas.openxmlformats.org/package/2006/relationships'}
    for rel in list(root.findall('rel:Relationship', ns)):
        rel_type = rel.attrib.get('Type', '')
        if rel_type.endswith('/customXml'):
            root.remove(rel)
    return ET.tostring(root, encoding='utf-8', xml_declaration=True)

def transform_document_xml(data: bytes) -> bytes:
    root = ET.fromstring(data)
    table = root.findall('.//w:tbl', NS)[0]
    rows = table.findall('w:tr', NS)

    # Position + photo row
    position_row_cells = get_cells(rows[1])
    set_cell_lines(position_row_cells[0], [f'Position Apply : {tag("positionApply")}'])
    set_cell_lines(position_row_cells[1], [tag('photo')])

    # Personal detail rows
    set_cell_lines(get_cells(rows[3])[1], [tag('name')])

    row4_cells = get_cells(rows[4])
    set_cell_lines(row4_cells[1], [tag('fatherName')])
    set_cell_lines(row4_cells[3], [tag('motherName')])

    row5_cells = get_cells(rows[5])
    set_cell_lines(row5_cells[1], [tag('height')])
    set_cell_lines(row5_cells[3], [tag('weight')])

    row6_cells = get_cells(rows[6])
    set_cell_lines(row6_cells[1], [tag('maritalStatus')])
    set_cell_lines(row6_cells[3], [tag('placeOfBirth')])
    set_cell_lines(row6_cells[5], [tag('dateOfBirthFormatted')])

    row7_cells = get_cells(rows[7])
    set_cell_lines(row7_cells[1], [tag('address')])

    row8_cells = get_cells(rows[8])
    set_cell_lines(row8_cells[1], [tag('religion')])
    set_cell_lines(row8_cells[3], [tag('citizenship')])

    row9_cells = get_cells(rows[9])
    set_cell_lines(row9_cells[1], [tag('idnPassportNo')])
    set_cell_lines(row9_cells[3], [tag('issueDateFormatted')])

    row10_cells = get_cells(rows[10])
    set_cell_lines(row10_cells[1], [tag('issuedBy')])
    set_cell_lines(row10_cells[3], [tag('expDateFormatted')])

    row11_cells = get_cells(rows[11])
    set_cell_lines(row11_cells[1], [tag('mobileNo')])
    set_cell_lines(row11_cells[3], [tag('email')])

    # Emergency contact data row (Row 14)
    row14_cells = get_cells(rows[14])
    set_cell_lines(row14_cells[0], [tag('emergencyContactName')])
    set_cell_lines(row14_cells[1], [tag('emergencyContactNumber')])
    set_cell_lines(row14_cells[2], [tag('emergencyContactRelation')])
    set_cell_lines(row14_cells[3], [tag('emergencyContactAddress')])

    # Education loop row (Row 18)
    education_row = rows[18]
    education_cells = get_cells(education_row)
    set_cell_lines(education_cells[0], [tag('educationYears')])
    set_cell_lines(education_cells[1], [tag('educationSchools')])
    set_cell_lines(education_cells[2], [tag('educationSubjects')])
    set_cell_lines(education_cells[3], [tag('educationCountries')])

    spacer_education_row = rows[19]
    for cell in get_cells(spacer_education_row):
        set_cell_lines(cell, [''])

    # Work experience loop (Row 21 header + Row 22 data)
    work_header_row = rows[21]
    work_header_cells = get_cells(work_header_row)
    set_cell_lines(work_header_cells[0], ['Dates'])
    set_cell_lines(work_header_cells[1], ['Employer\'s Name, Address, and Phone No.'])
    set_cell_lines(work_header_cells[2], ['Position Held and brief details of work'])
    set_cell_lines(work_header_cells[3], ['Reason to leave / End of Contract'])

    work_row = rows[22]
    work_cells = get_cells(work_row)
    set_cell_lines(work_cells[0], [tag('workDateFrom')])
    set_cell_lines(work_cells[1], [tag('workDateTo')])
    set_cell_lines(work_cells[2], [tag('workEmployerDetails')])
    set_cell_lines(work_cells[3], [tag('workPositionDetails')])
    set_cell_lines(work_cells[4], [tag('workReasons')])

    work_row_footer = rows[23]
    work_footer_cells = get_cells(work_row_footer)
    set_cell_lines(work_footer_cells[0], [''])
    set_cell_lines(work_footer_cells[1], [''])
    set_cell_lines(work_footer_cells[2], [''])
    set_cell_lines(work_footer_cells[3], [''])
    set_cell_lines(work_footer_cells[4], [f'End of Contract: {tag("workEndOfContracts")}'])

    # Preserve spacer row after work experience loop (Row 24)
    spacer_work_row = rows[24]
    for cell in get_cells(spacer_work_row):
        set_cell_lines(cell, [''])

    # Languages loop (Row 27)
    language_row = rows[27]
    language_cells = get_cells(language_row)
    set_cell_lines(language_cells[0], [tag('languageNames')])
    set_cell_lines(language_cells[1], [tag('languageSpeaking')])
    set_cell_lines(language_cells[2], [tag('languageReading')])
    set_cell_lines(language_cells[3], [tag('languageWriting')])
    set_cell_lines(language_cells[4], [tag('languageExtras')])

    # Computer skills summary row (Row 28, cell 0)
    comp_row = rows[28]
    comp_cells = get_cells(comp_row)
    set_cell_lines(comp_cells[0], [f'Computer Skills: {tag("computerSkillsSummary")}'])
    for idx in range(1, len(comp_cells)):
        set_cell_lines(comp_cells[idx], [''])

    # Skills paragraph row (Row 31)
    skills_row = rows[31]
    skills_cells = get_cells(skills_row)
    set_cell_lines(skills_cells[0], [tag('skillsSummary')])

    # Update photo placeholders outside table
    replace_paragraph_with(root, 'Insert your fullbody photo here↓', tag('fullBodyPhoto'))
    replace_paragraph_with(root, 'Insert your passport here↓', tag('passportPhoto'))
    replace_paragraph_with(root, 'Insert your paklaring here↓', tag('paklaringPhoto'))

    return ET.tostring(root, encoding='utf-8', xml_declaration=True)

if __name__ == '__main__':
    project_root = Path(__file__).resolve().parent.parent
    source = project_root / 'TEMPLATE CV TURKEY with Emergency number .docx'
    target_dir = project_root / 'lib' / 'templates'
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / 'cv-template.docx'
    process(source, target)
    print(f'Updated template written to {target}')
