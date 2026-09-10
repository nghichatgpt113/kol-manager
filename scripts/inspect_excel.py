import zipfile
import xml.etree.ElementTree as ET
import json
import re
from datetime import datetime, timedelta

def parse_excel(filename):
    with zipfile.ZipFile(filename, 'r') as z:
        # 1. Parse shared strings
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            ss_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = {'main': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in ss_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
                # Extract all text parts inside si
                texts = [t.text or '' for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]
                shared_strings.append(''.join(texts))

        # 2. Get sheet mapping
        wb_tree = ET.fromstring(z.read('xl/workbook.xml'))
        rels_tree = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        rel_map = {}
        for r in rels_tree:
            rel_map[r.attrib['Id']] = r.attrib['Target']

        sheets = {}
        for s in wb_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet'):
            name = s.attrib['name']
            r_id = s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
            target = rel_map[r_id]
            if not target.startswith('xl/'):
                target = 'xl/' + target
            sheets[name] = target

        results = {}
        for name, path in sheets.items():
            sheet_tree = ET.fromstring(z.read(path))
            rows_data = []
            
            # Map column letters to 0-based index
            def col_to_idx(col_str):
                idx = 0
                for char in col_str:
                    idx = idx * 26 + (ord(char) - ord('A') + 1)
                return idx - 1

            for row in sheet_tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row'):
                row_dict = {}
                for c in row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c'):
                    r_ref = c.attrib.get('r', '')
                    match = re.match(r'([A-Z]+)(\d+)', r_ref)
                    if not match:
                        continue
                    col_letters, row_num = match.groups()
                    col_idx = col_to_idx(col_letters)
                    t_attr = c.attrib.get('t')
                    v_elem = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
                    val = v_elem.text if v_elem is not None else None
                    
                    if t_attr == 's' and val is not None:
                        idx = int(val)
                        cell_val = shared_strings[idx] if idx < len(shared_strings) else val
                    elif t_attr == 'inlineStr':
                        is_elem = c.find('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')
                        cell_val = is_elem.text if is_elem is not None else ''
                    else:
                        cell_val = val
                    
                    row_dict[col_idx] = cell_val
                if row_dict:
                    rows_data.append(row_dict)
            
            # Convert rows to 2D grid
            if rows_data:
                max_col = max(max(r.keys()) for r in rows_data)
                grid = []
                for r in rows_data:
                    row_arr = [r.get(i, None) for i in range(max_col + 1)]
                    grid.append(row_arr)
                results[name] = grid
            else:
                results[name] = []

    return results

if __name__ == '__main__':
    data = parse_excel('WKF Nguyên Anh.xlsx')
    for sheet_name, rows in data.items():
        print(f"\n==================== SHEET: {sheet_name} ====================")
        print(f"Total rows (including header): {len(rows)}")
        if rows:
            print(f"Header row (col count {len(rows[0])}):")
            for idx, col in enumerate(rows[0]):
                print(f"  Col {idx}: {col}")
            print(f"Sample data row 1: {rows[1] if len(rows) > 1 else 'None'}")
            print(f"Sample data row 2: {rows[2] if len(rows) > 2 else 'None'}")
