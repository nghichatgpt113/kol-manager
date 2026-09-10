/**
 * scripts/test_improved_parser.mjs
 * Testing improved recipient name parser against all 155 notes.
 */

import fs from "fs";

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

function parseRecipientNameImproved(text) {
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

// Test against all 155 rows
const raw = JSON.parse(fs.readFileSync("/Users/admin/.gemini/antigravity-ide/brain/1b032208-8879-4c18-a3d1-35c175f47b7c/scratch/step14b-audit-result.json"));

let safeCount = 0;
let ambCount = 0;
let noDataCount = 0;

const newlyExtracted = [];
const regressions = [];

for (const r of raw.fullAuditTable) {
  const res = parseRecipientNameImproved(r.rawNote);
  const oldName = r.name !== "—" ? r.name : null;

  if (res.status === "SAFE_TO_FILL") {
    safeCount++;
    if (!oldName) {
      newlyExtracted.push({ code: r.code, user: r.username, name: res.name, note: r.rawNote });
    } else if (oldName !== res.name) {
      regressions.push({ code: r.code, user: r.username, oldName, newName: res.name });
    }
  } else if (res.status === "NO_DATA") {
    noDataCount++;
  } else {
    ambCount++;
  }
}

console.log("=== RESULTS OF IMPROVED PARSER ===");
console.log("SAFE_TO_FILL:", safeCount);
console.log("AMBIGUOUS:", ambCount);
console.log("NO_DATA:", noDataCount);
console.log("Newly extracted count:", newlyExtracted.length);
console.log("Regressions count:", regressions.length);

if (regressions.length > 0) {
  console.log("\nREGRESSIONS:");
  console.log(JSON.stringify(regressions, null, 2));
}

console.log("\nNEWLY EXTRACTED (Sample):");
newlyExtracted.forEach((r, idx) => {
  console.log(`${idx + 1}. [${r.code}] (${r.user}) -> "${r.name}" | note: ${JSON.stringify(r.note.slice(0, 50))}`);
});
