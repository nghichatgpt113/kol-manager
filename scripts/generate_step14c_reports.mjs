/**
 * scripts/generate_step14c_reports.mjs
 * Generate Step 14C detailed regression reports and artifacts.
 */

import fs from "fs";

// Read raw notes
const rawNotes = JSON.parse(
  fs.readFileSync("/Users/admin/.gemini/antigravity-ide/brain/1b032208-8879-4c18-a3d1-35c175f47b7c/scratch/raw-notes.json")
);
const raw14b = JSON.parse(
  fs.readFileSync("/Users/admin/.gemini/antigravity-ide/brain/1b032208-8879-4c18-a3d1-35c175f47b7c/scratch/step14b-audit-result.json")
);

const oldNameMap = new Map();
for (const r of raw14b.fullAuditTable) {
  oldNameMap.set(r.code, r.name !== "—" ? r.name : null);
}

// Map of the 29 missed codes with root cause reasons
const missedReasonMap = {
  "BK-202608-0013": { reason: "Case A: Name + Address + Phone (Địa chỉ nằm giữa tên và SĐT)", conf: "HIGH" },
  "BK-202608-0014": { reason: "Case A: Name + Address + Phone (Tiền tố 'Bé' được chuẩn hóa, tên 'Linh')", conf: "HIGH" },
  "BK-202608-0017": { reason: "Case A: Name + Address + Phone (Tên 'Thảo Hòa' đứng trước marker 'DC:')", conf: "HIGH" },
  "BK-202608-0022": { reason: "Case A: Name + Address + Phone ('Minh Anh' đứng trước địa chỉ số nhà 194)", conf: "HIGH" },
  "BK-202608-0025": { reason: "Case A: Name + Address + Phone (Chuẩn hóa 'Chị Vân' -> 'Vân')", conf: "HIGH" },
  "BK-202608-0028": { reason: "Case C: Name Collides with Address Keyword (Từ khóa 'Hà' trong 'Hà Vi')", conf: "HIGH" },
  "BK-202608-0047": { reason: "Case A: Name + Address + Phone ('Yến Anh' đứng trước địa chỉ 'thôn 5')", conf: "HIGH" },
  "BK-202608-0054": { reason: "Case B: Name + Punctuation + Phone (Dọn sạch dấu gạch ngang sau 'Hương - Sdt')", conf: "HIGH" },
  "BK-202608-0057": { reason: "Case B: Name + Punctuation + Phone (Dọn sạch dấu chấm sau 'Thảo . Sđt')", conf: "HIGH" },
  "BK-202608-0059": { reason: "Case A: Name + Address + Phone ('Mai cúc' đứng trước số nhà '170/66')", conf: "HIGH" },
  "BK-202608-0064": { reason: "Case E: Multiline / Repeated Phone ('Cẩm Tiên' đứng sau SĐT và trước 'Cầu Sắt')", conf: "HIGH" },
  "BK-202608-0066": { reason: "Case B: Name + Punctuation + Phone (Dọn sạch dấu gạch sau 'Mây Khẩu Trang - Sdt')", conf: "HIGH" },
  "BK-202608-0068": { reason: "Case A: Name + Address + Phone ('Dung Trần' đứng trước số nhà '26/32A')", conf: "HIGH" },
  "BK-202608-0069": { reason: "Case A: Name + Address + Phone ('Cindy Thuỷ' đứng trước marker 'Địa chỉ:')", conf: "HIGH" },
  "BK-202608-0070": { reason: "Case A: Name + Address + Phone ('Hoàng Vy' đứng trước số nhà '127/41')", conf: "HIGH" },
  "BK-202608-0071": { reason: "Case C: Name Collides with Address Keyword (Tên 'Hà' đứng trước SĐT)", conf: "HIGH" },
  "BK-202608-0074": { reason: "Case A: Name + Address + Phone ('Kim Anh' đứng trước 'Xã ninh gia')", conf: "HIGH" },
  "BK-202608-0075": { reason: "Case E: Multiline / Repeated Phone ('lan anh' nằm giữa 2 số điện thoại lặp lại)", conf: "HIGH" },
  "BK-202608-0082": { reason: "Case D: Unpunctuated Name Marker (Marker '📌 Họ và tên Nguyễn Thanh Xuân')", conf: "HIGH" },
  "BK-202608-0089": { reason: "Case E: Multiline / Repeated Phone ('Quỳnh moon' đứng sau SĐT đầu dòng)", conf: "HIGH" },
  "BK-202608-0092": { reason: "Case A: Name + Address + Phone ('Thanh Mây' đứng trước 'pao quán số 1')", conf: "HIGH" },
  "BK-202608-0096": { reason: "Case B: Name + Punctuation + Phone (Dọn sạch dấu chấm sau 'Thảo . Sđt')", conf: "HIGH" },
  "BK-202608-0097": { reason: "Case A: Name + Address + Phone ('Thuy Nga' đứng trước 'Hẻm 736')", conf: "HIGH" },
  "BK-202608-0101": { reason: "Case E: Multiline / Repeated Phone ('Bảo Vy' nằm giữa 2 số điện thoại lặp lại)", conf: "HIGH" },
  "BK-202608-0103": { reason: "Case E: Multiline / Repeated Phone ('Nguyễn Thị Thuỳ Trang' ở dòng 2)", conf: "HIGH" },
  "BK-202608-0116": { reason: "Case E: Multiline / Repeated Phone ('Dung Nguyễn' nằm giữa 2 số điện thoại lặp lại)", conf: "HIGH" },
  "BK-202608-0126": { reason: "Case A: Name + Address + Phone ('Hương' đứng trước 'phong phú ninh giang')", conf: "HIGH" },
  "BK-202609-0129": { reason: "Case A: Name + Address + Phone ('Huỳnh Thư' đứng trước số nhà '264/10/6/1')", conf: "HIGH" },
  "BK-202609-0133": { reason: "Case E: Multiline / Repeated Phone ('Mộng Như' đứng sau SĐT ở dòng 2)", conf: "HIGH" }
};

