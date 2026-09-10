import zipfile
import xml.etree.ElementTree as ET
import json
import re
from datetime import datetime, timedelta
from collections import Counter
from inspect_excel import parse_excel

def excel_date(val):
    if val is None:
        return None
    val_str = str(val).strip()
    if not val_str:
        return None
    try:
        num = float(val_str)
        # Excel date epoch 1899-12-30
        dt = datetime(1899, 12, 30) + timedelta(days=num)
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return val_str

def run():
    data = parse_excel('WKF Nguyên Anh.xlsx')
    
    print("=== 1. WKF ROW-BY-ROW INSPECTION ===")
    wkf = data['WKF']
    print(f"Total rows in WKF XML: {len(wkf)}")
    
    valid_rows = []
    empty_trailing_rows = []
    rows_without_username = []
    
    for idx, r in enumerate(wkf[1:], start=2):
        has_any = any(c is not None and str(c).strip() != '' for c in r)
        username = r[3].strip() if r[3] else None
        
        if not has_any:
            empty_trailing_rows.append(idx)
        elif not username:
            rows_without_username.append((idx, [c for c in r[:16] if c is not None]))
        else:
            valid_rows.append((idx, r))
            
    print(f"Non-empty rows with username: {len(valid_rows)}")
    print(f"Non-empty rows WITHOUT username: {len(rows_without_username)}")
    for r_num, content in rows_without_username[:10]:
        print(f"  Row {r_num} without username: {content}")
    print(f"Completely empty rows: {len(empty_trailing_rows)} (Range: {empty_trailing_rows[0] if empty_trailing_rows else 'N/A'} to {empty_trailing_rows[-1] if empty_trailing_rows else 'N/A'})")

    print("\n=== 2. STATUS AUDIT IN WKF ===")
    status_map = Counter()
    for idx, r in valid_rows:
        st = r[12].strip() if r[12] else '(EMPTY)'
        status_map[st] += 1
    for st, count in status_map.most_common():
        print(f"  Status '{st}': {count} rows")

    print("\n=== 3. DATES IN WKF ===")
    date_samples = []
    for idx, r in valid_rows[:5]:
        sample_sent = excel_date(r[2])
        exp_receive = excel_date(r[9])
        remind_vid = excel_date(r[10])
        post_time = excel_date(r[11])
        date_samples.append({
            "row": idx,
            "user": r[3],
            "sample_sent": (r[2], sample_sent),
            "exp_receive": (r[9], exp_receive),
            "remind_vid": (r[10], remind_vid),
            "post_time": (r[11], post_time),
        })
    print(json.dumps(date_samples, indent=2, ensure_ascii=False))

    print("\n=== 4. LINK AIR & CODE ADS IN WKF ===")
    wkf_with_link_air = [r for idx, r in valid_rows if r[13]]
    wkf_with_code_ads = [r for idx, r in valid_rows if r[14]]
    print(f"WKF rows that ALREADY have Link air in col 13: {len(wkf_with_link_air)}")
    print(f"WKF rows that ALREADY have Code Ads in col 14: {len(wkf_with_code_ads)}")

    print("\n=== 5. NOTES IN WKF (Address / Phone / Name Parsing) ===")
    note_samples = []
    for idx, r in valid_rows:
        note = r[15]
        if note:
            note_samples.append((idx, r[3], note.strip()))
    print(f"Total rows with Note: {len(note_samples)} / {len(valid_rows)}")
    print("Sample 5 notes:")
    for r_num, u, n in note_samples[:5]:
        print(f"  Row {r_num} ({u}): '{n}'")

    print("\n=== 6. DATA SHEET INSPECTION ===")
    data_sheet = data['data']
    print(f"Total rows in 'data' sheet: {len(data_sheet)}")
    for idx, r in enumerate(data_sheet):
        u = r[3]
        prod = r[8]
        st = r[12]
        date_val = excel_date(r[11])
        note = r[15]
        print(f"  data row {idx}: user='{u}', prod='{prod}', status='{st}', post_date='{date_val}', note='{note}'")

    print("\n=== 7. LINK AIR VIDEO SHEET INSPECTION ===")
    v_sheet = data['Link air video']
    print(f"Total rows in 'Link air video': {len(v_sheet)}")
    valid_videos = []
    for idx, r in enumerate(v_sheet[1:], start=2):
        u = r[1].strip() if r[1] else None
        dt = excel_date(r[2])
        url = r[3].strip() if r[3] else None
        v_id = r[4].strip() if r[4] else None
        ads = r[5].strip() if r[5] else None
        if url or u:
            valid_videos.append((idx, u, dt, url, v_id, ads))
    print(f"Valid video rows: {len(valid_videos)}")
    
    # Check duplicate URLs
    urls = [v[3] for v in valid_videos if v[3]]
    url_counts = Counter(urls)
    dup_urls = {u: c for u, c in url_counts.items() if c > 1}
    print(f"Duplicate URLs in video sheet: {dup_urls}")

    # Check match with WKF KOLs
    wkf_users = {r[3].strip() for idx, r in valid_rows}
    unmatched_users = set()
    matched_users = set()
    for idx, u, dt, url, v_id, ads in valid_videos:
        if u in wkf_users:
            matched_users.add(u)
        else:
            unmatched_users.add(u)
    print(f"Video rows matching WKF users: {len([v for v in valid_videos if v[1] in wkf_users])} rows across {len(matched_users)} users")
    print(f"Video rows NOT matching WKF users: {len([v for v in valid_videos if v[1] not in wkf_users])} rows across {len(unmatched_users)} users: {unmatched_users}")

    print("\n=== 8. VĂN MẪU SHEET INSPECTION ===")
    vm = data['Văn mẫu']
    print(f"Total rows in 'Văn mẫu': {len(vm)}")
    templates_list = []
    for idx, r in enumerate(vm):
        content = r[0]
        if content and content.strip():
            templates_list.append((idx, content.strip()))
    print(f"Non-empty templates: {len(templates_list)}")
    for idx, c in templates_list:
        lines = c.split('\n')
        first_line = lines[0].strip()
        print(f"\n--- Template {idx+1} ---")
        print(f"First line: {first_line}")
        print(f"Length: {len(c)} chars, Lines: {len(lines)}")
        print(f"Snippet: {c[:120]}...")

run()
