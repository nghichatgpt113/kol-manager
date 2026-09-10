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

async function runStep10Tests() {
  console.log("Starting STEP 10: Task & Reminder Management Security and Integration Tests...");
  console.log(`Target Supabase URL: ${SUPABASE_URL}`);

  // Create isolated clients for User A and User B
  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });

  // -------------------------------------------------------------------------
  // 0. AUTHENTICATION OF USER A & USER B
  // -------------------------------------------------------------------------
  logHeader("0. AUTHENTICATION & IDENTITY VERIFICATION");

  const { data: authA, error: authAErr } = await clientA.auth.signInWithPassword(
    USER_A_CREDENTIALS
  );
  if (authAErr || !authA.user) {
    throw new Error(`Failed to authenticate User A: ${authAErr?.message}`);
  }
  logResult(
    "User A authenticated",
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
    "User B authenticated",
    "PASS",
    `User ID: ${authB.user.id} (${authB.user.email})`
  );

  if (authA.user.id === authB.user.id) {
    throw new Error("User A and User B have the same ID! Cannot test isolation.");
  }
  logResult(
    "User A and User B have distinct identities",
    "PASS",
    `User A: ${authA.user.id} !== User B: ${authB.user.id}`
  );

  // -------------------------------------------------------------------------
  // 1. SETUP PREREQUISITES FOR USER A (KOL + Booking)
  // -------------------------------------------------------------------------
  logHeader("1. SETUP PREREQUISITES FOR USER A");

  let { data: kolsA } = await clientA.from("kols").select("id").limit(1);
  let kolAId = kolsA?.[0]?.id;
  if (!kolAId) {
    const { data: newKolA, error: kolErr } = await clientA
      .from("kols")
      .insert({
        user_id: authA.user.id,
        username: "test_kol_task_" + Date.now(),
        platform: "tiktok",
        channel_url: "https://tiktok.com/@test_kol_task",
      })
      .select()
      .single();
    if (kolErr) throw kolErr;
    kolAId = newKolA.id;
  }

  const { data: bookingA, error: bookingAErr } = await clientA
    .from("bookings")
    .insert({
      user_id: authA.user.id,
      kol_id: kolAId,
      code: "BK-TASK-" + Date.now().toString().slice(-6),
      status: "confirmed",
      booking_fee: 2000000,
      video_reminder_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    })
    .select()
    .single();

  if (bookingAErr || !bookingA) {
    throw new Error(`Failed to create Booking A: ${bookingAErr?.message}`);
  }
  logResult("Booking A created for User A", "PASS", `Booking ID: ${bookingA.id}`);

  // -------------------------------------------------------------------------
  // 2. USER A TASK OPERATIONS (CRUD + WORKFLOW)
  // -------------------------------------------------------------------------
  logHeader("2. USER A: FULL TASK LIFECYCLE (CREATE, READ, UPDATE, COMPLETE, DELETE)");

  // 2.1 CREATE
  const { data: taskA, error: taskAErr } = await clientA
    .from("tasks")
    .insert({
      user_id: authA.user.id,
      booking_id: bookingA.id,
      title: "Task A - Giục gửi draft",
      type: "draft_review",
      status: "pending",
      due_at: new Date(Date.now() + 86400000).toISOString(),
      notes: "Ghi chú mẫu cho User A",
    })
    .select()
    .single();

  if (taskAErr || !taskA) {
    throw new Error(`User A failed to create Task A: ${taskAErr?.message}`);
  }
  logResult("User A created Task A", "PASS", `Task ID: ${taskA.id}, type: ${taskA.type}`);

  // 2.2 READ
  const { data: readTaskA, error: readAErr } = await clientA
    .from("tasks")
    .select("*")
    .eq("id", taskA.id)
    .single();

  if (readAErr || !readTaskA || readTaskA.id !== taskA.id) {
    throw new Error(`User A failed to read Task A: ${readAErr?.message}`);
  }
  logResult("User A read Task A", "PASS", `Title: "${readTaskA.title}", status: ${readTaskA.status}`);

  // 2.3 UPDATE
  const updatedNotes = "Ghi chú đã được User A cập nhật " + Date.now();
  const { data: updatedTaskA, error: updateAErr } = await clientA
    .from("tasks")
    .update({ notes: updatedNotes })
    .eq("id", taskA.id)
    .select()
    .single();

  if (updateAErr || updatedTaskA.notes !== updatedNotes) {
    throw new Error(`User A failed to update Task A: ${updateAErr?.message}`);
  }
  logResult("User A updated Task A", "PASS", `Updated notes: "${updatedTaskA.notes}"`);

  // 2.4 COMPLETE (Set completed status & completed_at)
  const completedAt = new Date().toISOString();
  const { data: completedTaskA, error: completeAErr } = await clientA
    .from("tasks")
    .update({
      status: "completed",
      completed_at: completedAt,
    })
    .eq("id", taskA.id)
    .select()
    .single();

  if (completeAErr || completedTaskA.status !== "completed" || !completedTaskA.completed_at) {
    throw new Error(`User A failed to complete Task A: ${completeAErr?.message}`);
  }
  logResult(
    "User A completed Task A",
    "PASS",
    `Status: ${completedTaskA.status}, completed_at: ${completedTaskA.completed_at}`
  );

  // -------------------------------------------------------------------------
  // 3. USER B ISOLATION TESTS (RLS ENFORCEMENT)
  // -------------------------------------------------------------------------
  logHeader("3. USER B ISOLATION: USER B CANNOT ACCESS USER A'S TASK");

  // 3.1 User B CANNOT read Task A
  const { data: userBReadTaskA } = await clientB
    .from("tasks")
    .select("*")
    .eq("id", taskA.id);

  if (userBReadTaskA && userBReadTaskA.length > 0) {
    logResult("User B read Task A", "FAIL", "User B leaked User A's task!");
    throw new Error("RLS Breach: User B can read User A's task");
  } else {
    logResult(
      "User B cannot read Task A (RLS returned 0 rows)",
      "PASS",
      `Query returned empty array: ${JSON.stringify(userBReadTaskA)}`
    );
  }

  // 3.2 User B CANNOT update Task A
  const { data: userBUpdateTaskA } = await clientB
    .from("tasks")
    .update({ title: "Hacked by User B" })
    .eq("id", taskA.id)
    .select();

  if (userBUpdateTaskA && userBUpdateTaskA.length > 0) {
    logResult("User B updated Task A", "FAIL", "User B modified User A's task!");
    throw new Error("RLS Breach: User B updated User A's task");
  } else {
    logResult(
      "User B cannot update Task A (RLS prevented update, 0 rows modified)",
      "PASS",
      `Rows returned: ${userBUpdateTaskA?.length ?? 0}`
    );
  }

  // Double check Task A is unchanged
  const { data: verifyTaskA } = await clientA
    .from("tasks")
    .select("title")
    .eq("id", taskA.id)
    .single();
  if (verifyTaskA?.title === "Hacked by User B") {
    throw new Error("Integrity error: User B's modification took effect!");
  }
  logResult("Verified Task A title remains intact", "PASS", `Title: "${verifyTaskA.title}"`);

  // 3.3 User B CANNOT complete Task A
  const { data: userBCompleteTaskA } = await clientB
    .from("tasks")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", taskA.id)
    .select();

  if (userBCompleteTaskA && userBCompleteTaskA.length > 0) {
    logResult("User B completed Task A", "FAIL", "User B completed User A's task!");
    throw new Error("RLS Breach: User B completed User A's task");
  } else {
    logResult(
      "User B cannot complete Task A (RLS blocked, 0 rows affected)",
      "PASS"
    );
  }

  // 3.4 User B CANNOT delete Task A
  const { data: userBDeleteTaskA } = await clientB
    .from("tasks")
    .delete()
    .eq("id", taskA.id)
    .select();

  if (userBDeleteTaskA && userBDeleteTaskA.length > 0) {
    logResult("User B deleted Task A", "FAIL", "User B deleted User A's task!");
    throw new Error("RLS Breach: User B deleted User A's task");
  } else {
    logResult(
      "User B cannot delete Task A (RLS prevented delete, 0 rows affected)",
      "PASS"
    );
  }

  // Double check Task A still exists in User A's account
  const { data: taskAStillExists } = await clientA
    .from("tasks")
    .select("id")
    .eq("id", taskA.id)
    .single();

  if (!taskAStillExists) {
    throw new Error("Integrity error: Task A disappeared after User B delete attempt!");
  }
  logResult("Verified Task A still exists safely under User A", "PASS", `Task ID: ${taskAStillExists.id}`);

  // -------------------------------------------------------------------------
  // 4. BOOKING OWNERSHIP INTEGRITY (CROSS-USER BOOKING ATTACHMENT)
  // -------------------------------------------------------------------------
  logHeader("4. BOOKING OWNERSHIP INTEGRITY: USER B CANNOT ATTACH TASK TO USER A'S BOOKING");

  // 4.1 User B tries to create a task pointing to bookingA.id
  const { error: crossErr } = await clientB
    .from("tasks")
    .insert({
      user_id: authB.user.id,
      booking_id: bookingA.id,
      title: "Malicious Task on User A Booking",
      type: "general",
      due_at: new Date().toISOString(),
    })
    .select();

  if (!crossErr) {
    logResult(
      "User B attached task to User A's booking",
      "FAIL",
      "Cross-user booking attachment succeeded unexpectedly!"
    );
    throw new Error("Security Violation: User B attached task to User A's booking!");
  } else {
    logResult(
      "User B attaching task to User A's Booking is REJECTED by DB foreign key",
      "PASS",
      `Error Code: ${crossErr.code}, Message: ${crossErr.message}`
    );
  }

  // 4.2 Spoofed user_id test: User B tries to insert with user_id = authA.user.id
  const { error: spoofedErr } = await clientB
    .from("tasks")
    .insert({
      user_id: authA.user.id, // Spoofing User A's ID
      booking_id: bookingA.id,
      title: "Spoofed User ID Task",
      type: "general",
      due_at: new Date().toISOString(),
    })
    .select();

  if (!spoofedErr) {
    logResult(
      "User B inserted task with spoofed user_id",
      "FAIL",
      "RLS WITH CHECK failed to reject spoofed user_id!"
    );
    throw new Error("Security Violation: Spoofed user_id succeeded!");
  } else {
    logResult(
      "Spoofed user_id insertion is REJECTED by RLS policy",
      "PASS",
      `Error Code: ${spoofedErr.code}, Message: ${spoofedErr.message}`
    );
  }

  // -------------------------------------------------------------------------
  // 5. ON DELETE CASCADE BEHAVIOR
  // -------------------------------------------------------------------------
  logHeader("5. ON DELETE CASCADE BEHAVIOR: BOOKING -> TASKS");

  // Create a second task for Booking A
  const { data: taskA2, error: taskA2Err } = await clientA
    .from("tasks")
    .insert({
      user_id: authA.user.id,
      booking_id: bookingA.id,
      title: "Task A2 - Nhắc đăng video",
      type: "video_reminder",
      status: "pending",
      due_at: new Date(Date.now() + 86400000 * 2).toISOString(),
    })
    .select()
    .single();

  if (taskA2Err || !taskA2) {
    throw new Error(`Failed to create second task: ${taskA2Err?.message}`);
  }
  logResult("Created second task for Booking A", "PASS", `Task A2 ID: ${taskA2.id}`);

  // Verify both taskA and taskA2 are associated with bookingA
  const { data: tasksBeforeDelete } = await clientA
    .from("tasks")
    .select("id")
    .eq("booking_id", bookingA.id);

  logResult(
    `Booking A currently has ${tasksBeforeDelete.length} tasks`,
    "PASS",
    `IDs: ${tasksBeforeDelete.map((t) => t.id).join(", ")}`
  );

  // Delete Booking A
  const { error: deleteBookingErr } = await clientA
    .from("bookings")
    .delete()
    .eq("id", bookingA.id);

  if (deleteBookingErr) {
    throw new Error(`Failed to delete Booking A: ${deleteBookingErr.message}`);
  }
  logResult("User A deleted Booking A", "PASS", `Booking ID: ${bookingA.id}`);

  // Verify tasks are CASCADE-deleted
  const { data: tasksAfterDelete } = await clientA
    .from("tasks")
    .select("id")
    .in("id", [taskA.id, taskA2.id]);

  if (tasksAfterDelete && tasksAfterDelete.length > 0) {
    logResult(
      "Tasks still exist after booking deletion",
      "FAIL",
      `Found remaining task IDs: ${tasksAfterDelete.map((t) => t.id).join(", ")}`
    );
    throw new Error("Cascade Delete Failed: Tasks were not deleted with booking");
  } else {
    logResult(
      "All associated tasks were automatically CASCADE-deleted with the booking",
      "PASS",
      "0 residual task rows remain"
    );
  }

  // -------------------------------------------------------------------------
  // 6. STANDALONE TASK LIFECYCLE & CLEANUP
  // -------------------------------------------------------------------------
  logHeader("6. STANDALONE TASK (NO BOOKING) & DELETE OPERATION");

  const { data: standaloneTask, error: standaloneErr } = await clientA
    .from("tasks")
    .insert({
      user_id: authA.user.id,
      title: "Standalone Task - Thanh toán công nợ",
      type: "payment",
      status: "pending",
      due_at: new Date(Date.now() + 3600000).toISOString(),
    })
    .select()
    .single();

  if (standaloneErr || !standaloneTask) {
    throw new Error(`Failed to create standalone task: ${standaloneErr?.message}`);
  }
  logResult("User A created standalone task (booking_id = null)", "PASS", `ID: ${standaloneTask.id}`);

  // User A deletes standalone task
  const { error: deleteStandaloneErr } = await clientA
    .from("tasks")
    .delete()
    .eq("id", standaloneTask.id);

  if (deleteStandaloneErr) {
    throw new Error(`Failed to delete standalone task: ${deleteStandaloneErr.message}`);
  }
  logResult("User A deleted standalone task directly", "PASS", `ID: ${standaloneTask.id}`);

  // -------------------------------------------------------------------------
  // 7. SUMMARY
  // -------------------------------------------------------------------------
  logHeader("ALL STEP 10 DIRECT SUPABASE CLIENT TESTS PASSED");
  console.log("✅ User A CRUD & Lifecycle: Verified");
  console.log("✅ User B Isolation & RLS: Verified (Read, Update, Complete, Delete all 0 rows)");
  console.log("✅ Booking Ownership & FK Integrity: Verified (Cross-user booking attachment blocked by DB constraint)");
  console.log("✅ Spoofed user_id: Verified (Blocked by RLS WITH CHECK)");
  console.log("✅ ON DELETE CASCADE: Verified (Tasks deleted when parent Booking is deleted)");
  console.log("✅ Standalone Tasks: Verified (Nullable booking_id supported)");
}

runStep10Tests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