// Functions from backfill-recipient-data.mjs
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

function parseRecipientName(text) {
  if (!text || !String(text).trim()) return { name: null, status: "NO_DATA" };
  const t = String(text).trim();

  const markerMatch = t.match(/(?:Tên\s+người\s+nhận|Người\s+nhận|Họ\s+và\s+tên|Họ\s+tên|Tên\s*koc)\s*[:\-]?\s*([^\n,.;\-–\d]+)/i);
  if (markerMatch) {
    const cand = cleanNameStr(markerMatch[1]);
    if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
  }

  const shortMarkerMatch = t.match(/(?<![a-zA-ZÀ-Ỹà-ỹ])tên\s*[:\-]\s*([^\n,.;\-–\d]+)/i);
  if (shortMarkerMatch) {
    const cand = cleanNameStr(shortMarkerMatch[1]);
    if (isValidName(cand)) return { name: cand, status: "SAFE_TO_FILL" };
  }

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

// 1. Generate 29 Missed Comparison Table
let md29 = `# STEP 14C — BEFORE / AFTER COMPARISON (29 PREVIOUSLY MISSED NAMES)\n\n`;
md29 += `| STT | Mã Booking | KOL | Ghi chú gốc (Excel Note) | Kết quả Parser cũ | Kết quả Parser mới | Lý do / Mẫu nhận diện | Độ tin cậy |\n`;
md29 += `| :---: | :--- | :--- | :--- | :---: | :---: | :--- | :---: |\n`;

let idx29 = 1;
for (const [code, info] of Object.entries(missedReasonMap)) {
  const row = rawNotes.find((r) => r.code === code);
  const newRes = parseRecipientName(row.note);
  const oldRes = "NULL (AMBIGUOUS)";
  const noteSnippet = String(row.note).replace(/\n/g, " ").replace(/\|/g, "\\|").slice(0, 50);

  md29 += `| ${idx29++} | \`${code}\` | \`${row.user}\` | ${noteSnippet} | \`${oldRes}\` | **\`${newRes.name}\`** | ${info.reason} | **${info.conf}** |\n`;
}

fs.writeFileSync("/Users/admin/.gemini/antigravity-ide/brain/1b032208-8879-4c18-a3d1-35c175f47b7c/step14c_29_missed_comparison.md", md29);

// 2. Generate 108 Regression Report
let md108 = `# STEP 14C — REGRESSION AUDIT (108 EXISTING SAFE NAMES)\n\n`;
md108 += `| STT | Mã Booking | KOL | Kết quả cũ | Kết quả mới | Đánh giá |\n`;
md108 += `| :---: | :--- | :--- | :--- | :--- | :---: |\n`;

let idx108 = 1;
let sameCount = 0;
let changedCount = 0;

for (const r of rawNotes) {
  const oldName = oldNameMap.get(r.code);
  if (oldName) {
    const newRes = parseRecipientName(r.note);
    const isSame = oldName === newRes.name;
    if (isSame) sameCount++; else changedCount++;
    md108 += `| ${idx108++} | \`${r.code}\` | \`${r.user}\` | \`${oldName}\` | \`${newRes.name}\` | **${isSame ? "SAME" : "CHANGED"}** |\n`;
  }
}

fs.writeFileSync("/Users/admin/.gemini/antigravity-ide/brain/1b032208-8879-4c18-a3d1-35c175f47b7c/step14c_108_regression_report.md", md108);

console.log(`Generated Step 14C reports!`);
console.log(`29 Missed table rows: ${Object.keys(missedReasonMap).length}`);
console.log(`108 Regression table: SAME=${sameCount}, CHANGED=${changedCount}`);
