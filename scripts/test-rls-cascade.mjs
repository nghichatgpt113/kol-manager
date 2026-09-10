import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://flyphduvyxyrphuklmdp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_xlQ5U5KW6NXry3K24RbxcA_LHzRwF9m";

const USER_A_CREDENTIALS = {
  email: "test@gmail.com",
  password: "123789",
};

const USER_B_CREDENTIALS = {
  email: "test2@gmail.com",
  password: "123789",
};

function logHeader(title) {
  console.log("\n" + "=".repeat(70));
  console.log(`  ${title}`);
  console.log("=".repeat(70));
}

function logResult(step, status, details) {
  const symbol = status === "PASS" ? "✅ PASS" : "❌ FAIL";
  console.log(`[${symbol}] ${step}`);
  if (details) {
    console.log(`   ↳ ${details}`);
  }
}

async function runTests() {
  console.log("Starting Step 9 Direct Supabase Client Verification...");
  console.log(`Target Supabase URL: ${SUPABASE_URL}`);

  // Create isolated clients
  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  // -------------------------------------------------------------------------
  // 0. AUTHENTICATION OF USER A & USER B
  // -------------------------------------------------------------------------
  logHeader("0. AUTHENTICATION OF USER A AND USER B");

  const { data: authA, error: authAErr } = await clientA.auth.signInWithPassword(
    USER_A_CREDENTIALS
  );
  if (authAErr || !authA.user) {
    throw new Error(`Failed to authenticate User A: ${authAErr?.message}`);
  }
  logResult(
    "User A signed in successfully",
    "PASS",
    `User ID: ${authA.user.id} (${authA.user.email})`
  );

  const { data: authB, error: authBErr } = await clientB.auth.signInWithPassword(
    USER_B_CREDENTIALS
  );
  if (authBErr || !authB.user) {
    throw new Error(`Failed to authenticate User B: ${authBErr?.message}`);
  }
  logResult(
    "User B signed in successfully",
    "PASS",
    `User ID: ${authB.user.id} (${authB.user.email})`
  );

  if (authA.user.id === authB.user.id) {
    throw new Error("User A and User B have the same User ID! Cannot test isolation.");
  }
  logResult(
    "User A and User B have distinct identities",
    "PASS",
    `User A (${authA.user.id}) !== User B (${authB.user.id})`
  );

  // -------------------------------------------------------------------------
  // 1. RLS THỰC TẾ (ROW LEVEL SECURITY VERIFICATION)
  // -------------------------------------------------------------------------
  logHeader("1. RLS THỰC TẾ: ISOLATION TEST (USER A vs USER B)");

  // Step 1.1: Ensure User A has a valid KOL
  let { data: kolsA } = await clientA.from("kols").select("id").limit(1);
  let kolAId = kolsA?.[0]?.id;
  if (!kolAId) {
    const { data: newKolA, error: kolErr } = await clientA
      .from("kols")
      .insert({
        user_id: authA.user.id,
        username: "test_kol_a_" + Date.now(),
        platform: "tiktok",
        channel_url: "https://tiktok.com/@test_kol_a",
      })
      .select()
      .single();
    if (kolErr) throw kolErr;
    kolAId = newKolA.id;
  }

  // Step 1.2: User A creates Booking A
  const bookingACode = "BK-RLS-A-" + Date.now();
  const { data: bookingA, error: bookingAErr } = await clientA
    .from("bookings")
    .insert({
      user_id: authA.user.id,
      kol_id: kolAId,
      code: bookingACode,
      status: "confirmed",
      booking_fee: 1500000,
    })
    .select()
    .single();

  if (bookingAErr || !bookingA) {
    throw new Error(`User A failed to create Booking A: ${bookingAErr?.message}`);
  }
  logResult(
    "User A created Booking A",
    "PASS",
    `Booking ID: ${bookingA.id} | Code: ${bookingA.code}`
  );

  // Step 1.3: User A creates Video A
  const { data: videoA, error: videoAErr } = await clientA
    .from("videos")
    .insert({
      booking_id: bookingA.id,
      video_url: "https://www.tiktok.com/@creator/video/7300000000000000001",
      video_id: "7300000000000000001",
      title: "Video A Original Title by User A",
      ads_code: "SPARK_ADS_USER_A_001",
      posted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (videoAErr || !videoA) {
    throw new Error(`User A failed to create Video A: ${videoAErr?.message}`);
  }
  logResult(
    "User A created Video A",
    "PASS",
    `Video ID: ${videoA.id} | Title: "${videoA.title}" | Ads Code: "${videoA.ads_code}"`
  );

  // Step 1.4: User A reads Video A
  const { data: userAReadVideo, error: userAReadErr } = await clientA
    .from("videos")
    .select("*")
    .eq("id", videoA.id)
    .single();

  if (userAReadErr || !userAReadVideo || userAReadVideo.id !== videoA.id) {
    throw new Error(`User A failed to read Video A: ${userAReadErr?.message}`);
  }
  logResult(
    "User A reads Video A",
    "PASS",
    `Successfully retrieved Video A: "${userAReadVideo.title}"`
  );

  // Step 1.5: User A updates Video A
  const updatedTitle = "Video A Updated by User A at " + new Date().toISOString();
  const { data: userAUpdVideo, error: userAUpdErr } = await clientA
    .from("videos")
    .update({
      title: updatedTitle,
      ads_code: "SPARK_ADS_USER_A_UPDATED",
    })
    .eq("id", videoA.id)
    .select()
    .single();

  if (userAUpdErr || !userAUpdVideo || userAUpdVideo.title !== updatedTitle) {
    throw new Error(`User A failed to update Video A: ${userAUpdErr?.message}`);
  }
  logResult(
    "User A updates Video A",
    "PASS",
    `Successfully updated title to: "${userAUpdVideo.title}"`
  );

  // Step 1.6: User B attempts to READ Video A
  const { data: userBReadVideo, error: userBReadErr } = await clientB
    .from("videos")
    .select("*")
    .eq("id", videoA.id);

  const isUserBReadBlocked =
    (!userBReadVideo || userBReadVideo.length === 0) && !userBReadErr;
  if (!isUserBReadBlocked) {
    throw new Error(
      `RLS VIOLATION: User B was able to read Video A! Data: ${JSON.stringify(
        userBReadVideo
      )}`
    );
  }
  logResult(
    "User B CANNOT read Video A",
    "PASS",
    `Query returned 0 rows (data: []). Supabase RLS filtered out Video A from User B.`
  );

  // Step 1.7: User B attempts to UPDATE Video A
  const { data: userBUpdVideo, error: userBUpdErr } = await clientB
    .from("videos")
    .update({
      title: "HACKED BY USER B",
      ads_code: "HACKED_CODE",
    })
    .eq("id", videoA.id)
    .select();

  const isUserBUpdateBlocked = !userBUpdVideo || userBUpdVideo.length === 0;
  if (!isUserBUpdateBlocked) {
    throw new Error(
      `RLS VIOLATION: User B was able to update Video A! Data: ${JSON.stringify(
        userBUpdVideo
      )}`
    );
  }
  logResult(
    "User B CANNOT update Video A",
    "PASS",
    `Update query modified 0 rows (data: []). Supabase RLS prevented unauthorized mutation.`
  );

  // Verify Video A was NOT modified by User B
  const { data: verifyVideoA } = await clientA
    .from("videos")
    .select("title")
    .eq("id", videoA.id)
    .single();
  if (verifyVideoA?.title !== updatedTitle) {
    throw new Error("Integrity error: Video A title was tampered with!");
  }
  logResult(
    "Video A title remains intact after User B update attempt",
    "PASS",
    `Current title: "${verifyVideoA?.title}"`
  );

  // Step 1.8: User B attempts to DELETE Video A
  const { data: userBDelVideo, error: userBDelErr } = await clientB
    .from("videos")
    .delete()
    .eq("id", videoA.id)
    .select();

  const isUserBDeleteBlocked = !userBDelVideo || userBDelVideo.length === 0;
  if (!isUserBDeleteBlocked) {
    throw new Error(
      `RLS VIOLATION: User B was able to delete Video A! Data: ${JSON.stringify(
        userBDelVideo
      )}`
    );
  }
  logResult(
    "User B CANNOT delete Video A",
    "PASS",
    `Delete query deleted 0 rows (data: []). Supabase RLS prevented unauthorized deletion.`
  );

  // Step 1.9: User B attempts to CREATE Video into Booking A
  const { data: userBCreateVideo, error: userBCreateErr } = await clientB
    .from("videos")
    .insert({
      booking_id: bookingA.id,
      video_url: "https://tiktok.com/@user_b/video/999999999",
      title: "User B Illegitimate Video into Booking A",
    })
    .select();

  const isUserBCreateBlocked =
    userBCreateErr &&
    (userBCreateErr.code === "42501" ||
      userBCreateErr.message.includes("violates row-level security policy"));

  if (!isUserBCreateBlocked) {
    throw new Error(
      `RLS VIOLATION: User B was able to insert video into User A's Booking A! Result: ${JSON.stringify(
        userBCreateVideo
      )}, Error: ${userBCreateErr?.message}`
    );
  }
  logResult(
    "User B CANNOT create Video into Booking A",
    "PASS",
    `Database rejected insert with Postgres error ${userBCreateErr.code}: "${userBCreateErr.message}"`
  );

  // Step 1.10: User A deletes Video A
  const { data: userADelVideo, error: userADelErr } = await clientA
    .from("videos")
    .delete()
    .eq("id", videoA.id)
    .select();

  if (userADelErr || !userADelVideo || userADelVideo.length === 0) {
    throw new Error(`User A failed to delete Video A: ${userADelErr?.message}`);
  }
  logResult(
    "User A deletes Video A",
    "PASS",
    `Successfully deleted Video A (${videoA.id})`
  );

  // Clean up Booking A
  await clientA.from("bookings").delete().eq("id", bookingA.id);
  logResult("Cleaned up temporary Booking A", "PASS");

  // -------------------------------------------------------------------------
  // 2. ON DELETE CASCADE TEST
  // -------------------------------------------------------------------------
  logHeader("2. ON DELETE CASCADE TEST (BOOKING -> VIDEOS)");

  // Step 2.1: User A creates a dedicated Booking for cascade testing
  const cascadeBookingCode = "BK-CASCADE-" + Date.now();
  const { data: bookingCascade, error: cascadeBookingErr } = await clientA
    .from("bookings")
    .insert({
      user_id: authA.user.id,
      kol_id: kolAId,
      code: cascadeBookingCode,
      status: "confirmed",
      booking_fee: 2000000,
    })
    .select()
    .single();

  if (cascadeBookingErr || !bookingCascade) {
    throw new Error(
      `Failed to create Booking for cascade test: ${cascadeBookingErr?.message}`
    );
  }
  logResult(
    "User A created Booking for cascade test",
    "PASS",
    `Booking ID: ${bookingCascade.id} | Code: ${bookingCascade.code}`
  );

  // Step 2.2: User A creates Video 1 under Booking
  const { data: video1, error: video1Err } = await clientA
    .from("videos")
    .insert({
      booking_id: bookingCascade.id,
      video_url: "https://www.tiktok.com/@creator/video/8800000000000000001",
      video_id: "8800000000000000001",
      title: "Cascade Test - Video 1",
      ads_code: "SPARK_CASCADE_V1",
    })
    .select()
    .single();

  if (video1Err || !video1) {
    throw new Error(`Failed to create Video 1: ${video1Err?.message}`);
  }
  logResult(
    "User A created Video 1 under Booking",
    "PASS",
    `Video 1 ID: ${video1.id} | Title: "${video1.title}"`
  );

  // Step 2.3: User A creates Video 2 under Booking
  const { data: video2, error: video2Err } = await clientA
    .from("videos")
    .insert({
      booking_id: bookingCascade.id,
      video_url: "https://www.tiktok.com/@creator/video/8800000000000000002",
      video_id: "8800000000000000002",
      title: "Cascade Test - Video 2",
      ads_code: "SPARK_CASCADE_V2",
    })
    .select()
    .single();

  if (video2Err || !video2) {
    throw new Error(`Failed to create Video 2: ${video2Err?.message}`);
  }
  logResult(
    "User A created Video 2 under Booking",
    "PASS",
    `Video 2 ID: ${video2.id} | Title: "${video2.title}"`
  );

  // Step 2.4: Verify both Video 1 & Video 2 exist in DB before deletion
  const { data: videosBeforeDelete, error: vCountErr } = await clientA
    .from("videos")
    .select("id, title")
    .eq("booking_id", bookingCascade.id);

  if (vCountErr || !videosBeforeDelete || videosBeforeDelete.length !== 2) {
    throw new Error(
      `Expected 2 videos before delete, but found: ${videosBeforeDelete?.length}`
    );
  }
  logResult(
    "Verified exactly 2 videos exist under Booking before delete",
    "PASS",
    `Found [${videosBeforeDelete.map((v) => `"${v.title}" (${v.id})`).join(", ")}]`
  );

  // Step 2.5: User A deletes Booking
  console.log("\nDeleting Booking (triggering ON DELETE CASCADE in PostgreSQL)...");
  const { error: delBookingErr } = await clientA
    .from("bookings")
    .delete()
    .eq("id", bookingCascade.id);

  if (delBookingErr) {
    throw new Error(`Failed to delete Booking: ${delBookingErr.message}`);
  }
  logResult(
    "User A deleted Booking successfully",
    "PASS",
    `Deleted Booking ID: ${bookingCascade.id}`
  );

  // Step 2.6: Query DB to verify Video 1 & Video 2 are automatically deleted by CASCADE
  const { data: videosAfterDeleteByBooking } = await clientA
    .from("videos")
    .select("id")
    .eq("booking_id", bookingCascade.id);

  const { data: checkVideo1Direct } = await clientA
    .from("videos")
    .select("id")
    .eq("id", video1.id);

  const { data: checkVideo2Direct } = await clientA
    .from("videos")
    .select("id")
    .eq("id", video2.id);

  const cascadePassed =
    videosAfterDeleteByBooking?.length === 0 &&
    checkVideo1Direct?.length === 0 &&
    checkVideo2Direct?.length === 0;

  if (!cascadePassed) {
    throw new Error(
      `CASCADE FAILED: Videos still exist after Booking deletion! Video 1 exists: ${
        checkVideo1Direct?.length > 0
      }, Video 2 exists: ${checkVideo2Direct?.length > 0}`
    );
  }

  logResult(
    "Verified Video 1 & Video 2 were automatically deleted via ON DELETE CASCADE",
    "PASS",
    `Videos for booking_id: 0 rows | Video 1 by ID: 0 rows | Video 2 by ID: 0 rows`
  );

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  logHeader("FINAL VERIFICATION SUMMARY");
  console.log("1. RLS THỰC TẾ (User A vs User B via Supabase Client):");
  console.log("   - User A: Tạo Booking A -> Tạo Video A -> Đọc/Sửa/Xóa Video A: PASS ✅");
  console.log("   - User B: Không đọc được Video A (0 rows returned): PASS ✅");
  console.log("   - User B: Không sửa được Video A (0 rows updated): PASS ✅");
  console.log("   - User B: Không xóa được Video A (0 rows deleted): PASS ✅");
  console.log("   - User B: Không tạo được Video vào Booking A (Error 42501 RLS Policy Violation): PASS ✅");
  console.log("2. ON DELETE CASCADE (Booking -> Video 1 + Video 2):");
  console.log("   - Booking có Video 1 và Video 2: PASS ✅");
  console.log("   - Xóa Booking -> Video 1 & Video 2 tự động bị xóa sạch khỏi DB: PASS ✅");
  console.log("\nALL TESTS PASSED! Step 9 is ready for APPROVED ✅\n");
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED with error:\n", err);
  process.exit(1);
});
