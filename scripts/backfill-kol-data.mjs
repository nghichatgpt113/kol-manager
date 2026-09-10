/**
 * scripts/backfill-kol-data.mjs
 *
 * STEP 16 — EXECUTE KOL DATA BACKFILL (OPTION B)
 *
 * Enriches missing KOL profile data from authoritative Excel Notes:
 * 1. contact_phone: 153 updates (clean 10-digit phone)
 * 2. address: 144 updates (clean shipping/domicile address)
 * 3. display_name: 136 updates (verified real name from Note; 19 ambiguous/no-name retain username)
 *
 * Safety features:
 * - Pre-execution backup snapshot to backups/
 * - Deterministic, owner-scoped (test@gmail.com)
 * - Dry-run validation by default (requires --execute)
 * - Post-execution idempotency check
 * - Complete audit logging of every mutation
 */

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const SUPABASE_URL = "https://flyphduvyxyrphuklmdp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xlQ5U5KW6NXry3K24RbxcA_LHzRwF9m";

const DEFAULT_OWNER_EMAIL = "test@gmail.com";
const DEFAULT_OWNER_PASS = "123789";
const DEFAULT_FILE_PATH = "WKF Nguyên Anh.xlsx";

function parseArgs() {
  const args = process.argv.slice(2);
  let isDryRun = true;
  let ownerEmail = DEFAULT_OWNER_EMAIL;
  let filePath = DEFAULT_FILE_PATH;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--execute") {
      isDryRun = false;
    } else if (arg === "--dry-run") {
      isDryRun = true;
    } else if (arg === "--owner-email" && args[i + 1]) {
      ownerEmail = args[++i];
    } else if (arg === "--file" && args[i + 1]) {
      filePath = args[++i];
    }
  }

  return { isDryRun, ownerEmail, filePath };
}

// -----------------------------------------------------------------------------
// APPROVED DETERMINISTIC PARSER LOGIC
// -----------------------------------------------------------------------------

const ADDR_KEYWORDS = new Set([
  "số", "so", "thôn", "thon", "ấp", "ap", "khu", "toà", "tòa", "toa", 
  "xóm", "xom", "phòng", "phong", "chung", "hẻm", "hem", "ngõ", "ngo", "tổ", "to", 
  "sn", "kđt", "kdt", "gần", "gan", "địa", "dia", "đc", "dc", "đchi", "dchi", "đ/c", 
  "nhà", "nha", "kho", "trọ", "tro", "ngách", "ngach", "khóm", "khom", "p1112", "c159", 
  "c317p", "lk11-4", "b33", "275", "156", "44", "170/66", "01c", "26/32a", "127/41", 
  "53", "186g", "434/76/75", "245/11", "9/5", "472/26a", "117", "12aps1", "2549/28/1/7",
  "g01", "348", "38", "194", "16/29/15/5", "833357903", "205", "21/30/686", "215", "sn38a",
  "sn20", "566a/1", "27a/", "82/2e", "29/19/4", "373/42/8", "965/10", "1253", "sảnh",
  "phố", "pho", "vệ", "ve", "ct1a", "ct3", "gh2", "khách", "vựa", "chợ", "tiệm",
  "tỉnh", "thành", "huyện", "xã", "phường", "quận", "tp"
]);

const NOISE_WORDS = new Set(["dạ", "da", "koc", "sđt", "sdt", "lh", "lh:", "sđt:", "sdt:", "sđt.", "sdt."]);

function cleanNameStr(cand) {
  if (!cand) return "";
  let s = String(cand).trim();
  s = s.replace(/^[📌📍•\-–:,._+()\s]+/g, "").trim();
  s = s.replace(/[\s.\-–:]+(?:sđt|sdt|phone|số\s+điện\s+thoại|lh|địa\s+chỉ|đc|đchi|đ\/c|dc).*$/gi, "").trim();
  s = s.replace(/^(?:dạ\s+)?(?:chị|chi|anh|bé|be|em|mẹ)\s+/gi, "").trim();
  s = s.replace(/\s+(?:ạ|a|nha|nhe|nhé)$/gi, "").trim();
  s = s.replace(/[\-–:,._\+\(\)]+$/g, "").trim();
  s = s.replace(/^[\-–:,._\+\(\)]+/g, "").trim();
  return s;
}

