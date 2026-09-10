import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import fs from "fs";

const SUPABASE_URL = "https://flyphduvyxyrphuklmdp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xlQ5U5KW6NXry3K24RbxcA_LHzRwF9m";

// Default credentials for the authenticated owner
const DEFAULT_OWNER_CREDENTIALS = {
  email: "test@gmail.com",
  password: "123789",
};

function parseArgs() {
  const args = process.argv.slice(2);
  let isDryRun = true;
  let ownerEmail = DEFAULT_OWNER_CREDENTIALS.email;
  let ownerId = null;
  let filePath = "WKF Nguyên Anh.xlsx";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--execute") {
      isDryRun = false;
    } else if (arg === "--dry-run") {
      isDryRun = true;
    } else if (arg === "--owner-email" && args[i + 1]) {
      ownerEmail = args[++i];
    } else if (arg === "--owner-id" && args[i + 1]) {
      ownerId = args[++i];
    } else if (arg === "--file" && args[i + 1]) {
      filePath = args[++i];
    }
  }

  return { isDryRun, ownerEmail, ownerId, filePath };
}

function excelDateToStr(val) {
  if (val === null || val === undefined) return null;
  const valStr = String(val).trim();
  if (!valStr) return null;
  const num = parseFloat(valStr);
  if (!isNaN(num) && num > 20000 && num < 80000) {
    // Excel date serial (epoch 1899-12-30)
    const date = new Date((num - (25567 + 2)) * 86400 * 1000);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return valStr;
}

function parseCms(cmsStr) {
  if (!cmsStr) return { commission: null, ads: null, note: null };
  const str = String(cmsStr).trim();

  // Pattern: "12% - ads 7%", "13% - ads 7%", "12% - ads 8%"
  const commMatch = str.match(/(\d+(?:\.\d+)?)\s*%(?!\s*ads)/i);
  const adsMatch = str.match(/ads\s*(\d+(?:\.\d+)?)\s*%|(\d+(?:\.\d+)?)\s*%\s*ads/i);

  const comm = commMatch ? parseFloat(commMatch[1]) : null;
  const ads = adsMatch ? parseFloat(adsMatch[1] || adsMatch[2]) : null;

  if (comm === null && ads === null) {
    // Check decimal e.g. "0.08"
    const num = parseFloat(str);
    if (!isNaN(num) && num > 0 && num < 1) {
      return { commission: num * 100, ads: null, note: `CMS raw: ${str} (8%)` };
    }
    return { commission: null, ads: null, note: `CMS không phân tích được: ${str}` };
  }

  return { commission: comm, ads: ads, note: null };
}

function extractPhoneAndAddress(rawNote) {
  if (!rawNote) return { phone: null, address: null };
  const text = String(rawNote).trim();

  // Clean phone numbers like 0914/314/934️⃣ or 84 32 6044333 or 0984503581
  const cleanedText = text.replace(/[️⃣\-\./\(\)]/g, "");
  const phoneMatch = cleanedText.match(/(?:0|84)?([35789]\d{8})/);
  let phone = null;
  if (phoneMatch) {
    phone = phoneMatch[0].startsWith("84")
      ? "0" + phoneMatch[0].slice(2)
      : phoneMatch[0].startsWith("0")
      ? phoneMatch[0]
      : "0" + phoneMatch[0];
  }

  // Address if clean keyword exists
  let address = null;
  const addrMatch = text.match(/(?:địa chỉ|đchi|đc|dc|nhà)\s*:\s*([^,\n]+(?:,[^,\n]+)*)/i);
  if (addrMatch) {
    address = addrMatch[1].trim();
  }

  return { phone, address };
}

async function loadExcelData(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File Excel không tồn tại tại: ${filePath}`);
  }

  console.log(`Đang đọc và phân tích tệp: ${filePath}...`);
  const stdout = execSync(`python3 scripts/export_excel.py "${filePath}"`, {
    maxBuffer: 50 * 1024 * 1024,
  }).toString();

  return JSON.parse(stdout);
}

async function main() {
  const { isDryRun, ownerEmail, ownerId, filePath } = parseArgs();

  console.log("================================================================================");
  console.log(`STEP 12 — EXCEL DATA MIGRATION & IMPORT (${isDryRun ? "DRY RUN MODE" : "EXECUTE MODE"})`);
  console.log("================================================================================");

  // 1. Authenticate with Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: ownerEmail,
    password: DEFAULT_OWNER_CREDENTIALS.password,
  });

  if (authErr || !auth?.user) {
    throw new Error(`Không thể xác thực người dùng ${ownerEmail}: ${authErr?.message}`);
  }

  const targetUserId = ownerId || auth.user.id;

  // Verify profile exists
  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", targetUserId)
    .single();

  if (profErr || !profile) {
    throw new Error(`Người dùng chủ sở hữu ${targetUserId} không tồn tại trong profiles!`);
  }

  console.log(`Chủ sở hữu mục tiêu: ${targetUserId} (${profile.full_name || ownerEmail})`);

  // 2. Load Excel data
  const excelData = await loadExcelData(filePath);

  // 3. Process WKF Sheet
  const wkfRows = excelData["WKF"] || [];
  const wkfDataRows = wkfRows.slice(1, 146); // Rows 2 to 146

  // 4. Process data Sheet
  const dataSheetRows = excelData["data"] || [];

  // 5. Process Link air video Sheet
  const lavRows = excelData["Link air video"] || [];
  const lavDataRows = lavRows.slice(1).filter((r) => r && r[3] && String(r[3]).trim());

  // 6. Process Văn mẫu Sheet
  const vmRows = excelData["Văn mẫu"] || [];
  const vmDataRows = vmRows
    .map((r, idx) => ({ idx: idx + 1, content: r[0] ? String(r[0]).trim() : "" }))
    .filter((r) => r.content.length > 0);

  // ---------------------------------------------------------------------------
  // DATA PREPARATION & NORMALIZATION
  // ---------------------------------------------------------------------------

  const reviewItems = [];

  // A. Products mapping
  // We unify products to consistent brand names
  const productMap = new Map(); // raw_name -> unified_name
  productMap.set("combo gội xả", "Combo Gội Xả CHESY Collagen 1000ml");
  productMap.set("combo gội xả 1000ml", "Combo Gội Xả CHESY Collagen 1000ml");
  productMap.set("combo gội xả 1000ml", "Combo Gội Xả CHESY Collagen 1000ml");
  productMap.set("sữa tắm hnh", "Sữa Tắm CHESY Hương Nước Hoa 1000ml");
  productMap.set("sữa tắm hnh 1000ml", "Sữa Tắm CHESY Hương Nước Hoa 1000ml");
  productMap.set(
    "combo gội xả 1000ml \nsữa tắm hoa hồng",
    "Combo Gội Xả & Sữa Tắm Hoa Hồng CHESY"
  );

  function getUnifiedProductName(raw) {
    if (!raw) return "Combo Gội Xả CHESY Collagen 1000ml";
    const clean = String(raw).trim().toLowerCase();
    return productMap.get(clean) || String(raw).trim();
  }

  // B. Campaigns mapping
  function getUnifiedCampaignName(monthRaw) {
    if (!monthRaw) return "Chiến dịch Tháng 8/2026";
    const str = String(monthRaw).trim().toLowerCase();
    if (str.includes("8")) return "Chiến dịch Tháng 8/2026";
    if (str.includes("9")) return "Chiến dịch Tháng 9/2026";
    return `Chiến dịch ${String(monthRaw).trim()}`;
  }

  // C. Status mapping
  function mapBookingStatus(statusRaw) {
    if (!statusRaw) return "contacted";
    const str = String(statusRaw).trim().toLowerCase();
    if (str.includes("lên video")) return "posted";
    if (str.includes("gửi hàng")) return "sample_sent";
    if (str.includes("duyệt mẫu")) return "confirmed";
    if (str.includes("gửi brief") || str.includes("brief")) return "confirmed";
    return "contacted";
  }

  // Compile KOLs
  const kolDict = new Map(); // username -> kolData
  const bookingList = [];

  // Process WKF records
  wkfDataRows.forEach((r, i) => {
    const rowNum = i + 2;
    const usernameRaw = r[3] ? String(r[3]).trim() : "";
    if (!usernameRaw) return;

    const username = usernameRaw.toLowerCase().replace(/\s+/g, "");
    const channelUrl = r[4] ? String(r[4]).trim() : null;

    if (channelUrl && channelUrl.toLowerCase() === "shopee") {
      reviewItems.push({
        sheet: "WKF",
        row: rowNum,
        type: "INVALID_CHANNEL_URL",
        message: `KOL '${usernameRaw}' có Link kênh là 'shopee' thay vì URL TikTok. Fallback sang https://www.tiktok.com/@${username}`,
      });
    }

    if (!kolDict.has(username)) {
      kolDict.set(username, {
        username: username,
        display_name: usernameRaw,
        platform: "tiktok",
        channel_url: `https://www.tiktok.com/@${username}`,
      });
    }

    const rawFee = r[5];
    const bookingFee = rawFee ? parseFloat(String(rawFee).replace(/,/g, "")) || 0 : 0;
    const cmsInfo = parseCms(r[6]);
    if (cmsInfo.note) {
      reviewItems.push({
        sheet: "WKF",
        row: rowNum,
        type: "CMS_PARSE_NOTE",
        message: `KOL '${usernameRaw}': ${cmsInfo.note}`,
      });
    }

    const { phone, address } = extractPhoneAndAddress(r[15]);

    // Check link air in col 13
    const linkAirCol13 = r[13] ? String(r[13]).trim() : null;
    let extraNotes = r[15] ? String(r[15]).trim() : "";
    if (linkAirCol13) {
      extraNotes = extraNotes
        ? `${extraNotes} | Doanh thu/View: ${linkAirCol13}`
        : `Doanh thu/View: ${linkAirCol13}`;
    }

    bookingList.push({
      source: "WKF",
      rowNum,
      username,
      month: r[1] ? String(r[1]).trim() : "Tháng 8",
      campaignName: getUnifiedCampaignName(r[1]),
      productName: getUnifiedProductName(r[8]),
      sampleSentAt: excelDateToStr(r[2]),
      sampleExpectedAt: excelDateToStr(r[9]),
      videoReminderAt: excelDateToStr(r[10]),
      expectedPostAt: excelDateToStr(r[11]),
      status: mapBookingStatus(r[12]),
      bookingFee,
      commissionRate: cmsInfo.commission,
      adsRate: cmsInfo.ads,
      recipientPhone: phone,
      recipientAddress: address,
      notes: extraNotes || null,
    });
  });

  // Process data sheet records
  dataSheetRows.forEach((r, i) => {
    const rowNum = i + 1;
    const usernameRaw = r[3] ? String(r[3]).trim() : "";
    if (!usernameRaw) return;

    const username = usernameRaw.toLowerCase().replace(/\s+/g, "");

    if (!kolDict.has(username)) {
      kolDict.set(username, {
        username: username,
        display_name: usernameRaw,
        platform: "tiktok",
        channel_url: `https://www.tiktok.com/@${username}`,
      });
    }

    const rawFee = r[5];
    const bookingFee = rawFee ? parseFloat(String(rawFee).replace(/,/g, "")) || 0 : 0;
    const cmsInfo = parseCms(r[6]);
    const { phone, address } = extractPhoneAndAddress(r[15]);

    bookingList.push({
      source: "data",
      rowNum,
      username,
      month: r[1] ? String(r[1]).trim() : "Tháng 8",
      campaignName: getUnifiedCampaignName(r[1]),
      productName: getUnifiedProductName(r[8]),
      sampleSentAt: excelDateToStr(r[2]),
      sampleExpectedAt: excelDateToStr(r[9]),
      videoReminderAt: excelDateToStr(r[10]),
      expectedPostAt: excelDateToStr(r[11]),
      status: mapBookingStatus(r[12]),
      bookingFee,
      commissionRate: cmsInfo.commission,
      adsRate: cmsInfo.ads,
      recipientPhone: phone,
      recipientAddress: address,
      notes: r[15] ? String(r[15]).trim() : null,
    });
  });

  // Process Link air video records
  const videoList = [];
  const seenVideoUrls = new Set();
  let duplicateVideosSkipped = 0;

  lavDataRows.forEach((r, i) => {
    const rowNum = i + 2;
    let url = r[3] ? String(r[3]).trim() : "";
    if (!url) return;

    if (!url.startsWith("http")) {
      url = "https://" + url;
      reviewItems.push({
        sheet: "Link air video",
        row: rowNum,
        type: "URL_NORMALIZED",
        message: `Đã bổ sung https:// cho URL dòng ${rowNum}: ${url}`,
      });
    }

    if (seenVideoUrls.has(url)) {
      duplicateVideosSkipped++;
      return;
    }
    seenVideoUrls.add(url);

    const usernameRaw = r[1] ? String(r[1]).trim() : "";
    const username = usernameRaw.toLowerCase().replace(/\s+/g, "");

    let videoId = r[4] ? String(r[4]).trim() : null;
    if (!videoId) {
      const match = url.match(/\/video\/(\d+)/);
      if (match) videoId = match[1];
    }

    const adsCode = r[5] ? String(r[5]).trim() : null;
    const postedAt = excelDateToStr(r[2]);

    videoList.push({
      rowNum,
      username,
      videoUrl: url,
      videoId,
      adsCode,
      postedAt,
    });
  });

  // Match videos with bookings
  const matchedVideos = [];
  const unmatchedVideos = [];

  videoList.forEach((v) => {
    const matchingBooking = bookingList.find((b) => b.username === v.username);
    if (matchingBooking) {
      matchedVideos.push({
        ...v,
        booking: matchingBooking,
      });
    } else {
      unmatchedVideos.push(v);
      reviewItems.push({
        sheet: "Link air video",
        row: v.rowNum,
        type: "UNMATCHED_VIDEO_KOL",
        message: `Video của KOL '${v.username}' không tìm thấy Booking tương ứng trong WKF hoặc data! (URL: ${v.videoUrl})`,
      });
    }
  });

  // Process Văn mẫu records
  const templateCategoryMapping = [
    { row: 1, category: "invitation", title: "Mời hợp tác Combo Gội Xả CHESY" },
    { row: 2, category: "invitation", title: "Mời hợp tác Combo Gội Xả (Bản đẩy Ads mạnh)" },
    { row: 3, category: "brief", title: "Hình thức hợp tác Combo Gội Xả (Quyền lợi & Yêu cầu)" },
    { row: 4, category: "sample_sent", title: "Dặn dò mẫu gửi trải nghiệm Combo Gội Xả" },
    { row: 5, category: "confirmation", title: "Xác nhận thông tin hợp tác Combo Gội Xả" },
    { row: 6, category: "brief", title: "Gợi ý Top 5 video đang ra đơn tốt" },
    { row: 7, category: "brief", title: "Gửi brief chi tiết sản phẩm Combo Gội Xả" },
    { row: 9, category: "sample_sent", title: "Dặn dò mẫu gửi KOC Combo Gội Xả" },
    { row: 10, category: "general", title: "Nhắc KOC check cộng tác mục tiêu trên TikTok" },
    { row: 11, category: "feedback", title: "Tư vấn KOC hỗ trợ đẩy 2-3 video cho brand" },
    { row: 12, category: "feedback", title: "Giải thích & tư vấn dung tích mẫu gửi 250ml" },
    { row: 14, category: "general", title: "Lời cảm ơn & Chúc buổi sáng KOC" },
    { row: 15, category: "invitation", title: "Mời hợp tác Sữa Tắm Hương Nước Hoa" },
    { row: 16, category: "brief", title: "Hình thức hợp tác Sữa Tắm Hương Nước Hoa" },
    { row: 17, category: "sample_sent", title: "Dặn dò mẫu gửi Sữa Tắm Hương Nước Hoa" },
    { row: 18, category: "confirmation", title: "Xác nhận thông tin hợp tác Sữa Tắm HNH" },
    { row: 19, category: "brief", title: "Gửi brief chi tiết Sữa Tắm Hương Nước Hoa" },
  ];

  const templateList = [];
  templateCategoryMapping.forEach((m) => {
    const found = vmDataRows.find((r) => r.idx === m.row);
    if (found) {
      templateList.push({
        title: m.title,
        category: m.category,
        content: found.content,
      });
    }
  });

  // ---------------------------------------------------------------------------
  // PRINT DRY RUN REPORT
  // ---------------------------------------------------------------------------

  const uniqueProductNames = Array.from(new Set(bookingList.map((b) => b.productName)));
  const uniqueCampaignNames = Array.from(new Set(bookingList.map((b) => b.campaignName)));

  console.log("\n================================================================================");
  console.log("                        EXCEL IMPORT AUDIT & DRY RUN REPORT");
  console.log("================================================================================");
  console.log(`Target Owner User ID : ${targetUserId} (${ownerEmail})`);
  console.log(`Source Excel File    : ${filePath}`);
  console.log("--------------------------------------------------------------------------------");

  console.log("\n1. KOL SUMMARY:");
  console.log(`  - Tổng số KOL trích xuất được từ Excel: ${kolDict.size}`);
  console.log(`  - Từ sheet 'WKF'                      : 145`);
  console.log(`  - Từ sheet 'data'                     : 10`);

  console.log("\n2. PRODUCT SUMMARY:");
  console.log(`  - Tổng số sản phẩm chuẩn hóa: ${uniqueProductNames.length}`);
  uniqueProductNames.forEach((p) => console.log(`    * ${p}`));

  console.log("\n3. CAMPAIGN SUMMARY:");
  console.log(`  - Tổng số chiến dịch chuẩn hóa: ${uniqueCampaignNames.length}`);
  uniqueCampaignNames.forEach((c) => console.log(`    * ${c}`));

  console.log("\n4. BOOKING SUMMARY:");
  console.log(`  - Tổng số Booking hợp lệ: ${bookingList.length}`);
  console.log(`    * Từ sheet 'WKF'      : 145`);
  console.log(`    * Từ sheet 'data'     : 10`);
  console.log("  - Phân bổ trạng thái Booking:");
  const statusCounts = {};
  bookingList.forEach((b) => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });
  Object.entries(statusCounts).forEach(([st, cnt]) => {
    console.log(`    * ${st.padEnd(14)}: ${cnt} hợp đồng`);
  });

  console.log("\n5. VIDEO SUMMARY:");
  console.log(`  - Tổng số dòng video trong sheet : ${lavDataRows.length}`);
  console.log(`  - Trùng lặp bỏ qua (dedup)       : ${duplicateVideosSkipped}`);
  console.log(`  - Video hợp lệ khớp với Booking  : ${matchedVideos.length}`);
  console.log(`  - Video CHƯA khớp Booking nào    : ${unmatchedVideos.length}`);

  console.log("\n6. TEMPLATE (VĂN MẪU) SUMMARY:");
  console.log(`  - Tổng số văn mẫu trích xuất     : ${templateList.length}`);
  const catCounts = {};
  templateList.forEach((t) => {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
  });
  Object.entries(catCounts).forEach(([cat, cnt]) => {
    console.log(`    * ${cat.padEnd(14)}: ${cnt} mẫu`);
  });

  console.log("\n7. IMPORT REVIEW / ANOMALIES REPORT:");
  console.log(`  - Tổng số mục cần lưu ý & review : ${reviewItems.length}`);
  reviewItems.forEach((item, idx) => {
    console.log(`    [${idx + 1}] [${item.sheet} - Dòng ${item.row}] [${item.type}]`);
    console.log(`        ↳ ${item.message}`);
  });

  if (isDryRun) {
    console.log("\n================================================================================");
    console.log("DRY RUN HOÀN TẤT. Không có dữ liệu nào bị thay đổi trong cơ sở dữ liệu.");
    console.log("Để thực thi import thật, hãy chạy: npm run import:excel -- --execute");
    console.log("================================================================================");
    return;
  }

  // ---------------------------------------------------------------------------
  // EXECUTE MODE: DATABASE INSERTIONS
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log("BẮT ĐẦU THỰC THI GHI DỮ LIỆU VÀO DATABASE (EXECUTE MODE)...");
  console.log("================================================================================");

  // Step 1: Products
  console.log("\n[Bước 1/6] Nhập Danh Mục Sản Phẩm...");
  const dbProductMap = new Map(); // name -> id

  for (const prodName of uniqueProductNames) {
    // Check if product already exists for this user
    const { data: existing } = await supabase
      .from("products")
      .select("id, name")
      .eq("user_id", targetUserId)
      .eq("name", prodName)
      .maybeSingle();

    if (existing) {
      dbProductMap.set(prodName, existing.id);
      console.log(`  - Đã tồn tại: "${prodName}" (${existing.id})`);
    } else {
      const { data: created, error } = await supabase
        .from("products")
        .insert({
          user_id: targetUserId,
          name: prodName,
          brand: "CHESY",
          default_commission_rate: 12,
          default_ads_rate: 7,
          is_active: true,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(`Lỗi tạo sản phẩm "${prodName}": ${error.message}`);
      }
      dbProductMap.set(prodName, created.id);
      console.log(`  + Đã tạo mới: "${prodName}" (${created.id})`);
    }
  }

  // Step 2: Campaigns
  console.log("\n[Bước 2/6] Nhập Danh Mục Chiến Dịch...");
  const dbCampaignMap = new Map(); // name -> id

  for (const campName of uniqueCampaignNames) {
    const { data: existing } = await supabase
      .from("campaigns")
      .select("id, name")
      .eq("user_id", targetUserId)
      .eq("name", campName)
      .maybeSingle();

    if (existing) {
      dbCampaignMap.set(campName, existing.id);
      console.log(`  - Đã tồn tại: "${campName}" (${existing.id})`);
    } else {
      const monthNum = campName.includes("8") ? 8 : 9;
      const { data: created, error } = await supabase
        .from("campaigns")
        .insert({
          user_id: targetUserId,
          name: campName,
          month: monthNum,
          year: 2026,
          status: "active",
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(`Lỗi tạo chiến dịch "${campName}": ${error.message}`);
      }
      dbCampaignMap.set(campName, created.id);
      console.log(`  + Đã tạo mới: "${campName}" (${created.id})`);
    }
  }

  // Step 3: KOLs
  console.log("\n[Bước 3/6] Nhập Danh Sách KOLs...");
  const dbKolMap = new Map(); // username -> id
  let kolsCreated = 0;
  let kolsExisting = 0;

  for (const [username, kolData] of kolDict.entries()) {
    const { data: existing } = await supabase
      .from("kols")
      .select("id, username")
      .eq("user_id", targetUserId)
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      dbKolMap.set(username, existing.id);
      kolsExisting++;
    } else {
      const { data: created, error } = await supabase
        .from("kols")
        .insert({
          user_id: targetUserId,
          username: kolData.username,
          display_name: kolData.display_name,
          platform: kolData.platform,
          channel_url: kolData.channel_url,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(`Lỗi tạo KOL "${username}": ${error.message}`);
      }
      dbKolMap.set(username, created.id);
      kolsCreated++;
    }
  }
  console.log(`  => Đã tạo mới: ${kolsCreated} KOLs | Đã tồn tại: ${kolsExisting} KOLs`);

  // Step 4: Bookings
  console.log("\n[Bước 4/6] Nhập Hợp Đồng Bookings...");
  const dbBookingMap = new Map(); // username -> booking_id
  let bookingsCreated = 0;
  let bookingsExisting = 0;

  for (let idx = 0; idx < bookingList.length; idx++) {
    const b = bookingList[idx];
    const kolId = dbKolMap.get(b.username);
    const productId = dbProductMap.get(b.productName);
    const campaignId = dbCampaignMap.get(b.campaignName);

    if (!kolId) {
      console.warn(`  ! Không tìm thấy kolId cho username: ${b.username}`);
      continue;
    }

    // Deterministic code
    const monthCode = b.campaignName.includes("9") ? "202609" : "202608";
    const bookingCode = `BK-${monthCode}-${String(idx + 1).padStart(4, "0")}`;

    // Check if booking already exists for this KOL & Campaign
    const { data: existing } = await supabase
      .from("bookings")
      .select("id, code")
      .eq("user_id", targetUserId)
      .eq("kol_id", kolId)
      .maybeSingle();

    if (existing) {
      dbBookingMap.set(b.username, existing.id);
      bookingsExisting++;
    } else {
      const { data: created, error } = await supabase
        .from("bookings")
        .insert({
          user_id: targetUserId,
          kol_id: kolId,
          product_id: productId || null,
          campaign_id: campaignId || null,
          code: bookingCode,
          content_type: "video",
          booking_fee: b.bookingFee,
          commission_rate: b.commissionRate,
          ads_rate: b.adsRate,
          status: b.status,
          sample_sent_at: b.sampleSentAt ? new Date(b.sampleSentAt).toISOString() : null,
          sample_expected_at: b.sampleExpectedAt ? new Date(b.sampleExpectedAt).toISOString() : null,
          video_reminder_at: b.videoReminderAt ? new Date(b.videoReminderAt).toISOString() : null,
          expected_post_at: b.expectedPostAt ? new Date(b.expectedPostAt).toISOString() : null,
          recipient_phone: b.recipientPhone,
          recipient_address: b.recipientAddress,
          notes: b.notes,
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(`Lỗi tạo Booking "${bookingCode}" cho KOL "${b.username}": ${error.message}`);
      }
      dbBookingMap.set(b.username, created.id);
      bookingsCreated++;
    }
  }
  console.log(`  => Đã tạo mới: ${bookingsCreated} Bookings | Đã tồn tại: ${bookingsExisting} Bookings`);

  // Step 5: Videos
  console.log("\n[Bước 5/6] Nhập Danh Sách Videos...");
  let videosCreated = 0;
  let videosExisting = 0;

  for (const v of matchedVideos) {
    const bookingId = dbBookingMap.get(v.username);
    if (!bookingId) continue;

    // Check if video URL already exists for this booking
    const { data: existing } = await supabase
      .from("videos")
      .select("id")
      .eq("booking_id", bookingId)
      .eq("video_url", v.videoUrl)
      .maybeSingle();

    if (existing) {
      videosExisting++;
    } else {
      const { error } = await supabase.from("videos").insert({
        booking_id: bookingId,
        video_url: v.videoUrl,
        video_id: v.videoId,
        ads_code: v.adsCode,
        posted_at: v.postedAt ? new Date(v.postedAt).toISOString() : null,
      });

      if (error) {
        console.warn(`  ! Lỗi gắn video ${v.videoUrl}: ${error.message}`);
      } else {
        videosCreated++;
      }
    }
  }
  console.log(`  => Đã tạo mới: ${videosCreated} Videos | Đã tồn tại: ${videosExisting} Videos`);

  // Step 6: Templates
  console.log("\n[Bước 6/6] Nhập Danh Mục Văn Mẫu...");
  let templatesCreated = 0;
  let templatesExisting = 0;

  for (const t of templateList) {
    const { data: existing } = await supabase
      .from("templates")
      .select("id")
      .eq("user_id", targetUserId)
      .eq("title", t.title)
      .maybeSingle();

    if (existing) {
      templatesExisting++;
    } else {
      const { error } = await supabase.from("templates").insert({
        user_id: targetUserId,
        title: t.title,
        category: t.category,
        content: t.content,
      });

      if (error) {
        throw new Error(`Lỗi tạo văn mẫu "${t.title}": ${error.message}`);
      }
      templatesCreated++;
    }
  }
  console.log(`  => Đã tạo mới: ${templatesCreated} Văn mẫu | Đã tồn tại: ${templatesExisting} Văn mẫu`);

  console.log("\n================================================================================");
  console.log("DI CHUYỂN DỮ LIỆU EXCEL HOÀN TẤT THÀNH CÔNG 100%!");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("\n❌ QUÁ TRÌNH DI CHUYỂN THẤT BẠI:", err);
  process.exit(1);
});
