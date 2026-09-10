/**
 * scripts/repair-excel-migration.mjs
 *
 * STEP 12 — PHASE 3: DETERMINISTIC MIGRATION REPAIR SCRIPT
 *
 * Repairs the 3 known migration defects from the prior Excel import:
 * 1. Missing Booking: Inserts BK-202608-0096 (thuthao799 - Sữa Tắm CHESY Hương Nước Hoa 1000ml).
 * 2. Video Reassignment: Reassigns 7 Sữa Tắm videos from BK-202608-0057 to BK-202608-0096 and sets ads_code = null.
 * 3. Notes Restoration: Restores the exact original Excel Column 15 note for 29 bookings where " | Doanh thu/View: <val>" was appended.
 *
 * Safety features:
 * - Deterministic, owner-scoped, and idempotent.
 * - Dry-run by default.
 * - Requires explicit `--execute` to perform mutations.
 * - Aborts on any conflict or ambiguity.
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

// 7 exact video URLs to reassign
const TARGET_VIDEO_URLS = [
  "https://www.tiktok.com/@thuthao799/video/7679394429198798100?shop_region=VN&shop_id=7496242113276513249",
  "https://www.tiktok.com/@thuthao799/video/7679611625317371157?shop_region=VN&shop_id=7496242113276513249",
  "https://www.tiktok.com/@thuthao799/video/7679640583660670229?shop_region=VN&shop_id=7496242113276513249",
  "https://www.tiktok.com/@thuthao799/video/7679981168577629461?shop_region=VN&shop_id=7496242113276513249",
  "https://tiktok.com/@thuthao799/video/7680126910759750933?shop_region=VN&shop_id=7496242113276513249",
  "https://www.tiktok.com/@thuthao799/video/7680916340349226260?shop_region=VN&shop_id=7496242113276513249",
  "https://www.tiktok.com/@thuthao799/video/7681195609138679060?shop_id=7496242113276513249&shop_region=VN",
];

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

function excelDateToUtcIso(serial) {
  if (!serial) return null;
  const num = parseFloat(serial);
  if (isNaN(num)) return null;
  const date = new Date((num - (25567 + 2)) * 86400 * 1000);
  return date.toISOString();
}

function excelDateToDateStr(serial) {
  if (!serial) return null;
  const num = parseFloat(serial);
  if (isNaN(num)) return null;
  const date = new Date((num - (25567 + 2)) * 86400 * 1000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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

  // Verify owner profile exists
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", ownerId)
    .single();

  if (profErr || !profile) {
    throw new Error(`Hồ sơ chủ sở hữu ${ownerId} không tồn tại trong profiles!`);
  }

  // 2. Load Excel workbook
  const excelData = loadExcelData(filePath);
  const wkfRows = excelData["WKF"] || [];
  const wkfDataRows = wkfRows.slice(1, 146); // Rows 2 to 146

  // 3. Verify Prerequisites in DB for Migration Owner
  // A. KOL thuthao799
  const { data: kolRecord, error: kolErr } = await supabase
    .from("kols")
    .select("id, username")
    .eq("user_id", ownerId)
    .eq("username", "thuthao799")
    .maybeSingle();

  if (kolErr || !kolRecord) {
    throw new Error("Không tìm thấy KOL 'thuthao799' của chủ sở hữu!");
  }

  // B. Product Sữa Tắm CHESY Hương Nước Hoa 1000ml
  const { data: productRecord, error: prodErr } = await supabase
    .from("products")
    .select("id, name")
    .eq("user_id", ownerId)
    .eq("name", "Sữa Tắm CHESY Hương Nước Hoa 1000ml")
    .maybeSingle();

  if (prodErr || !productRecord) {
    throw new Error("Không tìm thấy Sản phẩm 'Sữa Tắm CHESY Hương Nước Hoa 1000ml' của chủ sở hữu!");
  }

  // C. Campaign Chiến dịch Tháng 8/2026
  const { data: campaignRecord, error: campErr } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("user_id", ownerId)
    .eq("name", "Chiến dịch Tháng 8/2026")
    .maybeSingle();

  if (campErr || !campaignRecord) {
    throw new Error("Không tìm thấy Chiến dịch 'Chiến dịch Tháng 8/2026' của chủ sở hữu!");
  }

  // D. Existing Booking BK-202608-0057
  const { data: bk57Record, error: bk57Err } = await supabase
    .from("bookings")
    .select("id, code")
    .eq("user_id", ownerId)
    .eq("code", "BK-202608-0057")
    .maybeSingle();

  if (bk57Err || !bk57Record) {
    throw new Error("Không tìm thấy Booking nguồn 'BK-202608-0057' của chủ sở hữu!");
  }

  // ---------------------------------------------------------------------------
  // STEP 2 & 3: RECONSTRUCT MISSING BOOKING & CHECK IDEMPOTENCY
  // ---------------------------------------------------------------------------
  const bookingStats = {
    missing: 0,
    alreadyCorrect: 0,
    conflict: 0,
  };

  // Row 97 in Excel WKF is index 95 in wkfDataRows (zero-based index 96 in full wkf sheet)
  const row97 = wkfDataRows[95];
  if (!row97 || String(row97[3]).trim().toLowerCase() !== "thuthao799") {
    throw new Error("Dòng 97 trong sheet WKF không khớp với KOL thuthao799!");
  }

  const expectedBookingPayload = {
    user_id: ownerId,
    kol_id: kolRecord.id,
    product_id: productRecord.id,
    campaign_id: campaignRecord.id,
    code: "BK-202608-0096",
    content_type: "video",
    booking_fee: 0,
    commission_rate: 13,
    ads_rate: 7,
    status: "posted",
    sample_product_notes: null,
    sample_sent_at: excelDateToUtcIso(row97[2]), // 46258 -> 2026-08-20T00:00:00.000Z
    sample_expected_at: null,
    sample_delivered_at: null,
    sample_tracking_code: null,
    sample_carrier: null,
    recipient_name: null,
    recipient_phone: "0945799787",
    recipient_address: null,
    video_reminder_at: null,
    expected_post_at: excelDateToDateStr(row97[11]), // 46269 -> 2026-08-31
    payment_status: "unpaid",
    paid_amount: 0,
    notes: row97[15] !== null && row97[15] !== undefined ? String(row97[15]) : null,
  };

  // Check if booking already exists
  const { data: existingTargetBk, error: targetBkErr } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", ownerId)
    .eq("code", "BK-202608-0096")
    .maybeSingle();

  if (targetBkErr) {
    throw targetBkErr;
  }

  if (existingTargetBk) {
    // Check if every relevant field matches
    const isMatching =
      existingTargetBk.kol_id === expectedBookingPayload.kol_id &&
      existingTargetBk.product_id === expectedBookingPayload.product_id &&
      existingTargetBk.campaign_id === expectedBookingPayload.campaign_id &&
      existingTargetBk.status === expectedBookingPayload.status &&
      Number(existingTargetBk.booking_fee) === expectedBookingPayload.booking_fee &&
      Number(existingTargetBk.commission_rate) === expectedBookingPayload.commission_rate &&
      Number(existingTargetBk.ads_rate) === expectedBookingPayload.ads_rate &&
      existingTargetBk.expected_post_at === expectedBookingPayload.expected_post_at &&
      existingTargetBk.recipient_phone === expectedBookingPayload.recipient_phone &&
      existingTargetBk.notes === expectedBookingPayload.notes;

    if (isMatching) {
      bookingStats.alreadyCorrect = 1;
    } else {
      bookingStats.conflict = 1;
    }
  } else {
    bookingStats.missing = 1;
  }

  // ---------------------------------------------------------------------------
  // STEP 4: RECONCILE 7 VIDEOS
  // ---------------------------------------------------------------------------
  const videoStats = {
    reassign: 0,
    alreadyCorrect: 0,
    missing: 0,
    conflict: 0,
    ambiguous: 0,
  };

  const plannedVideoUpdates = [];

  for (const url of TARGET_VIDEO_URLS) {
    const { data: vList, error: vErr } = await supabase
      .from("videos")
      .select("id, booking_id, video_url, video_id, ads_code, bookings!inner(id, code, user_id)")
      .eq("video_url", url);

    if (vErr) {
      throw vErr;
    }

    if (!vList || vList.length === 0) {
      videoStats.missing++;
      continue;
    }

    if (vList.length > 1) {
      videoStats.ambiguous++;
      continue;
    }

    const v = vList[0];

    // Already correct check: attached to BK-202608-0096 with ads_code = null
    if (v.bookings?.code === "BK-202608-0096" && v.ads_code === null) {
      videoStats.alreadyCorrect++;
    } else if (v.bookings?.code === "BK-202608-0057") {
      videoStats.reassign++;
      plannedVideoUpdates.push({
        id: v.id,
        video_url: v.video_url,
        current_booking_code: v.bookings?.code,
        current_ads_code: v.ads_code,
        target_booking_code: "BK-202608-0096",
        target_ads_code: null,
      });
    } else {
      videoStats.conflict++;
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 5: RECONCILE 29 NOTES
  // ---------------------------------------------------------------------------
  const noteStats = {
    restore: 0,
    alreadyCorrect: 0,
    conflict: 0,
  };

  const plannedNoteUpdates = [];

  for (let idx = 0; idx < wkfDataRows.length; idx++) {
    const r = wkfDataRows[idx];
    const linkAirCol13 = r[13];

    // Check if column 13 (Link air) had non-empty content
    if (linkAirCol13 !== null && linkAirCol13 !== undefined && String(linkAirCol13).trim() !== "") {
      const monthStr = r[1] ? String(r[1]) : "";
      const monthCode = monthStr.includes("9") ? "202609" : "202608";
      const code = `BK-${monthCode}-${String(idx + 1).padStart(4, "0")}`;
      const expectedNote = r[15] !== null && r[15] !== undefined ? String(r[15]) : null;

      const { data: dbBooking, error: bErr } = await supabase
        .from("bookings")
        .select("id, code, notes")
        .eq("user_id", ownerId)
        .eq("code", code)
        .maybeSingle();

      if (bErr || !dbBooking) {
        noteStats.conflict++;
        continue;
      }

      if (dbBooking.notes === expectedNote) {
        noteStats.alreadyCorrect++;
      } else {
        noteStats.restore++;
        plannedNoteUpdates.push({
          id: dbBooking.id,
          code: dbBooking.code,
          current_notes: dbBooking.notes,
          expected_notes: expectedNote,
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 7: PRINT REPORT
  // ---------------------------------------------------------------------------
  const totalPlannedMutations =
    (bookingStats.missing > 0 ? 1 : 0) +
    plannedVideoUpdates.length +
    plannedNoteUpdates.length;

  console.log("Migration Repair Dry-Run\n");
  console.log(`Owner: ${ownerEmail} (${ownerId})\n`);
  console.log("BOOKINGS");
  console.log(`  Missing: ${bookingStats.missing}`);
  console.log(`  Already correct: ${bookingStats.alreadyCorrect}`);
  console.log(`  Conflict: ${bookingStats.conflict}\n`);
  console.log("VIDEOS");
  console.log(`  Reassign: ${videoStats.reassign}`);
  console.log(`  Already correct: ${videoStats.alreadyCorrect}`);
  console.log(`  Missing: ${videoStats.missing}`);
  console.log(`  Conflict: ${videoStats.conflict}`);
  console.log(`  Ambiguous: ${videoStats.ambiguous}\n`);
  console.log("NOTES");
  console.log(`  Restore: ${noteStats.restore}`);
  console.log(`  Already correct: ${noteStats.alreadyCorrect}`);
  console.log(`  Conflict: ${noteStats.conflict}\n`);
  console.log("PLANNED MUTATIONS");
  console.log(`  INSERT bookings: ${bookingStats.missing > 0 ? 1 : 0}`);
  console.log(`  UPDATE videos: ${plannedVideoUpdates.length}`);
  console.log(`  UPDATE bookings.notes: ${plannedNoteUpdates.length}\n`);
  console.log(`TOTAL MUTATIONS: ${totalPlannedMutations}\n`);
  console.log(`DATABASE MODIFIED: ${isDryRun ? "NO" : "YES"}`);

  // If in Dry-Run mode, stop here and do not execute mutations.
  if (isDryRun) {
    return;
  }

  // ---------------------------------------------------------------------------
  // EXECUTE MODE (PHASE 4 ONLY - NEVER RUN IN DRY-RUN)
  // ---------------------------------------------------------------------------
  if (
    bookingStats.conflict > 0 ||
    videoStats.conflict > 0 ||
    videoStats.ambiguous > 0 ||
    videoStats.missing > 0 ||
    noteStats.conflict > 0
  ) {
    throw new Error(
      "Không thể thực thi repair do có xung đột hoặc bản ghi không xác định! Đã hủy bỏ thao tác."
    );
  }

  console.log("\n================================================================================");
  console.log("ĐANG THỰC THI REPAIR MUTATIONS LÊN SUPABASE...");
  console.log("================================================================================");

  // 1. Insert missing booking if needed
  let targetBookingId = existingTargetBk ? existingTargetBk.id : null;
  if (bookingStats.missing > 0) {
    const { data: newBk, error: insertBkErr } = await supabase
      .from("bookings")
      .insert(expectedBookingPayload)
      .select("id")
      .single();

    if (insertBkErr || !newBk) {
      throw new Error(`Lỗi chèn Booking BK-202608-0096: ${insertBkErr?.message}`);
    }
    targetBookingId = newBk.id;
    console.log(`[1/3] Đã tạo thành công Booking BK-202608-0096 (${targetBookingId})`);
  } else {
    console.log(`[1/3] Booking BK-202608-0096 đã tồn tại (${targetBookingId})`);
  }

  // 2. Reassign videos
  for (const vUp of plannedVideoUpdates) {
    const { error: vUpErr } = await supabase
      .from("videos")
      .update({
        booking_id: targetBookingId,
        ads_code: null,
      })
      .eq("id", vUp.id);

    if (vUpErr) {
      throw new Error(`Lỗi cập nhật Video ${vUp.id}: ${vUpErr.message}`);
    }
  }
  console.log(`[2/3] Đã gán lại ${plannedVideoUpdates.length} videos sang Booking BK-202608-0096 (ads_code = null)`);

  // 3. Restore notes
  for (const nUp of plannedNoteUpdates) {
    const { error: nUpErr } = await supabase
      .from("bookings")
      .update({
        notes: nUp.expected_notes,
      })
      .eq("id", nUp.id)
      .eq("user_id", ownerId);

    if (nUpErr) {
      throw new Error(`Lỗi phục hồi ghi chú cho Booking ${nUp.code}: ${nUpErr.message}`);
    }
  }
  console.log(`[3/3] Đã phục hồi ghi chú gốc cho ${plannedNoteUpdates.length} bookings`);

  console.log("\nREPAIR HOÀN TẤT THÀNH CÔNG!");
}

main().catch((err) => {
  console.error("\nLỖI THỰC THI REPAIR SCRIPT:", err);
  process.exit(1);
});
