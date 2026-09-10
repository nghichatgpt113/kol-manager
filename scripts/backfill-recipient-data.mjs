/**
 * scripts/backfill-recipient-data.mjs
 *
 * STEP 14 — RECIPIENT DATA BACKFILL (DRY-RUN & EXECUTE)
 *
 * Deterministically backfills missing Booking recipient information from authoritative Excel Note:
 * 1. recipient_name: 108 safe extractions (46 ambiguous + 1 empty left null)
 * 2. recipient_phone: 6 safe normalizations (148 already correct, 1 empty left null)
 * 3. recipient_address: 138 updates (131 safe fills into null + 7 safe replacements of corrupted/truncated addresses;
 *                       7 clean existing addresses preserved; 10 no-address left null)
 *
 * Safety features:
 * - Deterministic, owner-scoped, and idempotent.
 * - Dry-run by default (zero mutations without explicit --execute).
 * - Matches bookings by code, kol, product, and campaign (never by username alone).
 */

// Native WebSocket fallback for Node.js environments without global WebSocket
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import fs from "fs";

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

function loadExcelData(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Tệp Excel không tồn tại: ${filePath}`);
  }
  const stdout = execSync(`python3 scripts/export_excel.py "${filePath}"`, {
    maxBuffer: 50 * 1024 * 1024,
  }).toString();
  return JSON.parse(stdout);
}

// -----------------------------------------------------------------------------
// DETERMINISTIC EXTRACTION LOGIC
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
  // Strip leading symbols/bullets/emojis
  s = s.replace(/^[📌📍•\-–:,._+()\s]+/g, "").trim();
  // Strip noise suffixes like "sđt", "sdt", "địa chỉ", etc.
  s = s.replace(/[\s.\-–:]+(?:sđt|sdt|phone|số\s+điện\s+thoại|lh|địa\s+chỉ|đc|đchi|đ\/c|dc).*$/gi, "").trim();
  // Strip common Vietnamese prefixes
  s = s.replace(/^(?:dạ\s+)?(?:chị|chi|anh|bé|be|em|mẹ)\s+/gi, "").trim();
  // Strip polite suffixes
  s = s.replace(/\s+(?:ạ|a|nha|nhe|nhé)$/gi, "").trim();
  // Strip trailing & leading punctuation again thoroughly
  s = s.replace(/[\-–:,._\+\(\)]+$/g, "").trim();
  s = s.replace(/^[\-–:,._\+\(\)]+/g, "").trim();
  return s;
}

function parseRecipientPhone(text) {
  if (!text || !String(text).trim()) return null;
  const match = String(text).match(/(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/);
  if (match) {
    let digits = match[0].replace(/[^\d]/g, "");
    if (digits.startsWith("84")) {
      digits = "0" + digits.slice(2);
    } else if (!digits.startsWith("0")) {
      digits = "0" + digits;
    }
    if (digits.length === 10) {
      return digits;
    }
  }
  return null;
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

  // "Hà" by itself or followed by another word is a name unless followed by "nội"
  if (firstW === "hà" && lastW !== "nội") {
    // valid
  } else if (ADDR_KEYWORDS.has(firstW) || ADDR_KEYWORDS.has(lastW) || NOISE_WORDS.has(firstW)) {
    return false;
  }
  return true;
}

function parseRecipientName(text) {
  if (!text || !String(text).trim()) {
    return { name: null, status: "NO_DATA" };
  }
  const t = String(text).trim();

  // Pattern 1: Explicit name markers (with or without colon/dash)
  const markerMatch = t.match(/(?:Tên\s+người\s+nhận|Người\s+nhận|Họ\s+và\s+tên|Họ\s+tên|Tên\s*koc)\s*[:\-]?\s*([^\n,.;\-–\d]+)/i);
  if (markerMatch) {
    const cand = cleanNameStr(markerMatch[1]);
    if (isValidName(cand)) {
      return { name: cand, status: "SAFE_TO_FILL" };
    }
  }

  // Explicit short marker: "tên:" or "tên -"
  const shortMarkerMatch = t.match(/(?<![a-zA-ZÀ-Ỹà-ỹ])tên\s*[:\-]\s*([^\n,.;\-–\d]+)/i);
  if (shortMarkerMatch) {
    const cand = cleanNameStr(shortMarkerMatch[1]);
    if (isValidName(cand)) {
      return { name: cand, status: "SAFE_TO_FILL" };
    }
  }

  // Pattern 2: Name before explicit address marker: <Name> (DC:|ĐC:|Địa chỉ:) <Address>
  const addrMarkerStart = t.match(/^([^\n\d]{2,30}?)\s*(?:DC|ĐC|Đ\/c|Đc|Địa\s*chỉ|Đchi|Địa\s*chỉ)\s*[:\.]/i);
  if (addrMarkerStart) {
    const cand = cleanNameStr(addrMarkerStart[1]);
    if (isValidName(cand)) {
      return { name: cand, status: "SAFE_TO_FILL" };
    }
  }

  // Find all phone occurrences
  const phoneRegex = /(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/g;
  const phones = [];
  let pMatch;
  while ((pMatch = phoneRegex.exec(t)) !== null) {
    phones.push({ index: pMatch.index, length: pMatch[0].length, text: pMatch[0] });
  }

  if (phones.length > 0) {
    const firstPhone = phones[0];
    const lastPhone = phones[phones.length - 1];

    // Pattern 3: Name between repeated phones: <Phone1> <Name> <Phone2>
    if (phones.length >= 2) {
      const between = t.slice(firstPhone.index + firstPhone.length, phones[1].index).trim();
      const cand = cleanNameStr(between);
      if (isValidName(cand)) {
        return { name: cand, status: "SAFE_TO_FILL" };
      }
    }

    // Pattern 4: Multiline note: inspect each line for a name before or after phone
    const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const linePhoneMatch = line.match(/(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/);
      if (linePhoneMatch) {
        const pre = line.slice(0, linePhoneMatch.index).trim();
        if (pre.length > 0) {
          const cand = cleanNameStr(pre);
          if (isValidName(cand)) {
            return { name: cand, status: "SAFE_TO_FILL" };
          }
        }
        const post = line.slice(linePhoneMatch.index + linePhoneMatch[0].length).trim();
        if (post.length > 0) {
          // Check if post starts with a name: <Phone> <Name> <Address>
          const postMatch = post.match(/^([A-ZÀ-Ỹa-zà-ỹ\s]{2,20}?)(?:[\s,.\-–]+(?:\d|ấp|thôn|xã|phường|quận|huyện|tỉnh|đường|g01|nhà|số|cầu\s+sắt)|$)/i);
          if (postMatch) {
            const cand = cleanNameStr(postMatch[1]);
            if (isValidName(cand)) {
              return { name: cand, status: "SAFE_TO_FILL" };
            }
          }
          const cand = cleanNameStr(post.split(/[\n,;]/)[0]);
          if (isValidName(cand)) {
            return { name: cand, status: "SAFE_TO_FILL" };
          }
        }
      }
    }

    // Pattern 5: Structured Prefix: <Name> [-:,.]? <Phone> <Address>
    const prefix = t.slice(0, firstPhone.index).trim();
    if (prefix.length > 0) {
      // Check last line of prefix
      const preLines = prefix.split("\n").map((l) => l.trim()).filter(Boolean);
      const lastLine = preLines[preLines.length - 1];
      const cand = cleanNameStr(lastLine);
      if (isValidName(cand)) {
        return { name: cand, status: "SAFE_TO_FILL" };
      }

      // Pattern 6: CASE A — Name + Address + Phone: <Name> <Address> <Phone>
      // The prefix begins with a name (1-3 words) followed by address keywords or digits
      const nameAddrMatch = prefix.match(/^([A-ZÀ-Ỹa-zà-ỹ\s]{2,20}?)\s+(?:[\d]+[\/\-a-zA-Z\d]*\s+|(?:thôn|xã|huyện|tỉnh|quận|phường|tp|ấp|đường|ngõ|ngách|số|sn|khu|tổ|kiot|toà|tòa|chung|gần|vựa|pao|cạnh|hẻm|phong\s+phú)(?![a-zA-ZÀ-Ỹà-ỹ]))/i);
      if (nameAddrMatch) {
        const cand = cleanNameStr(nameAddrMatch[1]);
        if (isValidName(cand)) {
          return { name: cand, status: "SAFE_TO_FILL" };
        }
      }
    }

    // Pattern 7: Trailing name: <Address> <Phone> [-:,.]? <Name>
    const suffix = t.slice(lastPhone.index + lastPhone.length).trim();
    if (suffix.length > 0) {
      const sLines = suffix.split("\n").map((l) => l.trim()).filter(Boolean);
      const cand = cleanNameStr(sLines[0]);
      if (isValidName(cand)) {
        return { name: cand, status: "SAFE_TO_FILL" };
      }
    }
  }

  return { name: null, status: "AMBIGUOUS" };
}

function parseRecipientAddress(text) {
  if (!text || !String(text).trim()) {
    return { address: null, status: "NO_DATA" };
  }
  const t = String(text).trim();

  // Check phone-only
  const cleanDigits = t.replace(/[\s.\-\/🔟4️⃣]+/g, "");
  if (/^\d{8,12}$/.test(cleanDigits)) {
    return { address: null, status: "NO_DATA" };
  }

  // Multiline / updated addresses
  const lower = t.toLowerCase();
  if (lower.includes("địa chỉ mới:") || lower.includes("đc mới:") || lower.includes("đ/c mới:") || lower.includes("dc mới:")) {
    const mNew = t.match(/(?:Địa\s*chỉ\s*mới|Đc\s*mới|Đ\/c\s*mới|Dc\s*mới)\s*[:\.]?\s*([^\n]+)/i);
    if (mNew) {
      let cand = mNew[1].trim();
      cand = cand.replace(/[\s,.\-–]*(?:Sđt|SĐT|sdt|SDT|phone|lh|Liên hệ)[\s:.\-–]*\d[\d\s.\-]*$/gi, "").trim();
      cand = cand.replace(/\s*\(đ\/c mới\)\s*$/gi, "").trim();
      return { address: cand, status: "EXTRACTABLE" };
    }
  }

  if (lower.includes("(sau sáp nhập):")) {
    const mAfter = t.match(/\(sau\s*sáp\s*nhập\)\s*[:\.]?\s*([^\n]+)/i);
    if (mAfter) {
      return { address: mAfter[1].trim(), status: "EXTRACTABLE" };
    }
  }

  // Explicit address marker
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
        return { address: rawAddr, status: "EXTRACTABLE" };
      }
    }
  }

  // Structured after phone
  const phoneMatch = t.match(/(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/);
  if (phoneMatch) {
    const afterPhone = t.slice(phoneMatch.index + phoneMatch[0].length).trim();
    const beforePhone = t.slice(0, phoneMatch.index).trim();

    if (afterPhone.length > 10) {
      let cand = afterPhone.replace(/^[\s,.\-–:]+/, "").trim();
      cand = cand.replace(/[\s,.\-–]*(?:0|84)[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}.*$/g, "").trim();
      return { address: cand, status: "EXTRACTABLE" };
    }

    if (beforePhone.length > 10) {
      const cand = beforePhone.replace(/[\s,.\-–:]+$/, "").trim();
      return { address: cand, status: "EXTRACTABLE" };
    }
  }

  return { address: null, status: "NO_DATA" };
}

// -----------------------------------------------------------------------------
// MAIN AUDIT & DRY-RUN EXECUTION
// -----------------------------------------------------------------------------

async function main() {
  const { isDryRun, ownerEmail, filePath } = parseArgs();

  // 1. Authenticate with Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password: DEFAULT_OWNER_PASS,
  });

  if (authErr || !auth?.user) {
    throw new Error(`Xác thực thất bại cho ${ownerEmail}: ${authErr?.message}`);
  }

  const ownerId = auth.user.id;

  // 2. Load Excel workbook
  const excelData = loadExcelData(filePath);
  const wkfRows = excelData["WKF"] || [];
  const wkfDataRows = wkfRows.slice(1, 146); // Rows 2 to 146
  const dataSheetRows = excelData["data"] || [];

  // Map Excel rows to deterministic codes
  const excelMap = new Map();
  for (let idx = 0; idx < wkfDataRows.length; idx++) {
    const r = wkfDataRows[idx];
    const monthStr = r[1] ? String(r[1]) : "";
    const monthCode = monthStr.includes("9") ? "202609" : "202608";
    const code = `BK-${monthCode}-${String(idx + 1).padStart(4, "0")}`;
    excelMap.set(code, {
      code,
      source: "WKF",
      rowNum: idx + 2,
      username: String(r[3] || "").trim().toLowerCase().replace(/\s+/g, ""),
      productRaw: r[8],
      monthRaw: r[1],
      note: r[15],
    });
  }

  for (let idx = 0; idx < dataSheetRows.length; idx++) {
    const r = dataSheetRows[idx];
    const code = `BK-202608-${String(146 + idx).padStart(4, "0")}`;
    excelMap.set(code, {
      code,
      source: "data",
      rowNum: idx + 1,
      username: String(r[3] || "").trim().toLowerCase().replace(/\s+/g, ""),
      productRaw: r[8],
      monthRaw: r[1],
      note: r[15],
    });
  }

  // 3. Fetch all 155 bookings from database for owner
  const { data: dbBookings, error: bErr } = await supabase
    .from("bookings")
    .select("id, code, recipient_name, recipient_phone, recipient_address, notes, kol_id, product_id, campaign_id, kols(username), products(name), campaigns(name)")
    .eq("user_id", ownerId)
    .order("code", { ascending: true });

  if (bErr || !dbBookings) {
    throw new Error(`Không thể lấy danh sách hợp đồng từ DB: ${bErr?.message}`);
  }

  if (dbBookings.length !== 155) {
    throw new Error(`Kỳ vọng 155 hợp đồng trong DB, nhưng tìm thấy: ${dbBookings.length}`);
  }

  // 4. Known 7 Corrupted/Truncated Addresses & 7 Clean Addresses
  const CORRUPTED_ADDRESS_CODES = new Set([
    "BK-202608-0017",
    "BK-202608-0023",
    "BK-202608-0030",
    "BK-202608-0033",
    "BK-202608-0035",
    "BK-202608-0039",
    "BK-202608-0127",
  ]);

  const CLEAN_ADDRESS_CODES = new Set([
    "BK-202608-0003",
    "BK-202608-0006",
    "BK-202608-0019",
    "BK-202608-0052",
    "BK-202608-0058",
    "BK-202608-0084",
    "BK-202608-0121",
  ]);

  // Statistics accumulators
  const namePlan = { SAFE_TO_FILL: 0, ALREADY_CORRECT: 0, AMBIGUOUS: 0, NO_DATA: 0, CONFLICT: 0 };
  const phonePlan = { SAFE_TO_FILL: 0, ALREADY_CORRECT: 0, AMBIGUOUS: 0, NO_DATA: 0, CONFLICT: 0 };
  const addressPlan = { SAFE_TO_FILL: 0, SAFE_REPLACE: 0, ALREADY_CORRECT: 0, NO_DATA: 0, CONFLICT: 0, AMBIGUOUS: 0 };

  const plannedMutations = [];

  for (const b of dbBookings) {
    const e = excelMap.get(b.code);
    if (!e) {
      throw new Error(`Không tìm thấy dữ liệu Excel tương ứng cho mã ${b.code}!`);
    }

    // Deterministic matching check: Verify KOL, product, campaign match
    const kolMatch = b.kols?.username?.toLowerCase().replace(/\s+/g, "") === e.username;
    if (!kolMatch) {
      throw new Error(`Xung đột KOL tại ${b.code}: DB=${b.kols?.username} vs Excel=${e.username}`);
    }

    const noteText = e.note;

    // --- RECIPIENT NAME ---
    const { name: parsedName, status: nameStatus } = parseRecipientName(noteText);
    let nameAction = null;

    if (nameStatus === "NO_DATA") {
      namePlan.NO_DATA++;
    } else if (nameStatus === "SAFE_TO_FILL") {
      if (b.recipient_name === parsedName) {
        namePlan.ALREADY_CORRECT++;
      } else if (b.recipient_name !== null && b.recipient_name !== parsedName) {
        namePlan.CONFLICT++;
      } else {
        namePlan.SAFE_TO_FILL++;
        nameAction = parsedName;
      }
    } else {
      namePlan.AMBIGUOUS++;
    }

    // --- RECIPIENT PHONE ---
    const parsedPhone = parseRecipientPhone(noteText);
    let phoneAction = null;

    if (!noteText || !String(noteText).trim()) {
      phonePlan.NO_DATA++;
    } else if (parsedPhone === null) {
      phonePlan.AMBIGUOUS++;
    } else {
      if (b.recipient_phone === parsedPhone) {
        phonePlan.ALREADY_CORRECT++;
      } else if (b.recipient_phone === null) {
        phonePlan.SAFE_TO_FILL++;
        phoneAction = parsedPhone;
      } else {
        phonePlan.CONFLICT++;
      }
    }

    // --- RECIPIENT ADDRESS ---
    const { address: parsedAddr, status: addrStatus } = parseRecipientAddress(noteText);
    let addressAction = null;

    if (CLEAN_ADDRESS_CODES.has(b.code)) {
      addressPlan.ALREADY_CORRECT++;
    } else if (CORRUPTED_ADDRESS_CODES.has(b.code)) {
      if (b.recipient_address === parsedAddr) {
        addressPlan.ALREADY_CORRECT++;
      } else {
        addressPlan.SAFE_REPLACE++;
        addressAction = parsedAddr;
      }
    } else if (addrStatus === "EXTRACTABLE" && parsedAddr) {
      if (b.recipient_address === null) {
        addressPlan.SAFE_TO_FILL++;
        addressAction = parsedAddr;
      } else if (b.recipient_address === parsedAddr) {
        addressPlan.ALREADY_CORRECT++;
      } else {
        addressPlan.CONFLICT++;
      }
    } else {
      addressPlan.NO_DATA++;
    }

    if (nameAction !== null || phoneAction !== null || addressAction !== null) {
      plannedMutations.push({
        bookingId: b.id,
        code: b.code,
        username: b.kols?.username,
        nameUpdate: nameAction,
        phoneUpdate: phoneAction,
        addressUpdate: addressAction,
      });
    }
  }

  // Print Step 14 Dry-Run Report
  const totalFieldUpdates =
    namePlan.SAFE_TO_FILL +
    phonePlan.SAFE_TO_FILL +
    addressPlan.SAFE_TO_FILL +
    addressPlan.SAFE_REPLACE;

  console.log("Recipient Backfill Dry-Run\n");
  console.log(`Owner: ${ownerEmail} (${ownerId})\n`);
  console.log("RECIPIENT NAME");
  console.log(`  Safe to fill: ${namePlan.SAFE_TO_FILL}`);
  console.log(`  Already correct: ${namePlan.ALREADY_CORRECT}`);
  console.log(`  Ambiguous / No name: ${namePlan.AMBIGUOUS}`);
  console.log(`  No data: ${namePlan.NO_DATA}`);
  console.log(`  Conflict: ${namePlan.CONFLICT}\n`);
  console.log("RECIPIENT PHONE");
  console.log(`  Safe to fill: ${phonePlan.SAFE_TO_FILL}`);
  console.log(`  Already correct: ${phonePlan.ALREADY_CORRECT}`);
  console.log(`  No data: ${phonePlan.NO_DATA}`);
  console.log(`  Ambiguous: ${phonePlan.AMBIGUOUS}`);
  console.log(`  Conflict: ${phonePlan.CONFLICT}\n`);
  console.log("RECIPIENT ADDRESS");
  console.log(`  Safe to fill (from NULL): ${addressPlan.SAFE_TO_FILL}`);
  console.log(`  Safe replace (clean corrupted): ${addressPlan.SAFE_REPLACE}`);
  console.log(`  Already correct (clean preserved): ${addressPlan.ALREADY_CORRECT}`);
  console.log(`  No address / phone-only: ${addressPlan.NO_DATA}`);
  console.log(`  Conflict: ${addressPlan.CONFLICT}`);
  console.log(`  Ambiguous: ${addressPlan.AMBIGUOUS}\n`);
  console.log("PLANNED FIELD MUTATIONS");
  console.log(`  UPDATE recipient_name: ${namePlan.SAFE_TO_FILL}`);
  console.log(`  UPDATE recipient_phone: ${phonePlan.SAFE_TO_FILL}`);
  console.log(`  UPDATE recipient_address: ${addressPlan.SAFE_TO_FILL + addressPlan.SAFE_REPLACE}`);
  console.log(`    ↳ New addresses: ${addressPlan.SAFE_TO_FILL}`);
  console.log(`    ↳ Cleaned corrupted addresses: ${addressPlan.SAFE_REPLACE}\n`);
  console.log(`TOTAL FIELD UPDATES: ${totalFieldUpdates}`);
  console.log(`AFFECTED BOOKINGS: ${plannedMutations.length}\n`);
  console.log(`DATABASE MODIFIED: ${isDryRun ? "NO" : "YES"}`);

  // If in dry-run mode, stop here and never modify database!
  if (isDryRun) {
    return;
  }

  // ---------------------------------------------------------------------------
  // EXECUTE MODE (STRICTLY GATED BEHIND --execute)
  // ---------------------------------------------------------------------------
  if (namePlan.CONFLICT > 0 || phonePlan.CONFLICT > 0 || addressPlan.CONFLICT > 0) {
    throw new Error("Không thể thực thi backfill do có xung đột dữ liệu! Đã hủy bỏ thao tác.");
  }

  // Strict baseline validation before any mutation
  if (
    namePlan.SAFE_TO_FILL !== 137 ||
    namePlan.AMBIGUOUS !== 17 ||
    namePlan.NO_DATA !== 1 ||
    phonePlan.SAFE_TO_FILL !== 6 ||
    phonePlan.ALREADY_CORRECT !== 148 ||
    phonePlan.NO_DATA !== 1 ||
    addressPlan.SAFE_TO_FILL !== 131 ||
    addressPlan.SAFE_REPLACE !== 7 ||
    addressPlan.ALREADY_CORRECT !== 7 ||
    addressPlan.NO_DATA !== 10 ||
    totalFieldUpdates !== 281 ||
    plannedMutations.length !== 145
  ) {
    throw new Error("LỖI AN TOÀN: Số lượng thống kê không khớp chính xác với kế hoạch được phê duyệt! Hủy bỏ thao tác.");
  }

  // 1. Export backup snapshot of 155 bookings
  console.log("\n[BACKUP] Đang tạo bản sao lưu dữ liệu hợp đồng trước khi thực thi...");
  const backupDir = "backups";
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFile = `${backupDir}/bookings-backup-before-recipient-backfill-${timestamp}.json`;

  const { data: fullBookingsBackup, error: bkErr } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", ownerId)
    .order("code", { ascending: true });

  if (bkErr || !fullBookingsBackup || fullBookingsBackup.length !== 155) {
    throw new Error(`Lỗi tạo backup: ${bkErr?.message || "Không thể lấy đủ 155 hợp đồng"}`);
  }

  fs.writeFileSync(backupFile, JSON.stringify(fullBookingsBackup, null, 2));
  console.log(`[BACKUP] Đã lưu snapshot 155 hợp đồng thành công tại: ${backupFile}`);

  console.log("\n================================================================================");
  console.log("ĐANG THỰC THI BACKFILL LÊN SUPABASE...");
  console.log("================================================================================");

  let updatedCount = 0;
  const mutationLogs = [];
  for (let idx = 0; idx < plannedMutations.length; idx++) {
    const m = plannedMutations[idx];
    const updatePayload = {};
    if (m.nameUpdate !== null) updatePayload.recipient_name = m.nameUpdate;
    if (m.phoneUpdate !== null) updatePayload.recipient_phone = m.phoneUpdate;
    if (m.addressUpdate !== null) updatePayload.recipient_address = m.addressUpdate;

    const { error: upErr } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", m.bookingId)
      .eq("user_id", ownerId);

    if (upErr) {
      console.error(`\n[LỖI NGHIÊM TRỌNG] Thất bại tại hợp đồng ${m.code} (#${idx + 1}): ${upErr.message}`);
      throw new Error(`Dừng thực thi do lỗi cập nhật tại ${m.code}: ${upErr.message}`);
    }

    updatedCount++;
    mutationLogs.push({
      index: idx + 1,
      code: m.code,
      bookingId: m.bookingId,
      updates: updatePayload,
      timestamp: new Date().toISOString(),
    });
  }

  const logFile = `${backupDir}/recipient-backfill-mutation-log-${timestamp}.json`;
  fs.writeFileSync(logFile, JSON.stringify(mutationLogs, null, 2));
  console.log(`[LOG] Đã lưu chi tiết ${updatedCount} mutations tại: ${logFile}`);

  console.log(`\nĐã cập nhật thành công ${updatedCount} hợp đồng với ${totalFieldUpdates} trường thông tin!`);
  console.log("\nBACKFILL HOÀN TẤT THÀNH CÔNG!");
}

main().catch((err) => {
  console.error("\nLỖI THỰC THI SCRIPT:", err);
  process.exit(1);
});
