/**
 * scripts/step14b_full_note_audit.mjs
 *
 * STEP 14B — FULL NOTE COVERAGE AUDIT
 * READ-ONLY ONLY — ZERO DATABASE MUTATIONS
 */

if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import fs from "fs";

const SUPABASE_URL = "https://flyphduvyxyrphuklmdp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xlQ5U5KW6NXry3K24RbxcA_LHzRwF9m";
const OWNER_EMAIL = "test@gmail.com";
const OWNER_PASS = "123789";
const FILE_PATH = "WKF Nguyên Anh.xlsx";

// -----------------------------------------------------------------------------
// CURRENT PARSER LOGIC FROM backfill-recipient-data.mjs
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
  "tỉnh", "thành", "huyện", "xã", "phường", "quận", "tp", "hà", "nội"
]);

const NOISE_WORDS = new Set(["dạ", "da", "koc", "sđt", "sdt", "lh", "lh:", "sđt:", "sdt:", "sđt.", "sdt."]);

function cleanNameStr(cand) {
  let s = cand.replace(/[\-–:,._\+\(\)]+$/g, "").trim();
  s = s.replace(/^[\-–:,._\+\(\)]+/g, "").trim();
  s = s.replace(/\s+(?:sđt|sdt|lh|địa chỉ|đc|đchi|đ\/c).*$/gi, "").trim();
  s = s.replace(/^(?:chị|chi|anh|bé|be|em|mẹ)\s+/gi, "").trim();
  s = s.replace(/\s+(?:ạ|a|nha|nhe|nhé)$/gi, "").trim();
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

function parseRecipientName(text) {
  if (!text || !String(text).trim()) {
    return { name: null, status: "NO_DATA" };
  }
  const t = String(text).trim();

  // 1. Explicit marker
  const markerMatch = t.match(/(?:Tên\s+người\s+nhận|Người\s+nhận|Họ\s+và\s+tên|Họ\s+tên|Tên\s*koc|tên)\s*[:\-]\s*([^\n,.;\-–\d]+)/i);
  if (markerMatch) {
    const cand = cleanNameStr(markerMatch[1]);
    const words = cand.split(/\s+/).filter(Boolean);
    if (words.length >= 1 && words.length <= 4 && words.every((w) => /^[A-ZÀ-Ỹa-zà-ỹ]+$/i.test(w))) {
      const firstW = words[0].toLowerCase();
      const lastW = words[words.length - 1].toLowerCase();
      if (!ADDR_KEYWORDS.has(firstW) && !ADDR_KEYWORDS.has(lastW) && !NOISE_WORDS.has(firstW)) {
        return { name: cand, status: "SAFE_TO_FILL" };
      }
    }
  }

  // 2. Structured: <Name> [-:,.]? <Phone> <Address>
  const phoneMatch = t.match(/(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/);
  if (phoneMatch) {
    const prefix = t.slice(0, phoneMatch.index).trim();
    const lines = prefix.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      const cand = cleanNameStr(lines[lines.length - 1]);
      const words = cand.split(/\s+/).filter(Boolean);
      if (words.length >= 1 && words.length <= 4) {
        const firstW = words[0].toLowerCase();
        const lastW = words[words.length - 1].toLowerCase();
        if (!ADDR_KEYWORDS.has(firstW) && !ADDR_KEYWORDS.has(lastW) && !NOISE_WORDS.has(firstW)) {
          if (words.every((w) => /^[A-ZÀ-Ỹa-zà-ỹ]+$/i.test(w))) {
            return { name: cand, status: "SAFE_TO_FILL" };
          }
        }
      }
    }

    // 3. Trailing name: <Address> <Phone> [-:,.]? <Name>
    const suffix = t.slice(phoneMatch.index + phoneMatch[0].length).trim();
    const sLines = suffix.split("\n").map((l) => l.trim()).filter(Boolean);
    if (sLines.length > 0) {
      const cand = cleanNameStr(sLines[0]);
      const words = cand.split(/\s+/).filter(Boolean);
      if (words.length >= 1 && words.length <= 3) {
        const firstW = words[0].toLowerCase();
        const lastW = words[words.length - 1].toLowerCase();
        if (!ADDR_KEYWORDS.has(firstW) && !ADDR_KEYWORDS.has(lastW) && !NOISE_WORDS.has(firstW)) {
          if (words.every((w) => /^[A-ZÀ-Ỹa-zà-ỹ]+$/i.test(w))) {
            return { name: cand, status: "SAFE_TO_FILL" };
          }
        }
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

// -----------------------------------------------------------------------------
// INDEPENDENT RAW AUDIT LOGIC
// -----------------------------------------------------------------------------

function classifyFormat(rawNote) {
  if (!rawNote || !String(rawNote).trim()) {
    return "empty-note";
  }
  const t = String(rawNote).trim();

  // Check phone only
  const cleanDigits = t.replace(/[\s.\-\/🔟4️⃣]+/g, "");
  if (/^\d{8,12}$/.test(cleanDigits)) {
    return "phone-only";
  }

  const hasExplicitName = /(?:Tên\s+người\s+nhận|Người\s+nhận|Họ\s+và\s+tên|Họ\s+tên|Tên\s*koc|tên)\s*[:\-]/i.test(t);
  const hasExplicitPhone = /(?:Sđt|SĐT|sdt|SDT|phone|lh|Liên hệ)\s*[:\-]/i.test(t);
  const hasExplicitAddr = /(?:Địa\s*chỉ\s*nhận\s*hàng|Địa\s*chỉ\s*mới|Địa\s*chỉ|Đ\/c|Đchi|Đc|DC|ĐC)\s*[:\.]?/i.test(t);

  const phoneMatch = t.match(/(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/);
  const hasPhone = !!phoneMatch;

  if (hasExplicitName && hasExplicitPhone && hasExplicitAddr) {
    return "explicit-all-three";
  }
  if (hasExplicitAddr && hasExplicitPhone) {
    return "explicit-addr-and-phone";
  }
  if (hasExplicitAddr) {
    return "explicit-addr";
  }

  if (hasPhone) {
    const prefix = t.slice(0, phoneMatch.index).trim();
    const suffix = t.slice(phoneMatch.index + phoneMatch[0].length).trim();

    if (prefix.length > 0 && suffix.length > 0) {
      if (prefix.length < 25 && suffix.length > 20) {
        return "name + phone + address";
      }
      if (prefix.length > 20 && suffix.length < 25) {
        return "address + phone + name";
      }
    }
    if (prefix.length === 0 && suffix.length > 10) {
      return "phone + address";
    }
    if (suffix.length === 0 && prefix.length > 10) {
      return "address + phone";
    }
    if (prefix.length < 25 && suffix.length === 0) {
      return "name + phone";
    }
  }

  return "free-form text";
}

async function runAudit() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: auth, error: aErr } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: OWNER_PASS });
  if (aErr || !auth?.user) throw new Error("Auth failed: " + aErr?.message);
  const uid = auth.user.id;

  // DB counts before
  const tables = ["bookings", "videos", "kols", "products", "campaigns", "templates", "tasks"];
  const dbCountsBefore = {};
  for (const t of tables) {
    let q = supabase.from(t).select("*", { count: "exact", head: true });
    if (t !== "videos") q = q.eq("user_id", uid);
    const { count } = await q;
    dbCountsBefore[t] = count;
  }

  // Fetch DB bookings
  const { data: dbBookings, error: bErr } = await supabase
    .from("bookings")
    .select("id, code, recipient_name, recipient_phone, recipient_address, notes, kols(username)")
    .eq("user_id", uid)
    .order("code");
  if (bErr) throw new Error("Fetch bookings error: " + bErr.message);

  // Load Excel
  const stdout = execSync(`python3 scripts/export_excel.py "${FILE_PATH}"`, { maxBuffer: 50 * 1024 * 1024 }).toString();
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

  const dbMap = new Map(dbBookings.map((b) => [b.code, b]));

  // Audit variables
  const formatCounts = {};
  let notesWithPhone = 0;
  let notesWithAddress = 0;
  let notesWithName = 0;

  const phoneMissed = [];
  const addressMissed = [];
  const nameAmbiguousList = [];

  const fullAuditTable = [];

  let parserSafeNameCount = 0;
  let parserSafePhoneCount = 0;
  let parserSafeAddressNewCount = 0;
  let parserSafeAddressReplaceCount = 0;

  for (const r of rows) {
    const dbB = dbMap.get(r.code);
    if (!dbB) throw new Error(`Booking ${r.code} missing from DB!`);

    const rawNote = r.rawNote;
    const rawNoteStr = rawNote !== null && rawNote !== undefined ? String(rawNote) : "";
    const trimmed = rawNoteStr.trim();

    // 1. Format classification
    const fmt = classifyFormat(rawNote);
    formatCounts[fmt] = (formatCounts[fmt] || 0) + 1;

    // 2. Independent Phone check
    const rawPhoneMatch = trimmed.match(/(?<!\d)(?:0|84)?[\s.\-–/]*(?:3|5|7|8|9)(?:[\s.\-–/]*\d){8}(?!\d)/);
    const cleanDigits = trimmed.replace(/[\s.\-\/🔟4️⃣]+/g, "");
    let independentPhone = null;
    if (rawPhoneMatch) {
      let d = rawPhoneMatch[0].replace(/[^\d]/g, "");
      if (d.startsWith("84")) d = "0" + d.slice(2);
      else if (!d.startsWith("0")) d = "0" + d;
      if (d.length === 10) independentPhone = d;
    } else if (/^\d{9,10}$/.test(cleanDigits)) {
      independentPhone = cleanDigits.length === 9 ? "0" + cleanDigits : cleanDigits;
    }

    if (independentPhone) notesWithPhone++;

    // Current parser phone
    const parserPhone = parseRecipientPhone(rawNote);
    let phoneClass = "NOT_PRESENT";
    if (dbB.recipient_phone) {
      phoneClass = "ALREADY_IN_DB";
    } else if (parserPhone) {
      phoneClass = "EXTRACTED_SAFE";
      parserSafePhoneCount++;
    } else if (independentPhone && !parserPhone) {
      phoneClass = "PARSER_MISSED";
      phoneMissed.push({ code: r.code, rawNote, independentPhone });
    }

    // 3. Independent Address check
    const hasAddrKeyword = /(?:thôn|xã|huyện|tỉnh|quận|phường|thành phố|tp|ấp|đường|ngõ|ngách|số|sn|khu|tổ|kiot|toà|tòa|chung cư|kđt|địa chỉ|đc|đ\/c|dc)/i.test(trimmed);
    const isPhoneOnly = /^\d{8,12}$/.test(cleanDigits);
    const independentHasAddr = trimmed.length > 10 && !isPhoneOnly && hasAddrKeyword;
    if (independentHasAddr) notesWithAddress++;

    // Current parser address
    const { address: parserAddr, status: parserAddrStatus } = parseRecipientAddress(rawNote);
    let addressClass = "NOT_PRESENT";
    let detectedAddress = parserAddr;

    if (CLEAN_ADDRESS_CODES.has(r.code)) {
      addressClass = "ALREADY_IN_DB";
      detectedAddress = dbB.recipient_address;
    } else if (CORRUPTED_ADDRESS_CODES.has(r.code)) {
      addressClass = "EXTRACTED_SAFE";
      parserSafeAddressReplaceCount++;
    } else if (parserAddrStatus === "EXTRACTABLE" && parserAddr) {
      if (dbB.recipient_address === null) {
        addressClass = "EXTRACTED_SAFE";
        parserSafeAddressNewCount++;
      } else if (dbB.recipient_address === parserAddr) {
        addressClass = "ALREADY_IN_DB";
      }
    } else if (independentHasAddr && (!parserAddr || parserAddrStatus !== "EXTRACTABLE")) {
      addressClass = "PARSER_MISSED";
      addressMissed.push({ code: r.code, rawNote });
    }

    // 4. Independent Name check
    const { name: parserName, status: parserNameStatus } = parseRecipientName(rawNote);
    let nameClass = "NOT_PRESENT";
    let detectedName = null;

    if (parserNameStatus === "SAFE_TO_FILL") {
      nameClass = "EXTRACTED_SAFE";
      detectedName = parserName;
      parserSafeNameCount++;
    } else if (parserNameStatus === "AMBIGUOUS") {
      nameClass = "AMBIGUOUS";
      nameAmbiguousList.push({ code: r.code, username: r.username, rawNote });
    } else if (parserNameStatus === "NO_DATA") {
      nameClass = "NOT_PRESENT";
    }

    if (parserNameStatus === "SAFE_TO_FILL") notesWithName++;

    // Overall Confidence & Reason
    let confidence = "HIGH";
    let parserStatus = "OK";
    let reason = "Tất cả các trường nhận diện an toàn, nhất quán";

    if (nameClass === "AMBIGUOUS" || addressClass === "NOT_PRESENT" || phoneClass === "NOT_PRESENT") {
      if (fmt === "phone-only") {
        confidence = "HIGH";
        reason = "Ghi chú chỉ có số điện thoại; Tên và Địa chỉ không có trong ghi chú";
      } else if (fmt === "empty-note") {
        confidence = "HIGH";
        reason = "Ghi chú trống hoàn toàn";
      } else if (nameClass === "AMBIGUOUS") {
        confidence = "MEDIUM";
        reason = "Tên không rõ ràng / chỉ có địa chỉ & số điện thoại; giữ nguyên NULL để tránh suy đoán sai";
      }
    }

    if (CORRUPTED_ADDRESS_CODES.has(r.code)) {
      reason = "Địa chỉ hiện tại trong DB bị lỗi/cắt ngắn/dính SĐT; Thay thế an toàn bằng địa chỉ đầy đủ chuẩn từ Note";
    }
    if (CLEAN_ADDRESS_CODES.has(r.code)) {
      reason = "Địa chỉ trong DB đã sạch và chuẩn xác; Giữ nguyên không can thiệp";
    }

    fullAuditTable.push({
      code: r.code,
      username: r.username,
      rawNote: trimmed,
      name: detectedName || "—",
      phone: independentPhone || "—",
      address: detectedAddress ? detectedAddress.slice(0, 45) + (detectedAddress.length > 45 ? "..." : "") : "—",
      confidence,
      parserStatus,
      reason,
      classes: { name: nameClass, phone: phoneClass, address: addressClass },
    });
  }

  // DB counts after
  const dbCountsAfter = {};
  for (const t of tables) {
    let q = supabase.from(t).select("*", { count: "exact", head: true });
    if (t !== "videos") q = q.eq("user_id", uid);
    const { count } = await q;
    dbCountsAfter[t] = count;
  }

  const report = {
    totalBookings: rows.length,
    notesWithPhone,
    phoneMissed,
    notesWithAddress,
    addressMissed,
    notesWithName,
    nameAmbiguousCount: nameAmbiguousList.length,
    formatCounts,
    planCounts: {
      safeNames: parserSafeNameCount,
      safePhones: parserSafePhoneCount,
      safeAddressesNew: parserSafeAddressNewCount,
      safeAddressesReplace: parserSafeAddressReplaceCount,
    },
    dbCountsBefore,
    dbCountsAfter,
    nameAmbiguousSamples: nameAmbiguousList.slice(0, 15),
    fullAuditTable,
  };

  fs.writeFileSync("/Users/admin/.gemini/antigravity-ide/brain/1b032208-8879-4c18-a3d1-35c175f47b7c/scratch/step14b-audit-result.json", JSON.stringify(report, null, 2));
  console.log("AUDIT COMPLETED SUCCESSFULLY!");
  console.log("Total Bookings:", rows.length);
  console.log("Notes with Phone:", notesWithPhone, "Missed:", phoneMissed.length);
  console.log("Notes with Address:", notesWithAddress, "Missed:", addressMissed.length);
  console.log("Safe Names Extracted:", parserSafeNameCount, "Ambiguous Names:", nameAmbiguousList.length);
  console.log("Formats:", formatCounts);
  console.log("DB Counts Match:", JSON.stringify(dbCountsBefore) === JSON.stringify(dbCountsAfter));
}

runAudit().catch(console.error);
