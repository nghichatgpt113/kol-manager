"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus,
  TaskType,
  TaskMetrics,
} from "@/lib/types/task";
import type { ServiceResult } from "./kols";

const VALID_TASK_TYPES: TaskType[] = [
  "sample_delivery_check",
  "video_reminder",
  "draft_review",
  "get_air_link",
  "get_ads_code",
  "payment",
  "general",
];

const VALID_TASK_STATUSES: TaskStatus[] = ["pending", "completed", "cancelled"];

/**
 * Retrieves all tasks for the authenticated user, optionally filtered by status or bookingId.
 */
export async function getTasks(filter?: {
  status?: string;
  bookingId?: string;
}): Promise<ServiceResult<Task[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    let query = supabase
      .from("tasks")
      .select(
        `
        *,
        booking:bookings(
          id,
          code,
          expected_post_at,
          kol:kols(username, display_name),
          product:products(name)
        )
      `
      )
      .eq("user_id", user.id);

    if (filter?.status && filter.status !== "all") {
      if (filter.status === "overdue") {
        query = query
          .eq("status", "pending")
          .lt("due_at", new Date().toISOString());
      } else if (VALID_TASK_STATUSES.includes(filter.status as TaskStatus)) {
        query = query.eq("status", filter.status);
      }
    }

    if (filter?.bookingId) {
      query = query.eq("booking_id", filter.bookingId);
    }

    query = query.order("due_at", { ascending: true });

    const { data, error } = await query;

    if (error) {
      return { data: null, error: "Không thể tải danh sách công việc: " + error.message };
    }

    return { data: (data as unknown as Task[]) ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không mong muốn khi tải danh sách công việc",
    };
  }
}

/**
 * Retrieves a single task by its ID, ensuring ownership by the authenticated user.
 */
export async function getTaskById(id: string): Promise<ServiceResult<Task>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        booking:bookings(
          id,
          code,
          expected_post_at,
          kol:kols(username, display_name),
          product:products(name)
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return { data: null, error: "Không thể tải thông tin công việc: " + error.message };
    }

    if (!data) {
      return { data: null, error: "Không tìm thấy công việc hoặc bạn không có quyền truy cập" };
    }

    return { data: data as unknown as Task, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không mong muốn khi tải công việc",
    };
  }
}

/**
 * Retrieves all tasks associated with a specific booking ID.
 */
export async function getTasksByBookingId(
  bookingId: string
): Promise<ServiceResult<Task[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    const { data, error } = await supabase
      .from("tasks")
      .select(
        `
        *,
        booking:bookings(
          id,
          code,
          expected_post_at,
          kol:kols(username, display_name),
          product:products(name)
        )
      `
      )
      .eq("booking_id", bookingId)
      .eq("user_id", user.id)
      .order("due_at", { ascending: true });

    if (error) {
      return { data: null, error: "Không thể tải công việc của hợp tác: " + error.message };
    }

    return { data: (data as unknown as Task[]) ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải danh sách công việc của hợp tác",
    };
  }
}

/**
 * Computes high-level task metrics for the authenticated user.
 */
export async function getTaskMetrics(): Promise<ServiceResult<TaskMetrics>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, status, due_at")
      .eq("user_id", user.id);

    if (error) {
      return { data: null, error: error.message };
    }

    const now = Date.now();
    let pending = 0;
    let completed = 0;
    let overdue = 0;

    (tasks ?? []).forEach((t) => {
      if (t.status === "completed") {
        completed++;
      } else if (t.status === "pending") {
        pending++;
        if (new Date(t.due_at).getTime() < now) {
          overdue++;
        }
      }
    });

    return {
      data: {
        total: (tasks ?? []).length,
        pending,
        completed,
        overdue,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to compute metrics",
    };
  }
}

/**
 * Creates a new task for the authenticated user.
 */
export async function createTask(
  input: CreateTaskInput
): Promise<ServiceResult<Task>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    // Validation
    const trimmedTitle = input.title?.trim();
    if (!trimmedTitle) {
      return { data: null, error: "Vui lòng nhập tên công việc" };
    }

    if (!input.due_at) {
      return { data: null, error: "Vui lòng chọn thời hạn (Deadline) cho công việc" };
    }

    const taskType: TaskType = input.type && VALID_TASK_TYPES.includes(input.type)
      ? input.type
      : "general";

    // If booking_id is provided, verify ownership of that booking
    let bookingIdToSave: string | null = null;
    if (input.booking_id && input.booking_id.trim() !== "") {
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .select("id")
        .eq("id", input.booking_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (bookingErr || !booking) {
        return {
          data: null,
          error: "Hợp tác (Booking) được chọn không tồn tại hoặc bạn không có quyền truy cập",
        };
      }
      bookingIdToSave = booking.id;
    }

    const insertPayload = {
      user_id: user.id,
      booking_id: bookingIdToSave,
      title: trimmedTitle,
      type: taskType,
      due_at: new Date(input.due_at).toISOString(),
      status: "pending" as TaskStatus,
      completed_at: null,
      notes: input.notes ? input.notes.trim() || null : null,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(insertPayload)
      .select(
        `
        *,
        booking:bookings(
          id,
          code,
          expected_post_at,
          kol:kols(username, display_name),
          product:products(name)
        )
      `
      )
      .single();

    if (error) {
      return { data: null, error: "Không thể tạo công việc: " + error.message };
    }

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    if (bookingIdToSave) {
      revalidatePath("/bookings");
    }

    return { data: data as unknown as Task, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không mong muốn khi tạo công việc",
    };
  }
}