function isValidName(cand) {
  if (!cand) return false;
  const words = cand.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  if (!words.every((w) => /^[A-ZÀ-Ỹa-zà-ỹ]+$/i.test(w))) return false;

  const lower = cand.toLowerCase();
  if (lower === "hà nội" || lower === "hồ chí minh" || lower === "đà nẵng") return false;

  const firstW = words[0].toLowerCase();
  const lastW = words[words.length - 1].toLowerCase();

  if (firstW === "hà" && lastW !== "nội") {
    // valid
  } else if (ADDR_KEYWORDS.has(firstW) || ADDR_KEYWORDS.has(lastW) || NOISE_WORDS.has(firstW)) {
    return false;
  }
  return true;
}

function parseRecipientNameImproved(text) {
  if (!text || !String(text).trim()) return { name: null, status: "NO_DATA" };
  const t = String(text).trim();

  // Pattern 1: Explicit name markers
  const markerMatch = t.match(/(?:Tên\s+người\s+nhận|Người\s+nhận|Họ\s+và\s+tên|Họ\s+tên|Tên\s*koc)\s*[:\-]?\s*([^\n,.;\-–\d]+)/i);
  if (markerMatch) {
    const cand = cleanNameStr(markerMatch[1]);
    if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
  }

  // Explicit short marker
  const shortMarkerMatch = t.match(/(?<![a-zA-ZÀ-Ỹà-ỹ])tên\s*[:\-]\s*([^\n,.;\-–\d]+)/i);
  if (shortMarkerMatch) {
    const cand = cleanNameStr(shortMarkerMatch[1]);
    if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
  }

  // Pattern 2: Name before explicit address marker
  const addrMarkerStart = t.match(/^([^\n\d]{2,30}?)\s*(?:DC|ĐC|Đ\/c|Đc|Địa\s*chỉ|Đchi|Địa\s*chỉ)\s*[:\.]/i);
  if (addrMarkerStart) {
    const cand = cleanNameStr(addrMarkerStart[1]);
    if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
  }

  const phoneRegex = /(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/g;
  const phones = [];
  let pMatch;
  while ((pMatch = phoneRegex.exec(t)) !== null) {
    phones.push({ index: pMatch.index, length: pMatch[0].length, text: pMatch[0] });
  }

  if (phones.length > 0) {
    const firstPhone = phones[0];
    const lastPhone = phones[phones.length - 1];

    if (phones.length >= 2) {
      const between = t.slice(firstPhone.index + firstPhone.length, phones[1].index).trim();
      const cand = cleanNameStr(between);
      if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
    }

    const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const linePhoneMatch = line.match(/(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/);
      if (linePhoneMatch) {
        const pre = line.slice(0, linePhoneMatch.index).trim();
        if (pre.length > 0) {
          const cand = cleanNameStr(pre);
          if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
        }
        const post = line.slice(linePhoneMatch.index + linePhoneMatch[0].length).trim();
        if (post.length > 0) {
          const postMatch = post.match(/^([A-ZÀ-Ỹa-zà-ỹ\s]{2,20}?)(?:[\s,.\-–]+(?:\d|ấp|thôn|xã|phường|quận|huyện|tỉnh|đường|g01|nhà|số|cầu\s+sắt)|$)/i);
          if (postMatch) {
            const cand = cleanNameStr(postMatch[1]);
            if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
          }
          const cand = cleanNameStr(post.split(/[\n,;]/)[0]);
          if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
        }
      }
    }

    const prefix = t.slice(0, firstPhone.index).trim();
    if (prefix.length > 0) {
      const preLines = prefix.split("\n").map((l) => l.trim()).filter(Boolean);
      const lastLine = preLines[preLines.length - 1];
      const cand = cleanNameStr(lastLine);
      if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };

      const nameAddrMatch = prefix.match(/^([A-ZÀ-Ỹa-zà-ỹ\s]{2,20}?)\s+(?:[\d]+[\/\-a-zA-Z\d]*\s+|(?:thôn|xã|huyện|tỉnh|quận|phường|tp|ấp|đường|ngõ|ngách|số|sn|khu|tổ|kiot|toà|tòa|chung|gần|vựa|pao|cạnh|hẻm|phong\s+phú)(?![a-zA-ZÀ-Ỹà-ỹ]))/i);
      if (nameAddrMatch) {
        const cand = cleanNameStr(nameAddrMatch[1]);
        if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
      }
    }

    const suffix = t.slice(lastPhone.index + lastPhone.length).trim();
    if (suffix.length > 0) {
      const sLines = suffix.split("\n").map((l) => l.trim()).filter(Boolean);
      const cand = cleanNameStr(sLines[0]);
      if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
    }
  }

  return { name: null, status: "AMBIGUOUS" };
}

