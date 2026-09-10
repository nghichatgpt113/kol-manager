"use server";

import { createClient } from "@/utils/supabase/server";
import type { BookingStatus } from "@/lib/types/booking";
import type { TaskType, TaskStatus } from "@/lib/types/task";
import type { ServiceResult } from "./kols";

export interface DashboardMetrics {
  totalKols: number;
  totalBookings: number;
  activeBookings: number;
  postedVideos: number;
  upcomingDeadlines: number;
  overdueBookings: number;
  pendingTasks: number;
}

export interface StatusDistributionItem {
  status: BookingStatus;
  label: string;
  count: number;
  percentage: number;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
}

export interface OverdueBookingItem {
  id: string;
  code: string | null;
  status: BookingStatus;
  statusLabel: string;
  expected_post_at: string;
  formattedExpectedPostAt: string;
  recipient_name: string | null;
  daysOverdue: number;
  kol: {
    id: string;
    username: string;
    display_name: string | null;
    channel_url: string | null;
  } | null;
  product: {
    id: string;
    name: string;
  } | null;
}

export interface UpcomingBookingItem {
  id: string;
  code: string | null;
  status: BookingStatus;
  statusLabel: string;
  expected_post_at: string;
  formattedExpectedPostAt: string;
  recipient_name: string | null;
  daysUntil: number;
  urgencyText: string;
  urgencyLevel: "today" | "tomorrow" | "approaching" | "normal";
  kol: {
    id: string;
    username: string;
    display_name: string | null;
    channel_url: string | null;
  } | null;
  product: {
    id: string;
    name: string;
  } | null;
}

export interface DashboardPendingTask {
  id: string;
  title: string;
  type: TaskType;
  typeLabel: string;
  due_at: string;
  formattedDueAt: string;
  status: TaskStatus;
  isOverdue: boolean;
  booking: {
    id: string;
    code: string | null;
    kol: {
      username: string;
      display_name: string | null;
    } | null;
  } | null;
}