/**
 * Updates an existing task.
 */
export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<ServiceResult<Task>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    // Verify task existence and ownership
    const { data: existingTask, error: fetchErr } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !existingTask) {
      return { data: null, error: "Không tìm thấy công việc hoặc bạn không có quyền sửa" };
    }

    const updatePayload: Record<string, unknown> = {};

    if (input.title !== undefined) {
      const trimmedTitle = input.title.trim();
      if (!trimmedTitle) {
        return { data: null, error: "Tên công việc không được để trống" };
      }
      updatePayload.title = trimmedTitle;
    }

    if (input.type !== undefined) {
      if (!VALID_TASK_TYPES.includes(input.type)) {
        return { data: null, error: "Loại công việc không hợp lệ" };
      }
      updatePayload.type = input.type;
    }

    if (input.due_at !== undefined) {
      if (!input.due_at) {
        return { data: null, error: "Thời hạn (Deadline) không được để trống" };
      }
      updatePayload.due_at = new Date(input.due_at).toISOString();
    }

    if (input.notes !== undefined) {
      updatePayload.notes = input.notes ? input.notes.trim() || null : null;
    }

    if (input.booking_id !== undefined) {
      if (input.booking_id && input.booking_id.trim() !== "") {
        const { data: booking, error: bErr } = await supabase
          .from("bookings")
          .select("id")
          .eq("id", input.booking_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (bErr || !booking) {
          return {
            data: null,
            error: "Hợp tác (Booking) được chọn không tồn tại hoặc bạn không có quyền",
          };
        }
        updatePayload.booking_id = booking.id;
      } else {
        updatePayload.booking_id = null;
      }
    }

    // Status transition validation
    if (input.status !== undefined) {
      if (!VALID_TASK_STATUSES.includes(input.status)) {
        return { data: null, error: "Trạng thái công việc không hợp lệ" };
      }

      // Disallow illegal workflow reversals
      if (
        (existingTask.status === "completed" || existingTask.status === "cancelled") &&
        input.status === "pending"
      ) {
        return {
          data: null,
          error: "Không thể chuyển công việc đã đóng về trạng thái chờ xử lý",
        };
      }

      updatePayload.status = input.status;
      if (input.status === "completed") {
        updatePayload.completed_at = input.completed_at || new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }
    }

    const { data, error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        booking:bookings(
          id,
          code,
          expected_post_at,
          kol:kols(username, display_name),
          product:products(name)
        )
      `
      )
      .single();

    if (error) {
      return { data: null, error: "Không thể cập nhật công việc: " + error.message };
    }

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/bookings");

    return { data: data as unknown as Task, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không mong muốn khi cập nhật công việc",
    };
  }
}

/**
 * Marks a pending task as completed.
 */
export async function completeTask(id: string): Promise<ServiceResult<Task>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    // Check existing task
    const { data: existingTask, error: fetchErr } = await supabase
      .from("tasks")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !existingTask) {
      return { data: null, error: "Không tìm thấy công việc hoặc bạn không có quyền" };
    }

    if (existingTask.status === "completed") {
      return { data: null, error: "Công việc này đã được hoàn thành trước đó" };
    }

    if (existingTask.status === "cancelled") {
      return { data: null, error: "Công việc đã bị hủy, không thể hoàn thành" };
    }

    const { data, error } = await supabase
      .from("tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        booking:bookings(
          id,
          code,
          expected_post_at,
          kol:kols(username, display_name),
          product:products(name)
        )
      `
      )
      .single();

    if (error) {
      return { data: null, error: "Không thể hoàn thành công việc: " + error.message };
    }

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/bookings");

    return { data: data as unknown as Task, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi hoàn thành công việc",
    };
  }
}

/**
 * Cancels a pending task.
 */
export async function cancelTask(id: string): Promise<ServiceResult<Task>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    // Check existing task
    const { data: existingTask, error: fetchErr } = await supabase
      .from("tasks")
      .select("status")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !existingTask) {
      return { data: null, error: "Không tìm thấy công việc hoặc bạn không có quyền" };
    }

    if (existingTask.status === "cancelled") {
      return { data: null, error: "Công việc này đã bị hủy trước đó" };
    }

    if (existingTask.status === "completed") {
      return { data: null, error: "Công việc đã hoàn thành, không thể hủy" };
    }

    const { data, error } = await supabase
      .from("tasks")
      .update({
        status: "cancelled",
        completed_at: null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        `
        *,
        booking:bookings(
          id,
          code,
          expected_post_at,
          kol:kols(username, display_name),
          product:products(name)
        )
      `
      )
      .single();

    if (error) {
      return { data: null, error: "Không thể hủy công việc: " + error.message };
    }

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/bookings");

    return { data: data as unknown as Task, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi hủy công việc",
    };
  }
}

/**
 * Permanently deletes a task.
 */
export async function deleteTask(id: string): Promise<ServiceResult<boolean>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    // Ensure the task belongs to the user
    const { data: existingTask, error: fetchErr } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !existingTask) {
      return { data: null, error: "Không tìm thấy công việc hoặc bạn không có quyền xóa" };
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { data: null, error: "Không thể xóa công việc: " + error.message };
    }

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/bookings");

    return { data: true, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi xóa công việc",
    };
  }
}
