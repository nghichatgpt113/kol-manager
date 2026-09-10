/**
 * Task Domain Types & Constants
 * Compatible with Supabase public.tasks database schema & CHECK constraints
 */

export type TaskType =
  | "sample_delivery_check"
  | "video_reminder"
  | "draft_review"
  | "get_air_link"
  | "get_ads_code"
  | "payment"
  | "general";

export type TaskStatus = "pending" | "completed" | "cancelled";

export interface TaskBookingContext {
  id: string;
  code: string | null;
  expected_post_at?: string | null;
  kol?: {
    username: string;
    display_name: string | null;
  } | null;
  product?: {
    name: string;
  } | null;
}

export interface Task {
  id: string;
  user_id: string;
  booking_id: string | null;
  title: string;
  type: TaskType;
  due_at: string;
  status: TaskStatus;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined relation for UI context
  booking?: TaskBookingContext | null;
}

export interface CreateTaskInput {
  booking_id?: string | null;
  title: string;
  type?: TaskType;
  due_at: string;
  notes?: string | null;
}

export interface UpdateTaskInput {
  booking_id?: string | null;
  title?: string;
  type?: TaskType;
  due_at?: string;
  status?: TaskStatus;
  completed_at?: string | null;
  notes?: string | null;
}

export interface TaskMetrics {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  sample_delivery_check: "Kiểm tra gửi sample",
  draft_review: "Giục gửi & Duyệt draft",
  video_reminder: "Nhắc đăng video",
  get_air_link: "Lấy link Air",
  get_ads_code: "Xin mã Ads Code",
  payment: "Thanh toán",
  general: "Công việc khác",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Chờ xử lý",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
};

/**
 * Checks if a task is overdue:
 * - status must be 'pending'
 * - due_at is before current time
 */
export function isTaskOverdue(task: { status: TaskStatus; due_at: string }): boolean {
  if (task.status !== "pending") return false;
  return new Date(task.due_at).getTime() < Date.now();
}