export interface RecentVideoItem {
  id: string;
  title: string | null;
  video_url: string | null;
  posted_at: string;
  formattedPostedAt: string;
  views_count: number;
  likes_count: number;
  booking: {
    id: string;
    code: string | null;
    kol: {
      id: string;
      username: string;
      display_name: string | null;
    } | null;
    product: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  statusDistribution: StatusDistributionItem[];
  overdueBookings: OverdueBookingItem[];
  upcomingBookings: UpcomingBookingItem[];
  pendingTasks: DashboardPendingTask[];
  recentVideos: RecentVideoItem[];
  currentDateFormatted: string;
}

const BOOKING_STATUS_VN_LABELS: Record<BookingStatus, string> = {
  contacted: "Đã liên hệ",
  confirmed: "Đã xác nhận",
  sample_sent: "Đã gửi mẫu",
  sample_delivered: "Đã nhận mẫu",
  draft_submitted: "Đã gửi draft",
  posted: "Đã đăng",
  completed: "Hoàn tất",
  cancelled: "Đã huỷ",
};

const TASK_TYPE_VN_LABELS: Record<TaskType, string> = {
  sample_delivery_check: "Kiểm tra gửi sample",
  draft_review: "Giục gửi & Duyệt draft",
  video_reminder: "Nhắc đăng video",
  get_air_link: "Lấy link Air",
  get_ads_code: "Xin mã Ads Code",
  payment: "Thanh toán",
  general: "Công việc khác",
};

const STATUS_METADATA: Record<
  BookingStatus,
  { colorClass: string; bgClass: string; borderClass: string; dotClass: string }
> = {
  contacted: {
    colorClass: "text-sky-700 dark:text-sky-300",
    bgClass: "bg-sky-500",
    borderClass: "border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/40",
    dotClass: "bg-sky-500",
  },
  confirmed: {
    colorClass: "text-indigo-700 dark:text-indigo-300",
    bgClass: "bg-indigo-500",
    borderClass: "border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40",
    dotClass: "bg-indigo-500",
  },
  sample_sent: {
    colorClass: "text-amber-700 dark:text-amber-300",
    bgClass: "bg-amber-500",
    borderClass: "border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40",
    dotClass: "bg-amber-500",
  },
  sample_delivered: {
    colorClass: "text-yellow-700 dark:text-yellow-300",
    bgClass: "bg-yellow-500",
    borderClass: "border-yellow-200 dark:border-yellow-800/60 bg-yellow-50 dark:bg-yellow-950/40",
    dotClass: "bg-yellow-500",
  },
  draft_submitted: {
    colorClass: "text-purple-700 dark:text-purple-300",
    bgClass: "bg-purple-500",
    borderClass: "border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/40",
    dotClass: "bg-purple-500",
  },
  posted: {
    colorClass: "text-emerald-700 dark:text-emerald-300",
    bgClass: "bg-emerald-500",
    borderClass: "border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40",
    dotClass: "bg-emerald-500",
  },
  completed: {
    colorClass: "text-teal-700 dark:text-teal-300",
    bgClass: "bg-teal-500",
    borderClass: "border-teal-200 dark:border-teal-800/60 bg-teal-50 dark:bg-teal-950/40",
    dotClass: "bg-teal-500",
  },
  cancelled: {
    colorClass: "text-zinc-600 dark:text-zinc-400",
    bgClass: "bg-zinc-400",
    borderClass: "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/40",
    dotClass: "bg-zinc-400",
  },
};

const ALL_STATUS_ORDER: BookingStatus[] = [
  "contacted",
  "confirmed",
  "sample_sent",
  "sample_delivered",
  "draft_submitted",
  "posted",
  "completed",
  "cancelled",
];

function formatVnDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("T")[0].split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

function formatVnDateTime(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  const date = new Date(isoStr);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${d}/${m}/${y} ${hh}:${mm}`;
}

function getDaysDifference(targetDateStr: string, baseDate: Date): number {
  const [ty, tm, td] = targetDateStr.split("T")[0].split("-").map(Number);
  const targetDate = new Date(ty, tm - 1, td);
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

export async function getDashboardData(): Promise<ServiceResult<DashboardData>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Days of week in Vietnamese
    const dayNames = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const currentDateFormatted = `${dayNames[now.getDay()]}, ${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    // Execute queries in parallel with zero N+1 issues
    const [
      kolCountRes,
      bookingCountRes,
      activeBookingCountRes,
      postedVideoCountRes,
      pendingTaskCountRes,
      statusRowsRes,
      overdueTotalCountRes,
      overdueListRes,
      upcomingTotalCountRes,
      upcomingListRes,
      pendingTasksListRes,
      recentVideosListRes,
    ] = await Promise.all([
      // 1. Total KOLs
      supabase.from("kols").select("*", { count: "exact", head: true }),

      // 2. Total Bookings
      supabase.from("bookings").select("*", { count: "exact", head: true }),

      // 3. Active Bookings (not completed, not cancelled)
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("completed","cancelled")'),

      // 4. Posted Videos
      supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .not("posted_at", "is", null),

      // 5. Pending Tasks
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),

      // 6. Booking Status Rows for distribution
      supabase.from("bookings").select("status"),

      // 7. Overdue Total Count
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("completed","cancelled","posted")')
        .not("expected_post_at", "is", null)
        .lt("expected_post_at", todayStr),

      // 8. Overdue List (limit 6)
      supabase
        .from("bookings")
        .select(`
          id,
          code,
          status,
          expected_post_at,
          recipient_name,
          kol:kols ( id, username, display_name, channel_url ),
          product:products ( id, name )
        `)
        .not("status", "in", '("completed","cancelled","posted")')
        .not("expected_post_at", "is", null)
        .lt("expected_post_at", todayStr)
        .order("expected_post_at", { ascending: true })
        .limit(6),

      // 9. Upcoming Total Count
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("completed","cancelled","posted")')
        .not("expected_post_at", "is", null)
        .gte("expected_post_at", todayStr),

      // 10. Upcoming List (limit 6)
      supabase
        .from("bookings")
        .select(`
          id,
          code,
          status,
          expected_post_at,
          recipient_name,
          kol:kols ( id, username, display_name, channel_url ),
          product:products ( id, name )
        `)
        .not("status", "in", '("completed","cancelled","posted")')
        .not("expected_post_at", "is", null)
        .gte("expected_post_at", todayStr)
        .order("expected_post_at", { ascending: true })
        .limit(6),

      // 11. Pending Tasks List (limit 5)
      supabase
        .from("tasks")
        .select(`
          id,
          title,
          type,
          due_at,
          status,
          booking:bookings (
            id,
            code,
            kol:kols ( username, display_name )
          )
        `)
        .eq("status", "pending")
        .order("due_at", { ascending: true })
        .limit(5),

      // 12. Recent Posted Videos List (limit 5)
      supabase
        .from("videos")
        .select(`
          id,
          title,
          video_url,
          posted_at,
          views_count,
          likes_count,
          booking:bookings (
            id,
            code,
            kol:kols ( id, username, display_name ),
            product:products ( id, name )
          )
        `)
        .not("posted_at", "is", null)
        .order("posted_at", { ascending: false })
        .limit(5),
    ]);

    const totalBookings = bookingCountRes.count ?? 0;

    // Build status distribution
    const statusCounts: Record<BookingStatus, number> = {
      contacted: 0,
      confirmed: 0,
      sample_sent: 0,
      sample_delivered: 0,
      draft_submitted: 0,
      posted: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const r of statusRowsRes.data || []) {
      const st = r.status as BookingStatus;
      if (st in statusCounts) {
        statusCounts[st] += 1;
      }
    }

    const statusDistribution: StatusDistributionItem[] = ALL_STATUS_ORDER.map((st) => {
      const count = statusCounts[st];
      const percentage = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
      const meta = STATUS_METADATA[st];
      return {
        status: st,
        label: BOOKING_STATUS_VN_LABELS[st],
        count,
        percentage,
        colorClass: meta.colorClass,
        bgClass: meta.bgClass,
        borderClass: meta.borderClass,
        dotClass: meta.dotClass,
      };
    });

    // Process Overdue Bookings
    const overdueBookings: OverdueBookingItem[] = (overdueListRes.data || []).map((b) => {
      const diff = getDaysDifference(b.expected_post_at, now);
      const daysOverdue = Math.abs(diff);
      const rawKol = Array.isArray(b.kol) ? b.kol[0] : b.kol;
      const rawProduct = Array.isArray(b.product) ? b.product[0] : b.product;

      return {
        id: b.id,
        code: b.code,
        status: b.status as BookingStatus,
        statusLabel: BOOKING_STATUS_VN_LABELS[b.status as BookingStatus] || b.status,
        expected_post_at: b.expected_post_at,
        formattedExpectedPostAt: formatVnDate(b.expected_post_at),
        recipient_name: b.recipient_name,
        daysOverdue,
        kol: rawKol
          ? {
              id: rawKol.id,
              username: rawKol.username,
              display_name: rawKol.display_name,
              channel_url: rawKol.channel_url,
            }
          : null,
        product: rawProduct
          ? {
              id: rawProduct.id,
              name: rawProduct.name,
            }
          : null,
      };
    });

    // Process Upcoming Bookings
    const upcomingBookings: UpcomingBookingItem[] = (upcomingListRes.data || []).map((b) => {
      const diff = getDaysDifference(b.expected_post_at, now);
      let urgencyText = `Còn ${diff} ngày`;
      let urgencyLevel: UpcomingBookingItem["urgencyLevel"] = "normal";

      if (diff === 0) {
        urgencyText = "Hôm nay";
        urgencyLevel = "today";
      } else if (diff === 1) {
        urgencyText = "Ngày mai";
        urgencyLevel = "tomorrow";
      } else if (diff <= 3) {
        urgencyText = `Còn ${diff} ngày (gấp)`;
        urgencyLevel = "approaching";
      }

      const rawKol = Array.isArray(b.kol) ? b.kol[0] : b.kol;
      const rawProduct = Array.isArray(b.product) ? b.product[0] : b.product;

      return {
        id: b.id,
        code: b.code,
        status: b.status as BookingStatus,
        statusLabel: BOOKING_STATUS_VN_LABELS[b.status as BookingStatus] || b.status,
        expected_post_at: b.expected_post_at,
        formattedExpectedPostAt: formatVnDate(b.expected_post_at),
        recipient_name: b.recipient_name,
        daysUntil: diff,
        urgencyText,
        urgencyLevel,
        kol: rawKol
          ? {
              id: rawKol.id,
              username: rawKol.username,
              display_name: rawKol.display_name,
              channel_url: rawKol.channel_url,
            }
          : null,
        product: rawProduct
          ? {
              id: rawProduct.id,
              name: rawProduct.name,
            }
          : null,
      };
    });

    // Process Pending Tasks
    const pendingTasks: DashboardPendingTask[] = (pendingTasksListRes.data || []).map((t) => {
      const isOverdue = new Date(t.due_at).getTime() < now.getTime();
      const rawBooking = Array.isArray(t.booking) ? t.booking[0] : t.booking;
      const rawKol = rawBooking?.kol
        ? Array.isArray(rawBooking.kol)
          ? rawBooking.kol[0]
          : rawBooking.kol
        : null;

      return {
        id: t.id,
        title: t.title,
        type: t.type as TaskType,
        typeLabel: TASK_TYPE_VN_LABELS[t.type as TaskType] || t.type,
        due_at: t.due_at,
        formattedDueAt: formatVnDateTime(t.due_at),
        status: t.status as TaskStatus,
        isOverdue,
        booking: rawBooking
          ? {
              id: rawBooking.id,
              code: rawBooking.code,
              kol: rawKol
                ? {
                    username: rawKol.username,
                    display_name: rawKol.display_name,
                  }
                : null,
            }
          : null,
      };
    });

    // Process Recent Videos
    const recentVideos: RecentVideoItem[] = (recentVideosListRes.data || []).map((v) => {
      const rawBooking = Array.isArray(v.booking) ? v.booking[0] : v.booking;
      const rawKol = rawBooking?.kol
        ? Array.isArray(rawBooking.kol)
          ? rawBooking.kol[0]
          : rawBooking.kol
        : null;
      const rawProduct = rawBooking?.product
        ? Array.isArray(rawBooking.product)
          ? rawBooking.product[0]
          : rawBooking.product
        : null;

      return {
        id: v.id,
        title: v.title,
        video_url: v.video_url,
        posted_at: v.posted_at,
        formattedPostedAt: formatVnDate(v.posted_at),
        views_count: v.views_count ?? 0,
        likes_count: v.likes_count ?? 0,
        booking: rawBooking
          ? {
              id: rawBooking.id,
              code: rawBooking.code,
              kol: rawKol
                ? {
                    id: rawKol.id,
                    username: rawKol.username,
                    display_name: rawKol.display_name,
                  }
                : null,
              product: rawProduct
                ? {
                    id: rawProduct.id,
                    name: rawProduct.name,
                  }
                : null,
            }
          : null,
      };
    });

    return {
      data: {
        metrics: {
          totalKols: kolCountRes.count ?? 0,
          totalBookings,
          activeBookings: activeBookingCountRes.count ?? 0,
          postedVideos: postedVideoCountRes.count ?? 0,
          upcomingDeadlines: upcomingTotalCountRes.count ?? 0,
          overdueBookings: overdueTotalCountRes.count ?? 0,
          pendingTasks: pendingTaskCountRes.count ?? 0,
        },
        statusDistribution,
        overdueBookings,
        upcomingBookings,
        pendingTasks,
        recentVideos,
        currentDateFormatted,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Không thể tải dữ liệu bảng điều khiển",
    };
  }
}