function parseRecipientPhone(text) {
  if (!text || !String(text).trim()) return { phone: null, status: "NO_DATA" };
  const match = String(text).match(/(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/);
  if (match) {
    let digits = match[0].replace(/[^\d]/g, "");
    if (digits.startsWith("84")) {
      digits = "0" + digits.slice(2);
    } else if (!digits.startsWith("0")) {
      digits = "0" + digits;
    }
    if (digits.length === 10) {
      return { phone: digits, status: "SAFE_TO_FILL" };
    }
  }
  return { phone: null, status: "NO_DATA" };
}

function parseRecipientAddress(text) {
  if (!text || !String(text).trim()) return { address: null, status: "NO_DATA" };
  const t = String(text).trim();

  const cleanDigits = t.replace(/[\s.\-\/🔟4️⃣]+/g, "");
  if (/^\d{8,12}$/.test(cleanDigits)) return { address: null, status: "NO_DATA" };

  const lower = t.toLowerCase();
  if (lower.includes("địa chỉ mới:") || lower.includes("đc mới:") || lower.includes("đ/c mới:") || lower.includes("dc mới:")) {
    const mNew = t.match(/(?:Địa\s*chỉ\s*mới|Đc\s*mới|Đ\/c\s*mới|Dc\s*mới)\s*[:\.]?\s*([^\n]+)/i);
    if (mNew) {
      let cand = mNew[1].trim();
      cand = cand.replace(/[\s,.\-–]*(?:Sđt|SĐT|sdt|SDT|phone|lh|Liên hệ)[\s:.\-–]*\d[\d\s.\-]*$/gi, "").trim();
      cand = cand.replace(/\s*\(đ\/c mới\)\s*$/gi, "").trim();
      return { address: cand, status: "SAFE_TO_FILL" };
    }
  }

  if (lower.includes("(sau sáp nhập):")) {
    const mAfter = t.match(/\(sau\s*sáp\s*nhập\)\s*[:\.]?\s*([^\n]+)/i);
    if (mAfter) return { address: mAfter[1].trim(), status: "SAFE_TO_FILL" };
  }

  const markerMatch = t.match(/(?<![a-zA-ZÀ-Ỹà-ỹ])(?:Địa\s*chỉ\s*nhận\s*hàng|Địa\s*chỉ|Đ\/c|Đchi|Đc|DC|ĐC)\s*[:\.]?\s*/i);
  if (markerMatch) {
    const startIdx = markerMatch.index + markerMatch[0].length;
    const before = t.slice(0, markerMatch.index).toLowerCase();
    if (!before.endsWith("gọi ")) {
      let rawAddr = t.slice(startIdx).trim();
      rawAddr = rawAddr.replace(/[\s,.\-–]*(?:Sđt|SĐT|sdt|SDT|phone|lh|Liên hệ)[\s:.\-–]*\d[\d\s.\-]*$/gi, "").trim();
      rawAddr = rawAddr.replace(/[\s,.\-–]*(?:0|84)[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}\s*$/g, "").trim();
      rawAddr = rawAddr.replace(/\s+Thanh$/g, "").trim();
      if (rawAddr.length > 5 && !rawAddr.startsWith("trước sáp nhập")) {
        return { address: rawAddr, status: "SAFE_TO_FILL" };
      }
    }
  }

  const phoneMatch = t.match(/(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/);
  if (phoneMatch) {
    const afterPhone = t.slice(phoneMatch.index + phoneMatch[0].length).trim();
    const beforePhone = t.slice(0, phoneMatch.index).trim();

    if (afterPhone.length > 10) {
      let cand = afterPhone.replace(/^[\s,.\-–:]+/, "").trim();
      cand = cand.replace(/[\s,.\-–]*(?:0|84)[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}.*$/g, "").trim();
      return { address: cand, status: "SAFE_TO_FILL" };
    }
    if (beforePhone.length > 10) {
      return { address: beforePhone.replace(/[\s,.\-–:]+$/, "").trim(), status: "SAFE_TO_FILL" };
    }
  }

  return { address: null, status: "NO_DATA" };
}

// -----------------------------------------------------------------------------
// MAIN BACKFILL RUNNER
// -----------------------------------------------------------------------------

async function main() {
  const { isDryRun, ownerEmail, filePath } = parseArgs();

  console.log("================================================================================");
  console.log(`STEP 16 — KOL DATA BACKFILL (${isDryRun ? "DRY-RUN ONLY" : "EXECUTION MODE"})`);
  console.log("================================================================================");
  console.log(`Owner: ${ownerEmail}`);
  console.log(`File:  ${filePath}`);

  // 1. Authenticate
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password: DEFAULT_OWNER_PASS,
  });

  if (authErr || !auth?.user) {
    console.error("Xác thực thất bại:", authErr?.message);
    process.exit(1);
  }

  const userId = auth.user.id;
  console.log(`Đã đăng nhập: User ID ${userId}`);

  // 2. Fetch current KOLs
  const { data: dbKols, error: kolErr } = await supabase
    .from("kols")
    .select("*")
    .eq("user_id", userId)
    .order("username");

  if (kolErr || !dbKols) {
    console.error("Lỗi tải KOL:", kolErr?.message);
    process.exit(1);
  }

  console.log(`Số lượng KOL hiện tại trong DB: ${dbKols.length}`);

  // 3. Pre-execution backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  if (!fs.existsSync("backups")) {
    fs.mkdirSync("backups", { recursive: true });
  }
  const backupPath = path.join("backups", `kols-backup-before-step16-enrichment-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(dbKols, null, 2));
  console.log(`Đã lưu bản sao lưu an toàn tại: ${backupPath}`);

  // 4. Load Excel
  const stdout = execSync(`python3 scripts/export_excel.py "${filePath}"`, {
    maxBuffer: 50 * 1024 * 1024,
  }).toString();
  const excelData = JSON.parse(stdout);
  const wkf = (excelData["WKF"] || []).slice(1, 146);
  const dataSheet = excelData["data"] || [];

  const rows = [];
  for (let i = 0; i < wkf.length; i++) {
    const monthStr = String(wkf[i][1] || "");
    const monthCode = monthStr.includes("9") ? "202609" : "202608";
    const code = `BK-${monthCode}-${String(i + 1).padStart(4, "0")}`;
    rows.push({
      code,
      sheet: "WKF",
      rowNum: i + 2,
      username: String(wkf[i][3] || "").trim().toLowerCase().replace(/\s+/g, ""),
      rawNote: wkf[i][15],
    });
  }
  for (let i = 0; i < dataSheet.length; i++) {
    const code = `BK-202608-${String(146 + i).padStart(4, "0")}`;
    rows.push({
      code,
      sheet: "data",
      rowNum: i + 1,
      username: String(dataSheet[i][3] || "").trim().toLowerCase().replace(/\s+/g, ""),
      rawNote: dataSheet[i][15],
    });
  }

  console.log(`Số dòng Excel đã ánh xạ: ${rows.length}`);

  // 5. Calculate candidate mutations for each KOL
  const plannedMutations = [];
  let phoneUpdatesCount = 0;
  let addressUpdatesCount = 0;
  let displayNameUpdatesCount = 0;

  for (const kol of dbKols) {
    const u = kol.username.toLowerCase().trim();
    const matchingRows = rows.filter(r => r.username === u);

    if (matchingRows.length === 0) {
      // Manual KOL, untouched
      continue;
    }

    const rowResults = matchingRows.map(r => ({
      code: r.code,
      sheet: r.sheet,
      rawNote: r.rawNote,
      phoneRes: parseRecipientPhone(r.rawNote),
      addrRes: parseRecipientAddress(r.rawNote),
      nameRes: parseRecipientNameImproved(r.rawNote),
    }));

    const phones = [...new Set(rowResults.map(rr => rr.phoneRes.phone).filter(Boolean))];
    const addresses = [...new Set(rowResults.map(rr => rr.addrRes.address).filter(Boolean))];
    const names = [...new Set(rowResults.map(rr => rr.nameRes.name).filter(Boolean))];

    const updates = {};
    const beforeState = {};

    // Check phone
    if (phones.length === 1) {
      const newPhone = phones[0];
      if (kol.contact_phone !== newPhone) {
        updates.contact_phone = newPhone;
        beforeState.contact_phone = kol.contact_phone;
        phoneUpdatesCount++;
      }
    }

    // Check address
    if (addresses.length === 1) {
      const newAddress = addresses[0];
      if (kol.address !== newAddress) {
        updates.address = newAddress;
        beforeState.address = kol.address;
        addressUpdatesCount++;
      }
    }

    // Check display_name (Option B)
    if (names.length === 1) {
      const newName = names[0];
      if (kol.display_name !== newName) {
        updates.display_name = newName;
        beforeState.display_name = kol.display_name;
        displayNameUpdatesCount++;
      }
    }

    if (Object.keys(updates).length > 0) {
      plannedMutations.push({
        kol_id: kol.id,
        username: kol.username,
        before: beforeState,
        updates,
        rows: matchingRows.map(r => r.code),
      });
    }
  }

  const totalFieldMutations = phoneUpdatesCount + addressUpdatesCount + displayNameUpdatesCount;

  console.log("\n--------------------------------------------------------------------------------");
  console.log("KẾT QUẢ TÍNH TOÁN KẾ HOẠCH BACKFILL:");
  console.log("--------------------------------------------------------------------------------");
  console.log(`Số lượng KOL cần cập nhật:        ${plannedMutations.length}`);
  console.log(`Cập nhật contact_phone:           ${phoneUpdatesCount} (kỳ vọng: 153)`);
  console.log(`Cập nhật address:                 ${addressUpdatesCount} (kỳ vọng: 144)`);
  console.log(`Cập nhật display_name:            ${displayNameUpdatesCount} (kỳ vọng: 136)`);
  console.log(`TỔNG SỐ TRƯỜNG CẬP NHẬT:          ${totalFieldMutations} (kỳ vọng: 433)`);

  // Verify baseline
  const EXPECTED_PHONES = 153;
  const EXPECTED_ADDRESSES = 144;
  const EXPECTED_NAMES = 136;
  const EXPECTED_TOTAL = 433;
  const EXPECTED_AFFECTED_KOLS = 153;

  if (
    phoneUpdatesCount !== EXPECTED_PHONES ||
    addressUpdatesCount !== EXPECTED_ADDRESSES ||
    displayNameUpdatesCount !== EXPECTED_NAMES ||
    totalFieldMutations !== EXPECTED_TOTAL ||
    plannedMutations.length !== EXPECTED_AFFECTED_KOLS
  ) {
    console.error("CẢNH BÁO: Kế hoạch không khớp với baseline đã được phê duyệt!");
    console.error(`Kỳ vọng: ${EXPECTED_TOTAL} cập nhật trên ${EXPECTED_AFFECTED_KOLS} KOLs.`);
    console.error(`Thực tế: ${totalFieldMutations} cập nhật trên ${plannedMutations.length} KOLs.`);
    process.exit(1);
  }

  console.log("\n✓ Kế hoạch khớp 100% với baseline đã được phê duyệt!");

  if (isDryRun) {
    console.log("\n[DRY-RUN] Hoàn tất kiểm tra an toàn. Không có thay đổi nào được thực hiện trên cơ sở dữ liệu.");
    console.log("Để thực thi, chạy lại với tham số: --execute");
    return;
  }

  // 6. EXECUTE MUTATIONS
  console.log("\n================================================================================");
  console.log("ĐANG THỰC THI CẬP NHẬT LÊN SUPABASE...");
  console.log("================================================================================");

  const mutationLog = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < plannedMutations.length; i++) {
    const item = plannedMutations[i];
    const { error: updErr } = await supabase
      .from("kols")
      .update(item.updates)
      .eq("id", item.kol_id)
      .eq("user_id", userId);

    if (updErr) {
      failCount++;
      console.error(`[THẤT BẠI] @${item.username}:`, updErr.message);
      mutationLog.push({
        status: "FAILED",
        kol_id: item.kol_id,
        username: item.username,
        error: updErr.message,
        updates: item.updates,
      });
    } else {
      successCount++;
      mutationLog.push({
        status: "SUCCESS",
        kol_id: item.kol_id,
        username: item.username,
        before: item.before,
        after: item.updates,
      });
      if ((i + 1) % 25 === 0 || i + 1 === plannedMutations.length) {
        console.log(`Đã xử lý: ${i + 1}/${plannedMutations.length} KOLs...`);
      }
    }
  }

  const logPath = path.join("backups", `kol-backfill-mutation-log-${timestamp}.json`);
  fs.writeFileSync(logPath, JSON.stringify(mutationLog, null, 2));

  console.log("\n================================================================================");
  console.log("HOÀN TẤT THỰC THI CẬP NHẬT");
  console.log("================================================================================");
  console.log(`KOL cập nhật thành công: ${successCount}`);
  console.log(`KOL cập nhật thất bại:   ${failCount}`);
  console.log(`Nhật ký chi tiết đã lưu tại: ${logPath}`);

  if (failCount > 0) {
    console.error("Quá trình thực thi có lỗi!");
    process.exit(1);
  }

  // 7. POST-EXECUTION IDEMPOTENCY VERIFICATION
  console.log("\nĐang kiểm tra tính lũy đòn (idempotency dry-run)...");
  const { data: postKols } = await supabase
    .from("kols")
    .select("*")
    .eq("user_id", userId);

  let reRunMutations = 0;
  for (const kol of postKols) {
    const u = kol.username.toLowerCase().trim();
    const matchingRows = rows.filter(r => r.username === u);
    if (matchingRows.length === 0) continue;

    const rowResults = matchingRows.map(r => ({
      phoneRes: parseRecipientPhone(r.rawNote),
      addrRes: parseRecipientAddress(r.rawNote),
      nameRes: parseRecipientNameImproved(r.rawNote),
    }));

    const phones = [...new Set(rowResults.map(rr => rr.phoneRes.phone).filter(Boolean))];
    const addresses = [...new Set(rowResults.map(rr => rr.addrRes.address).filter(Boolean))];
    const names = [...new Set(rowResults.map(rr => rr.nameRes.name).filter(Boolean))];

    if (phones.length === 1 && kol.contact_phone !== phones[0]) reRunMutations++;
    if (addresses.length === 1 && kol.address !== addresses[0]) reRunMutations++;
    if (names.length === 1 && kol.display_name !== names[0]) reRunMutations++;
  }

  console.log(`Số trường cần cập nhật khi chạy lại: ${reRunMutations} (kỳ vọng: 0)`);
  if (reRunMutations === 0) {
    console.log("✓ Tính lũy đòn được bảo đảm tuyệt đối!");
  } else {
    console.error("CẢNH BÁO: Tính lũy đòn không đạt yêu cầu!");
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Lỗi không mong muốn:", err);
  process.exit(1);
});
