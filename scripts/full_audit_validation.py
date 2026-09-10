import sys
sys.path.append('scripts')
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
        # Check if it's already a valid date string like YYYY-MM-DD or DD/MM/YYYY
        return val_str

def audit_all():
    data = parse_excel('WKF Nguyên Anh.xlsx')
    
    print("================================================================================")
    print("STEP 12 AUDIT & VALIDATION ANALYSIS")
    print("================================================================================")

    # 1. Sheet names & total row counts
    print("\n--- 1. SHEETS & ROW COUNTS ---")
    for s_name, rows in data.items():
        non_empty = [r for r in rows if any(c is not None and str(c).strip() != '' for c in r)]
        print(f"Sheet '{s_name}': {len(rows)} raw rows, {len(non_empty)} non-empty rows")

    # 2. WKF Detailed Validation
    wkf = data['WKF']
    header_wkf = wkf[0]
    data_rows_wkf = wkf[1:146] # rows 2 to 146
    trailing_wkf = wkf[146:]
    
    print(f"\n--- 2. WKF SHEET AUDIT (145 real data rows) ---")
    print(f"Header columns ({len(header_wkf)}): {[c for c in header_wkf if c]}")
    empty_cols = [idx for idx, c in enumerate(header_wkf) if not c]
    print(f"Empty/unnamed columns in header: {empty_cols}")
    
    # Check invalid dates
    invalid_dates = []
    for idx, r in enumerate(data_rows_wkf, start=2):
        for col_idx, col_name in [(2, 'Thời gian gửi sample'), (9, 'Ngày dự kiến nhận mẫu'), (10, 'Thời gian nhắc video'), (11, 'Thời gian đăng')]:
            val = r[col_idx]
            if val is not None and str(val).strip():
                d = excel_date(val)
                # verify format YYYY-MM-DD
                if not re.match(r'^\d{4}-\d{2}-\d{2}$', d):
                    invalid_dates.append((idx, r[3], col_name, val, d))
    print(f"Invalid dates in WKF: {len(invalid_dates)} (e.g. {invalid_dates[:5]})")

    # Check invalid booking fees
    invalid_fees = []
    for idx, r in enumerate(data_rows_wkf, start=2):
        f = r[5]
        if f is not None and str(f).strip():
            try:
                num_f = float(str(f).replace(',', '').strip())
                if num_f < 0:
                    invalid_fees.append((idx, r[3], f))
            except Exception:
                invalid_fees.append((idx, r[3], f))
    print(f"Invalid booking fees in WKF: {len(invalid_fees)} (e.g. {invalid_fees})")

    # Check CMS
    invalid_cms = []
    cms_parsed = []
    for idx, r in enumerate(data_rows_wkf, start=2):
        c = r[6]
        if c is not None and str(c).strip():
            c_str = str(c).strip()
            # Try parsing
            comm_match = re.search(r'(\d+(?:\.\d+)?)\s*%(?!\s*ads)', c_str, re.IGNORECASE)
            ads_match = re.search(r'ads\s*(\d+(?:\.\d+)?)\s*%|(\d+(?:\.\d+)?)\s*%\s*ads', c_str, re.IGNORECASE)
            
            comm = float(comm_match.group(1)) if comm_match else None
            ads = float(ads_match.group(1) or ads_match.group(2)) if ads_match else None
            
            if comm is None and ads is None:
                invalid_cms.append((idx, r[3], c_str))
            else:
                cms_parsed.append((comm, ads))
    print(f"Invalid CMS in WKF: {len(invalid_cms)}: {invalid_cms}")
    print(f"Valid parsed CMS in WKF: {len(cms_parsed)}")

    # Check Channel URLs in WKF
    channel_urls = []
    invalid_channel_urls = []
    for idx, r in enumerate(data_rows_wkf, start=2):
        url = r[4]
        if url and str(url).strip():
            url_str = str(url).strip()
            if not url_str.startswith('http'):
                invalid_channel_urls.append((idx, r[3], url_str))
            else:
                channel_urls.append(url_str)
    print(f"Channel URLs present in WKF: {len(channel_urls)} / 145")
    print(f"Invalid Channel URLs in WKF: {invalid_channel_urls}")

    # Check Status values in WKF
    status_counts = Counter([r[12].strip() if r[12] else '(EMPTY)' for r in data_rows_wkf])
    print(f"Status distribution in WKF: {dict(status_counts)}")

    # 3. data Sheet Detailed Validation
    data_sheet = data['data']
    print(f"\n--- 3. 'data' SHEET AUDIT (10 rows) ---")
    data_users = [r[3].strip() for r in data_sheet if r[3]]
    print(f"Usernames in 'data': {data_users}")
    data_statuses = Counter([r[12].strip() if r[12] else '(EMPTY)' for r in data_sheet])
    print(f"Status distribution in 'data': {dict(data_statuses)}")
    data_prods = Counter([r[8].strip() if r[8] else '(EMPTY)' for r in data_sheet])
    print(f"Product distribution in 'data': {dict(data_prods)}")

    # 4. Link air video Sheet Detailed Validation
    lav = data['Link air video']
    print(f"\n--- 4. 'Link air video' SHEET AUDIT (164 video rows) ---")
    valid_lav = [r for r in lav[1:] if r[3] and str(r[3]).strip()]
    print(f"Total rows with video URL: {len(valid_lav)}")
    
    # Check invalid video URLs
    invalid_video_urls = []
    for idx, r in enumerate(valid_lav, start=2):
        url = str(r[3]).strip()
        if not (url.startswith('https://www.tiktok.com/') or url.startswith('http')):
            invalid_video_urls.append((idx, r[1], url))
    print(f"Invalid video URLs: {len(invalid_video_urls)} (e.g. {invalid_video_urls})")

    # Check video IDs
    video_ids_present = [r[4] for r in valid_lav if r[4] and str(r[4]).strip()]
    print(f"Video IDs provided in Col 4: {len(video_ids_present)} / {len(valid_lav)}")
    # Extract video ID from URL
    extracted_ids = []
    for r in valid_lav:
        url = str(r[3]).strip()
        m = re.search(r'/video/(\d+)', url)
        if m:
            extracted_ids.append(m.group(1))
    print(f"Video IDs extracted from video URL: {len(extracted_ids)} / {len(valid_lav)}")

    # Ads Code distribution
    ads_codes = [r[5].strip() for r in valid_lav if r[5] and str(r[5]).strip()]
    print(f"Videos with Ads Code: {len(ads_codes)} / {len(valid_lav)} ({len(set(ads_codes))} unique)")

    # 5. Văn mẫu Sheet Detailed Validation
    vm = data['Văn mẫu']
    print(f"\n--- 5. 'Văn mẫu' SHEET AUDIT (19 raw rows) ---")
    valid_vm = [(idx, r[0].strip()) for idx, r in enumerate(vm) if r[0] and str(r[0]).strip()]
    print(f"Non-empty templates: {len(valid_vm)}")
    
    # Check duplicate templates
    template_texts = [v[1] for v in valid_vm]
    dup_templates = {t: c for t, c in Counter(template_texts).items() if c > 1}
    print(f"Exact duplicate templates: {len(dup_templates)}")
    for dt, count in dup_templates.items():
        print(f"  Exact dup ({count} times): '{dt[:60]}...'")

audit_all()
