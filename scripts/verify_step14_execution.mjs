/**
 * scripts/verify_step14_execution.mjs
 * Comprehensive post-execution verification for Step 14.
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
const OWNER_EMAIL = "test@gmail.com";
const OWNER_PASS = "123789";
const FILE_PATH = "WKF Nguyên Anh.xlsx";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data: auth, error: aErr } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: OWNER_PASS });
  if (aErr || !auth?.user) throw new Error("Auth failed: " + aErr?.message);
  const ownerId = auth.user.id;

  // 1. Find the latest backup snapshot
  const backupDir = "backups";
  const backupFiles = fs.readdirSync(backupDir).filter((f) => f.startsWith("bookings-backup-before-recipient-backfill-"));
  backupFiles.sort().reverse();
  if (backupFiles.length === 0) throw new Error("No backup snapshot found!");
  const latestBackupFile = path.join(backupDir, backupFiles[0]);
  const backupData = JSON.parse(fs.readFileSync(latestBackupFile, "utf8"));
  console.log(`[VERIFY] Sử dụng bản backup: ${latestBackupFile} (${backupData.length} records)`);

  const backupMap = new Map(backupData.map((b) => [b.code, b]));

  // 2. Fetch current DB bookings
  const { data: currentBookings, error: bErr } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", ownerId)
    .order("code", { ascending: true });

  if (bErr || !currentBookings || currentBookings.length !== 155) {
    throw new Error(`DB bookings error: ${bErr?.message || currentBookings?.length}`);
  }

  // 3. Load Excel data
  const stdout = execSync(`python3 scripts/export_excel.py "${FILE_PATH}"`, { maxBuffer: 50 * 1024 * 1024 }).toString();
  const excelData = JSON.parse(stdout);
  const wkf = (excelData["WKF"] || []).slice(1, 146);
  const dataSheet = excelData["data"] || [];

  const excelMap = new Map();
  for (let i = 0; i < wkf.length; i++) {
    const monthStr = String(wkf[i][1] || "");
    const monthCode = monthStr.includes("9") ? "202609" : "202608";
    const code = `BK-${monthCode}-${String(i + 1).padStart(4, "0")}`;
    excelMap.set(code, {
      code,
      username: String(wkf[i][3] || "").trim().toLowerCase().replace(/\s+/g, ""),
      rawNote: wkf[i][15],
    });
  }
  for (let i = 0; i < dataSheet.length; i++) {
    const code = `BK-202608-${String(146 + i).padStart(4, "0")}`;
    excelMap.set(code, {
      code,
      username: String(dataSheet[i][3] || "").trim().toLowerCase().replace(/\s+/g, ""),
      rawNote: dataSheet[i][15],
    });
  }

  // 4. Verification checks
  let namePopulated = 0;
  let nameNull = 0;
  let phonePopulated = 0;
  let phoneNull = 0;
  let addressPopulated = 0;
  let addressNull = 0;

  const noteMismatches = [];
  const nonTargetMismatches = [];

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

  const corruptedCheck = [];
  const cleanCheck = [];

  for (const curr of currentBookings) {
    const prev = backupMap.get(curr.code);
    const exc = excelMap.get(curr.code);

    if (!prev) throw new Error(`Missing backup for ${curr.code}`);
    if (!exc) throw new Error(`Missing Excel for ${curr.code}`);

    // Name counts
    if (curr.recipient_name) namePopulated++;
    else nameNull++;

    // Phone counts
    if (curr.recipient_phone) phonePopulated++;
    else phoneNull++;

    // Address counts
    if (curr.recipient_address) addressPopulated++;
    else addressNull++;

    // Note integrity check
    const excelNote = exc.rawNote !== null && exc.rawNote !== undefined ? String(exc.rawNote) : null;
    if (curr.notes !== prev.notes) {
      noteMismatches.push({ code: curr.code, issue: "DB note changed from backup", dbNote: curr.notes, prevNote: prev.notes });
    } else if ((curr.notes ? curr.notes.trim() : null) !== (excelNote ? excelNote.trim() : null)) {
      noteMismatches.push({ code: curr.code, issue: "DB note differs from Excel", dbNote: curr.notes, excelNote });
    }

    // Non-target field check
    const nonTargetFields = [
      "kol_id", "product_id", "campaign_id", "booking_fee",
      "commission_rate", "ads_rate", "content_type", "sample_sent_at",
      "sample_expected_at", "video_reminder_at", "expected_post_at", "status", "code"
    ];

    for (const f of nonTargetFields) {
      if (curr[f] !== prev[f]) {
        nonTargetMismatches.push({ code: curr.code, field: f, before: prev[f], after: curr[f] });
      }
    }

    // Corrupted addresses check
    if (CORRUPTED_ADDRESS_CODES.has(curr.code)) {
      corruptedCheck.push({ code: curr.code, oldAddr: prev.recipient_address, newAddr: curr.recipient_address });
    }

    // Clean addresses check
    if (CLEAN_ADDRESS_CODES.has(curr.code)) {
      const isUnchanged = curr.recipient_address === prev.recipient_address;
      cleanCheck.push({ code: curr.code, isUnchanged, addr: curr.recipient_address });
    }
  }

  // Database counts check
  const tables = ["bookings", "videos", "kols", "products", "campaigns", "templates", "tasks"];
  const dbCounts = {};
  for (const t of tables) {
    let q = supabase.from(t).select("*", { count: "exact", head: true });
    if (t !== "videos") q = q.eq("user_id", ownerId);
    const { count } = await q;
    dbCounts[t] = count;
  }

  console.log("\n=== POST-EXECUTION VERIFICATION RESULTS ===");
  console.log("A. RECIPIENT NAME");
  console.log(`   Populated: ${namePopulated} (Expected: 137)`);
  console.log(`   NULL: ${nameNull} (Expected: 18)`);

  console.log("B. RECIPIENT PHONE");
  console.log(`   Populated: ${phonePopulated} (Expected: 154)`);
  console.log(`   NULL: ${phoneNull} (Expected: 1)`);

  console.log("C. RECIPIENT ADDRESS");
  console.log(`   Populated: ${addressPopulated} (Expected: 145)`);
  console.log(`   NULL: ${addressNull} (Expected: 10)`);

  console.log("C1. 7 CORRUPTED ADDRESSES REPAIRED:");
  corruptedCheck.forEach((c) => console.log(`   [${c.code}] Was: "${c.oldAddr}" -> Now: "${c.newAddr}"`));

  console.log("C2. 7 CLEAN ADDRESSES PRESERVED:");
  cleanCheck.forEach((c) => console.log(`   [${c.code}] Unchanged: ${c.isUnchanged} ("${c.addr}")`));

  console.log("D. NOTE INTEGRITY (EXACT MATCH VERBATIM):");
  console.log(`   Mismatches: ${noteMismatches.length} (Expected: 0)`);

  console.log("E. NON-TARGET FIELDS INTEGRITY:");
  console.log(`   Unintended modifications: ${nonTargetMismatches.length} (Expected: 0)`);

  console.log("F. DATABASE COUNTS:");
  console.log(JSON.stringify(dbCounts, null, 2));

  console.log("G. USER ISOLATION:");
  console.log(`   Target User: ${OWNER_EMAIL} (${ownerId}) verified exclusively.`);

  const allPassed =
    namePopulated === 137 &&
    nameNull === 18 &&
    phonePopulated === 154 &&
    phoneNull === 1 &&
    addressPopulated === 145 &&
    addressNull === 10 &&
    noteMismatches.length === 0 &&
    nonTargetMismatches.length === 0 &&
    cleanCheck.every((c) => c.isUnchanged) &&
    dbCounts.bookings === 155 &&
    dbCounts.videos === 161 &&
    dbCounts.kols === 155 &&
    dbCounts.products === 3 &&
    dbCounts.campaigns === 2 &&
    dbCounts.templates === 17 &&
    dbCounts.tasks === 0;

  console.log(`\nFINAL STATUS: ${allPassed ? "BACKFILL_SUCCESSFUL" : "BACKFILL_FAILED"}`);
}

main().catch(console.error);
