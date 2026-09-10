import zipfile
import xml.etree.ElementTree as ET
import json
import re
from datetime import datetime, timedelta
from collections import Counter

def excel_date_to_str(val):
    if not val:
        return None
    try:
        # If it's a number (serial)
        num = float(val)
        dt = datetime(1899, 12, 30) + timedelta(days=num)
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return str(val)

def parse_cms(cms_str):
    if not cms_str:
        return None, None, "Empty CMS"
    cms_str = str(cms_str).strip()
    
    # Common pattern: "12% - ads 7%", "12% + ads 7%", "12% - 7% ads", "12%", "ads 7%"
    # Match comm and ads
    comm = None
    ads = None
    
    comm_match = re.search(r'(\d+(?:\.\d+)?)\s*%(?!\s*ads)', cms_str, re.IGNORECASE)
    if comm_match:
        comm = float(comm_match.group(1))
        
    ads_match = re.search(r'ads\s*(\d+(?:\.\d+)?)\s*%|(\d+(?:\.\d+)?)\s*%\s*ads', cms_str, re.IGNORECASE)
    if ads_match:
        ads_val = ads_match.group(1) or ads_match.group(2)
        ads = float(ads_val)

    return comm, ads, cms_str

from inspect_excel import parse_excel

def audit():
    data = parse_excel('WKF Nguyên Anh.xlsx')
    
    print("================================================================================")
    print("EXCEL COMPREHENSIVE AUDIT REPORT: WKF Nguyên Anh.xlsx")
    print("================================================================================")
    
    # --------------------------------------------------------------------------
    # 1. SHEET: WKF
    # --------------------------------------------------------------------------
    wkf_rows = data['WKF']
    header = [c.strip() if c else f'Col_{i}' for i, c in enumerate(wkf_rows[0])]
    print(f"\n--- SHEET: WKF (Total rows: {len(wkf_rows)}, Data rows: {len(wkf_rows)-1}) ---")
    print(f"Header: {header}")
    
    statuses = Counter()
    products = Counter()
    content_types = Counter()
    fees = Counter()
    cms_raw = Counter()
    usernames = []
    
    empty_usernames = 0
    duplicate_usernames = Counter()
    date_issues = []
    fee_issues = []
    
    # Let's inspect rows 1..N
    for r_idx, row in enumerate(wkf_rows[1:], start=2):
        stt = row[0]
        month = row[1]
        sample_sent_at = row[2]
        username = row[3]
        channel_url = row[4]
        fee = row[5]
        cms = row[6]
        c_type = row[7]
        product = row[8]
        sample_expected_at = row[9]
        video_reminder_at = row[10]
        expected_post_at = row[11]
        status = row[12]
        link_air = row[13]
        code_ads = row[14]
        note = row[15]
        
        # Check if entire row is empty
        if not any(row):
            continue
            
        u_clean = username.strip() if username else None
        if not u_clean:
            empty_usernames += 1
        else:
            usernames.append(u_clean)
            duplicate_usernames[u_clean] += 1
            
        status_clean = status.strip() if status else 'None'
        statuses[status_clean] += 1
        
        prod_clean = product.strip() if product else 'None'
        products[prod_clean] += 1
        
        ct_clean = c_type.strip() if c_type else 'None'
        content_types[ct_clean] += 1
        
        fee_clean = str(fee).strip() if fee is not None else 'None'
        fees[fee_clean] += 1
        
        cms_clean = str(cms).strip() if cms is not None else 'None'
        cms_raw[cms_clean] += 1

    print(f"\n[WKF KOL Usernames]")
    print(f"  Total non-empty username entries: {len(usernames)}")
    print(f"  Unique usernames: {len(set(usernames))}")
    print(f"  Empty usernames count: {empty_usernames}")
    multi_booking_kols = {u: c for u, c in duplicate_usernames.items() if c > 1}
    print(f"  KOLs with multiple rows (repeat bookings): {len(multi_booking_kols)} (e.g. {list(multi_booking_kols.items())[:5]})")
    
    print(f"\n[WKF Status Values (Tiến độ hợp tác KOC)]")
    for st, count in statuses.most_common():
        print(f"  - '{st}': {count} rows")
        
    print(f"\n[WKF Products]")
    for p, count in products.most_common():
        print(f"  - '{p}': {count} rows")
        
    print(f"\n[WKF Content Types]")
    for ct, count in content_types.most_common():
        print(f"  - '{ct}': {count} rows")

    print(f"\n[WKF Booking Fees (Top 10)]")
    for f, count in fees.most_common(10):
        print(f"  - '{f}': {count} rows")

    print(f"\n[WKF CMS Patterns]")
    for c, count in cms_raw.most_common():
        comm, ads, _ = parse_cms(c)
        print(f"  - '{c}' ({count} rows) => comm: {comm}%, ads: {ads}%")

    # --------------------------------------------------------------------------
    # 2. SHEET: data
    # --------------------------------------------------------------------------
    data_rows = data['data']
    print(f"\n--- SHEET: data (Total rows: {len(data_rows)}) ---")
    data_usernames = []
    for idx, row in enumerate(data_rows):
        # Let's inspect fields
        u = row[3]
        prod = row[8]
        st = row[12]
        print(f"  Row {idx}: user='{u}', prod='{prod}', status='{st}', date_post='{row[11]}', note='{row[15]}'")
        if u:
            data_usernames.append(u.strip())
    
    # Check overlap between data and WKF
    wkf_u_set = set(usernames)
    overlap = [u for u in data_usernames if u in wkf_u_set]
    print(f"  Usernames in 'data': {len(data_usernames)}")
    print(f"  Overlap with WKF: {len(overlap)} / {len(data_usernames)} (Users: {overlap})")

    # --------------------------------------------------------------------------
    # 3. SHEET: Link air video
    # --------------------------------------------------------------------------
    video_rows = data['Link air video']
    print(f"\n--- SHEET: Link air video (Total rows: {len(video_rows)}, Data rows: {len(video_rows)-1}) ---")
    v_header = [c.strip() if c else f'Col_{i}' for i, c in enumerate(video_rows[0])]
    print(f"Header: {v_header}")
    
    v_users = []
    v_urls = []
    v_ads_codes = []
    
    for r in video_rows[1:]:
        if not any(r):
            continue
        stt = r[0]
        u = r[1].strip() if r[1] else None
        dt = r[2]
        url = r[3].strip() if r[3] else None
        v_id = r[4].strip() if r[4] else None
        ads = r[5].strip() if r[5] else None
        
        if u:
            v_users.append(u)
        if url:
            v_urls.append(url)
        if ads:
            v_ads_codes.append(ads)

    print(f"  Total video rows with data: {len(v_urls)}")
    print(f"  Unique video URLs: {len(set(v_urls))}")
    print(f"  Unique Ads codes: {len(set(v_ads_codes))}")
    print(f"  Unique KOL usernames in video sheet: {len(set(v_users))}")
    
    # Matching check against WKF
    v_users_in_wkf = [u for u in set(v_users) if u in wkf_u_set]
    v_users_not_in_wkf = [u for u in set(v_users) if u not in wkf_u_set]
    print(f"  Video KOLs found in WKF: {len(v_users_in_wkf)} / {len(set(v_users))}")
    if v_users_not_in_wkf:
        print(f"  Video KOLs NOT in WKF: {v_users_not_in_wkf}")

    # --------------------------------------------------------------------------
    # 4. SHEET: Văn mẫu
    # --------------------------------------------------------------------------
    vm_rows = data['Văn mẫu']
    print(f"\n--- SHEET: Văn mẫu (Total rows: {len(vm_rows)}) ---")
    for idx, r in enumerate(vm_rows):
        cell_text = r[0]
        if cell_text:
            first_line = cell_text.split('\n')[0].strip()
            total_lines = len(cell_text.split('\n'))
            length = len(cell_text)
            print(f"  Template {idx+1} ({length} chars, {total_lines} lines): '{first_line[:80]}...'")

audit()
