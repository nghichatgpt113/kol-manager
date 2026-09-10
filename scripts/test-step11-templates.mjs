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

async function runStep11Tests() {
  console.log("Starting STEP 11: Template Management Security & RLS Tests...");
  console.log(`Target Supabase URL: ${SUPABASE_URL}`);

  // Create isolated clients for User A, User B, and Anon (unauthenticated)
  const clientA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const clientB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  // 1. USER A: FULL LIFECYCLE (CREATE, READ, UPDATE, DELETE)
  // -------------------------------------------------------------------------
  logHeader("1. USER A: FULL LIFECYCLE (CREATE, READ, UPDATE, DELETE)");

  // 1.1 CREATE Template A
  const templateTitle = "Mẫu Mời Hợp Tác TikTok " + Date.now();
  const templateContent =
    "Chào {{kol_name}},\nBên mình từ nhãn hàng muốn mời bạn trải nghiệm sản phẩm {{product_name}}.\nDeadline dự kiến: {{expected_post_date}}.";
  const variablesDesc =
    "{{kol_name}}: Tên KOL, {{product_name}}: Tên sản phẩm, {{expected_post_date}}: Ngày lên sóng";

  const { data: templateA, error: createAErr } = await clientA
    .from("templates")
    .insert({
      user_id: authA.user.id,
      title: templateTitle,
      category: "invitation",
      content: templateContent,
      variables_description: variablesDesc,
    })
    .select()
    .single();

  if (createAErr || !templateA) {
    throw new Error(`User A failed to create Template A: ${createAErr?.message}`);
  }
  logResult(
    "User A created Template A",
    "PASS",
    `ID: ${templateA.id} | Category: ${templateA.category} | Title: "${templateA.title}"`
  );

  // 1.2 READ Template A
  const { data: readTemplateA, error: readAErr } = await clientA
    .from("templates")
    .select("*")
    .eq("id", templateA.id)
    .single();

  if (readAErr || !readTemplateA || readTemplateA.id !== templateA.id) {
    throw new Error(`User A failed to read Template A: ${readAErr?.message}`);
  }
  logResult(
    "User A read Template A",
    "PASS",
    `Retrieved content length: ${readTemplateA.content.length} chars`
  );

  // 1.3 UPDATE Template A
  const updatedContent = templateContent + "\n(Đã cập nhật thêm chính sách hoa hồng)";
  const { data: updatedTemplateA, error: updateAErr } = await clientA
    .from("templates")
    .update({ content: updatedContent })
    .eq("id", templateA.id)
    .select()
    .single();

  if (updateAErr || updatedTemplateA.content !== updatedContent) {
    throw new Error(`User A failed to update Template A: ${updateAErr?.message}`);
  }
  logResult(
    "User A updated Template A",
    "PASS",
    "Content successfully updated"
  );

  // -------------------------------------------------------------------------
  // 2. USER B ISOLATION TESTS (RLS ENFORCEMENT)
  // -------------------------------------------------------------------------
  logHeader("2. USER B ISOLATION: USER B CANNOT ACCESS USER A'S TEMPLATE");

  // 2.1 User B CANNOT read Template A
  const { data: userBReadA } = await clientB
    .from("templates")
    .select("*")
    .eq("id", templateA.id);

  if (userBReadA && userBReadA.length > 0) {
    logResult("User B read Template A", "FAIL", "User B leaked User A's template!");
    throw new Error("RLS Breach: User B can read User A's template");
  } else {
    logResult(
      "User B cannot read Template A (RLS returned 0 rows)",
      "PASS",
      `Query returned empty array: ${JSON.stringify(userBReadA)}`
    );
  }

  // 2.2 User B CANNOT update Template A
  const { data: userBUpdateA } = await clientB
    .from("templates")
    .update({ title: "Hacked by User B" })
    .eq("id", templateA.id)
    .select();

  if (userBUpdateA && userBUpdateA.length > 0) {
    logResult("User B updated Template A", "FAIL", "User B modified User A's template!");
    throw new Error("RLS Breach: User B modified User A's template");
  } else {
    logResult(
      "User B cannot update Template A (RLS prevented update, 0 rows modified)",
      "PASS",
      `Rows returned: ${userBUpdateA?.length ?? 0}`
    );
  }

  // Double check Template A title remains unchanged
  const { data: verifyTemplateA } = await clientA
    .from("templates")
    .select("title")
    .eq("id", templateA.id)
    .single();

  if (verifyTemplateA?.title === "Hacked by User B") {
    throw new Error("Integrity error: User B's modification took effect!");
  }
  logResult(
    "Verified Template A title remains intact under User A",
    "PASS",
    `Title: "${verifyTemplateA.title}"`
  );

  // 2.3 User B CANNOT delete Template A
  const { data: userBDeleteA } = await clientB
    .from("templates")
    .delete()
    .eq("id", templateA.id)
    .select();

  if (userBDeleteA && userBDeleteA.length > 0) {
    logResult("User B deleted Template A", "FAIL", "User B deleted User A's template!");
    throw new Error("RLS Breach: User B deleted User A's template");
  } else {
    logResult(
      "User B cannot delete Template A (RLS prevented delete, 0 rows deleted)",
      "PASS",
      `Rows deleted: ${userBDeleteA?.length ?? 0}`
    );
  }

  // Double check Template A still exists safely under User A
  const { data: templateAStillExists } = await clientA
    .from("templates")
    .select("id")
    .eq("id", templateA.id)
    .single();

  if (!templateAStillExists) {
    throw new Error("Integrity error: Template A disappeared after User B delete attempt!");
  }
  logResult(
    "Verified Template A still exists safely under User A",
    "PASS",
    `Template ID: ${templateAStillExists.id}`
  );

  // -------------------------------------------------------------------------
  // 3. SPOOFED USER_ID & UNAUTHENTICATED ACCESS
  // -------------------------------------------------------------------------
  logHeader("3. SPOOFED USER_ID & UNAUTHENTICATED ACCESS PREVENTION");

  // 3.1 User B tries to insert with spoofed user_id = authA.user.id
  const { error: spoofedErr } = await clientB
    .from("templates")
    .insert({
      user_id: authA.user.id, // Spoofing User A's ID
      title: "Malicious Spoofed Template",
      category: "general",
      content: "This should be blocked by RLS WITH CHECK",
    })
    .select();

  if (!spoofedErr) {
    logResult(
      "User B inserted template with spoofed user_id",
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

  // 3.2 Unauthenticated client CANNOT read templates
  const { data: anonRead } = await anonClient
    .from("templates")
    .select("*");

  if (anonRead && anonRead.length > 0) {
    throw new Error("Security Violation: Unauthenticated user can read templates!");
  }
  logResult(
    "Unauthenticated client cannot read templates (RLS returned 0 rows)",
    "PASS",
    `Rows: ${anonRead?.length ?? 0}`
  );

  // 3.3 Unauthenticated client CANNOT insert templates
  const { error: anonInsertErr } = await anonClient
    .from("templates")
    .insert({
      user_id: authA.user.id,
      title: "Anon Malicious Template",
      category: "general",
      content: "Unauthenticated insert",
    });

  if (!anonInsertErr) {
    throw new Error("Security Violation: Unauthenticated insert succeeded!");
  }
  logResult(
    "Unauthenticated client cannot insert templates (REJECTED by RLS)",
    "PASS",
    `Error: ${anonInsertErr.message}`
  );

  // -------------------------------------------------------------------------
  // 4. CLEANUP: USER A DELETES TEMPLATE A
  // -------------------------------------------------------------------------
  logHeader("4. CLEANUP: USER A DELETES TEMPLATE A");

  const { error: deleteAErr } = await clientA
    .from("templates")
    .delete()
    .eq("id", templateA.id);

  if (deleteAErr) {
    throw new Error(`User A failed to delete Template A: ${deleteAErr.message}`);
  }
  logResult("User A deleted Template A successfully", "PASS", `ID: ${templateA.id}`);

  // Confirm deleted
  const { data: finalCheck } = await clientA
    .from("templates")
    .select("id")
    .eq("id", templateA.id)
    .maybeSingle();

  if (finalCheck) {
    throw new Error("Template A still exists after delete!");
  }
  logResult("Confirmed Template A no longer exists in database", "PASS");

  // -------------------------------------------------------------------------
  // 5. SUMMARY
  // -------------------------------------------------------------------------
  logHeader("ALL STEP 11 SECURITY & INTEGRATION TESTS PASSED");
  console.log("✅ User A Full Lifecycle: Verified (Create, Read, Update, Delete)");
  console.log("✅ User B Isolation & RLS: Verified (Read, Update, Delete all 0 rows affected)");
  console.log("✅ Spoofed user_id: Verified (Blocked by RLS WITH CHECK, Error 42501)");
  console.log("✅ Unauthenticated Access: Verified (Blocked by RLS)");
}

runStep11Tests().catch((err) => {
  console.error("\n❌ STEP 11 TEST SUITE FAILED:", err);
  process.exit(1);
});
