"use client";

import { useState, useEffect, useCallback } from "react";
import type { Booking, BookingStatus, PaymentStatus, BookingStatusHistory } from "@/lib/types/booking";
import type { Video, CreateVideoInput } from "@/lib/types/video";
import type { Task, TaskType } from "@/lib/types/task";
import { TASK_TYPE_LABELS, isTaskOverdue } from "@/lib/types/task";
import { getBookingStatusHistory } from "@/lib/services/bookings";
import {
  getVideosByBookingId,
  createVideo,
  updateVideo,
  deleteVideo,
} from "@/lib/services/videos";
import {
  getTasksByBookingId,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
} from "@/lib/services/tasks";
import { formatVND, formatDate, formatDateTime, getCarrierTrackingUrl } from "../types";
import { STATUS_META } from "../table/inline-status-cell";
import PlatformIcon from "@/components/icons/platform-icon";
import CustomSelect from "@/components/ui/custom-select";

const PAYMENT_CONFIG: Record<
  PaymentStatus,
  { label: string; bg: string; dot: string }
> = {
  unpaid: {
    label: "Chưa thanh toán",
    bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900/60",
    dot: "bg-rose-500",
  },
  partially_paid: {
    label: "Thanh toán 1 phần",
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/60",
    dot: "bg-amber-500",
  },
  paid: {
    label: "Đã thanh toán đủ",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/60",
    dot: "bg-emerald-500",
  },
};

interface BookingDetailDrawerProps {
  booking: Booking | null;
  onClose: () => void;
  onOpenEdit: (booking: Booking) => void;
  onAdvanceStatus: (bookingId: string, nextStatus: BookingStatus) => void;
  onVideosChange?: (bookingId: string, videos: Video[]) => void;
}

function getAdsCodeStatus(expiresAt: string | null | undefined) {
  if (!expiresAt) return null;
  const [y, m, d] = expiresAt.split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const expDate = new Date(y, m - 1, d);
  const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "expired" as const,
      label: `Đã hết hạn (${formatDate(expiresAt)})`,
      className:
        "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900/60",
    };
  }
  if (diffDays <= 7) {
    return {
      status: "expiring" as const,
      label:
        diffDays === 0
          ? `Hết hạn hôm nay (${formatDate(expiresAt)})`
          : `Sắp hết hạn: còn ${diffDays} ngày (${formatDate(expiresAt)})`,
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
    };
  }
  return {
    status: "valid" as const,
    label: `Hạn: ${formatDate(expiresAt)} (còn ${diffDays} ngày)`,
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
  };
}

export default function BookingDetailDrawer({
  booking,
  onClose,
  onOpenEdit,
  onAdvanceStatus,
  onVideosChange,
}: BookingDetailDrawerProps) {
  const [detailTab, setDetailTab] = useState<
    "overview" | "shipping" | "deadlines" | "videos" | "tasks" | "history"
  >("overview");

  // History state
  const [auditHistory, setAuditHistory] = useState<BookingStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Videos state (already preloaded from booking.videos in getBookings)
  const [bookingVideos, setBookingVideos] = useState<Video[]>(() => booking?.videos || []);
  const [loadingVideos, setLoadingVideos] = useState(() => !Array.isArray(booking?.videos));
  const [videoActionError, setVideoActionError] = useState<string | null>(null);
  const [videoSuccessMessage, setVideoSuccessMessage] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [videoFormData, setVideoFormData] = useState<CreateVideoInput>({
    booking_id: "",
    video_url: "",
    video_id: "",
    title: "",
    air_url: "",
    ads_code: "",
    ads_code_expires_at: "",
    posted_at: "",
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
    notes: "",
  });
  const [videoFormError, setVideoFormError] = useState<string | null>(null);
  const [confirmDeleteVideo, setConfirmDeleteVideo] = useState<Video | null>(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [copiedAdsCodeId, setCopiedAdsCodeId] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Tasks state
  const [bookingTasks, setBookingTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [taskSuccessMessage, setTaskSuccessMessage] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<{
    title: string;
    type: TaskType;
    due_date: string;
    due_time: string;
    notes: string;
  }>({
    title: "",
    type: "general",
    due_date: "",
    due_time: "18:00",
    notes: "",
  });
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  const loadHistory = useCallback(async (targetBookingId: string) => {
    setLoadingHistory(true);
    try {
      const res = await getBookingStatusHistory(targetBookingId);
      if (res.data) setAuditHistory(res.data);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Load tasks and status history asynchronously once when booking opens
  // Videos are only fetched if booking.videos was not preloaded
  const bookingId = booking?.id;
  const bookingStatus = booking?.status;
  const hasPreloadedVideos = Array.isArray(booking?.videos);
  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    if (!hasPreloadedVideos) {
      getVideosByBookingId(bookingId).then((res) => {
        if (!active) return;
        if (res.data) setBookingVideos(res.data);
        setLoadingVideos(false);
      });
    }
    getTasksByBookingId(bookingId).then((res) => {
      if (!active) return;
      if (res.data) setBookingTasks(res.data);
      setLoadingTasks(false);
    });
    return () => {
      active = false;
    };
  }, [bookingId, hasPreloadedVideos]);

  useEffect(() => {
    if (!bookingId) return;
    let active = true;
    getBookingStatusHistory(bookingId).then((res) => {
      if (!active) return;
      if (res.data) setAuditHistory(res.data);
      setLoadingHistory(false);
    });
    return () => {
      active = false;
    };
  }, [bookingId, bookingStatus]);

  // Capture Escape key when sub-modals are open so we close the sub-modal first instead of closing the drawer
  useEffect(() => {
    const hasSubModal = Boolean(
      confirmDeleteVideo || isVideoModalOpen || confirmDeleteTask || isTaskModalOpen
    );
    if (!hasSubModal) return;

    const handleCaptureKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        e.preventDefault();
        if (confirmDeleteVideo) setConfirmDeleteVideo(null);
        else if (isVideoModalOpen) {
          setIsVideoModalOpen(false);
          setEditingVideo(null);
        } else if (confirmDeleteTask) setConfirmDeleteTask(null);
        else if (isTaskModalOpen) {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }
      }
    };

    window.addEventListener("keydown", handleCaptureKeyDown, true);
    return () => window.removeEventListener("keydown", handleCaptureKeyDown, true);
  }, [confirmDeleteVideo, isVideoModalOpen, confirmDeleteTask, isTaskModalOpen]);

  if (!booking) return null;

  const currentStatusMeta = STATUS_META[booking.status] || STATUS_META.contacted;
  const trackingUrl = getCarrierTrackingUrl(booking.sample_carrier, booking.sample_tracking_code);
  const paymentCfg = PAYMENT_CONFIG[booking.payment_status] || PAYMENT_CONFIG.unpaid;

  // ============================================================================
  // VIDEO CRUD HANDLERS
  // ============================================================================
  const handleOpenAddVideo = () => {
    setEditingVideo(null);
    setVideoFormData({
      booking_id: booking.id,
      video_url: "",
      video_id: "",
      title: "",
      air_url: "",
      ads_code: "",
      ads_code_expires_at: "",
      posted_at: "",
      views_count: 0,
      likes_count: 0,
      comments_count: 0,
      notes: "",
    });
    setVideoFormError(null);
    setIsVideoModalOpen(true);
  };

  const handleOpenEditVideo = (video: Video) => {
    setEditingVideo(video);
    setVideoFormData({
      booking_id: video.booking_id,
      video_url: video.video_url || "",
      video_id: video.video_id || "",
      title: video.title || "",
      air_url: video.air_url || "",
      ads_code: video.ads_code || "",
      ads_code_expires_at: video.ads_code_expires_at
        ? video.ads_code_expires_at.slice(0, 10)
        : "",
      posted_at: video.posted_at ? video.posted_at.slice(0, 10) : "",
      views_count: video.views_count ?? 0,
      likes_count: video.likes_count ?? 0,
      comments_count: video.comments_count ?? 0,
      notes: video.notes || "",
    });
    setVideoFormError(null);
    setIsVideoModalOpen(true);
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVideoFormError(null);

    const videoUrl = videoFormData.video_url?.trim() || null;
    const airUrl = videoFormData.air_url?.trim() || null;
    const adsCode = videoFormData.ads_code?.trim() || null;
    const title = videoFormData.title?.trim() || null;

    if (!videoUrl && !airUrl && !adsCode && !title) {
      setVideoFormError(
        "Vui lòng nhập ít nhất một thông tin: Link video, Link Air, Mã Ads hoặc Tiêu đề."
      );
      return;
    }

    setIsSubmittingVideo(true);
    try {
      if (editingVideo) {
        const res = await updateVideo(editingVideo.id, {
          video_url: videoUrl,
          video_id: videoFormData.video_id?.trim() || null,
          title,
          air_url: airUrl,
          ads_code: adsCode,
          ads_code_expires_at: videoFormData.ads_code_expires_at || null,
          posted_at: videoFormData.posted_at || null,
          views_count: Math.max(0, Number(videoFormData.views_count ?? 0)),
          likes_count: Math.max(0, Number(videoFormData.likes_count ?? 0)),
          comments_count: Math.max(0, Number(videoFormData.comments_count ?? 0)),
          notes: videoFormData.notes?.trim() || null,
        });

        if (res.error) {
          setVideoFormError(res.error);
        } else if (res.data) {
          const updatedList = bookingVideos.map((v) =>
            v.id === res.data!.id ? res.data! : v
          );
          setBookingVideos(updatedList);
          onVideosChange?.(booking.id, updatedList);
          setIsVideoModalOpen(false);
          setEditingVideo(null);
          setVideoSuccessMessage("Cập nhật video thành công!");
          setTimeout(() => setVideoSuccessMessage(null), 3000);
        }
      } else {
        const res = await createVideo({
          booking_id: booking.id,
          video_url: videoUrl,
          video_id: videoFormData.video_id?.trim() || null,
          title,
          air_url: airUrl,
          ads_code: adsCode,
          ads_code_expires_at: videoFormData.ads_code_expires_at || null,
          posted_at: videoFormData.posted_at || null,
          views_count: Math.max(0, Number(videoFormData.views_count ?? 0)),
          likes_count: Math.max(0, Number(videoFormData.likes_count ?? 0)),
          comments_count: Math.max(0, Number(videoFormData.comments_count ?? 0)),
          notes: videoFormData.notes?.trim() || null,
        });

        if (res.error) {
          setVideoFormError(res.error);
        } else if (res.data) {
          const updatedList = [res.data, ...bookingVideos];
          setBookingVideos(updatedList);
          onVideosChange?.(booking.id, updatedList);
          setIsVideoModalOpen(false);
          setVideoSuccessMessage("Thêm video mới thành công!");
          setTimeout(() => setVideoSuccessMessage(null), 3000);
        }
      }
    } catch {
      setVideoFormError("Có lỗi xảy ra khi lưu video.");
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  const handleDeleteVideoConfirm = async () => {
    if (!confirmDeleteVideo) return;
    setIsDeletingVideo(true);
    try {
      const res = await deleteVideo(confirmDeleteVideo.id);
      if (!res.success) {
        setVideoActionError(res.error || "Không thể xóa video.");
      } else {
        const updatedList = bookingVideos.filter((v) => v.id !== confirmDeleteVideo.id);
        setBookingVideos(updatedList);
        onVideosChange?.(booking.id, updatedList);
        setConfirmDeleteVideo(null);
        setVideoSuccessMessage("Đã xóa video thành công.");
        setTimeout(() => setVideoSuccessMessage(null), 3000);
      }
    } catch {
      setVideoActionError("Lỗi hệ thống khi xóa video.");
    } finally {
      setIsDeletingVideo(false);
    }
  };

  const handleCopyAdsCode = async (code: string, id: string) => {
    if (!code) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = code;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
    } catch {
      // ignore fallback errors
    }
    setCopiedAdsCodeId(id);
    setTimeout(() => setCopiedAdsCodeId(null), 2500);
  };

  // ============================================================================
  // TASK CRUD HANDLERS
  // ============================================================================
  const handleOpenAddTask = () => {
    setEditingTask(null);
    setTaskFormError(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setTaskFormData({
      title: "",
      type: "general",
      due_date: `${yyyy}-${mm}-${dd}`,
      due_time: "18:00",
      notes: "",
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormError(null);
    const dateObj = new Date(task.due_at);
    let due_date = "";
    let due_time = "18:00";
    if (!isNaN(dateObj.getTime())) {
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const hh = String(dateObj.getHours()).padStart(2, "0");
      const min = String(dateObj.getMinutes()).padStart(2, "0");
      due_date = `${yyyy}-${mm}-${dd}`;
      due_time = `${hh}:${min}`;
    }
    setTaskFormData({
      title: task.title,
      type: task.type,
      due_date,
      due_time,
      notes: task.notes || "",
    });
    setIsTaskModalOpen(true);
  };

  const handleCreateVideoReminderTask = async () => {
    if (!booking.video_reminder_at) return;
    setLoadingTasks(true);
    setTaskActionError(null);
    try {
      const reminderDate = booking.video_reminder_at.split("T")[0];
      const dueIso = new Date(`${reminderDate}T18:00:00`).toISOString();
      const res = await createTask({
        booking_id: booking.id,
        title: "Nhắc đăng video",
        type: "video_reminder",
        due_at: dueIso,
        notes: `Nhắc KOL @${booking.kol?.username || ""} đăng video theo lịch dự kiến.`,
      });
      if (res.error || !res.data) {
        setTaskActionError(res.error || "Không thể tạo công việc nhắc nhở");
      } else {
        setBookingTasks((prev) => [res.data!, ...prev]);
        setTaskSuccessMessage("Đã tạo công việc nhắc đăng video!");
        setDetailTab("tasks");
        setTimeout(() => setTaskSuccessMessage(null), 3000);
      }
    } catch {
      setTaskActionError("Đã xảy ra lỗi khi tạo công việc nhắc nhở");
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleCompleteTaskAction = async (task: Task) => {
    setTaskActionError(null);
    try {
      const res = await completeTask(task.id);
      if (res.error || !res.data) {
        setTaskActionError(res.error || "Không thể hoàn thành công việc");
      } else {
        setBookingTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: "completed",
                  completed_at: res.data!.completed_at,
                }
              : t
          )
        );
        setTaskSuccessMessage("Đã hoàn thành công việc!");
        setTimeout(() => setTaskSuccessMessage(null), 3000);
      }
    } catch {
      setTaskActionError("Đã xảy ra lỗi khi hoàn thành công việc");
    }
  };

  const handleSaveTaskForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormData.title.trim()) {
      setTaskFormError("Vui lòng nhập tên công việc");
      return;
    }
    if (!taskFormData.due_date) {
      setTaskFormError("Vui lòng chọn ngày deadline");
      return;
    }

    const dueIso = new Date(
      `${taskFormData.due_date}T${taskFormData.due_time || "18:00"}:00`
    ).toISOString();

    setIsSubmittingTask(true);
    setTaskFormError(null);

    try {
      if (editingTask) {
        const res = await updateTask(editingTask.id, {
          title: taskFormData.title.trim(),
          type: taskFormData.type,
          due_at: dueIso,
          notes: taskFormData.notes.trim() || null,
        });

        if (res.error || !res.data) {
          setTaskFormError(res.error || "Không thể cập nhật công việc");
        } else {
          setBookingTasks((prev) =>
            prev.map((t) => (t.id === editingTask.id ? res.data! : t))
          );
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setTaskSuccessMessage("Cập nhật công việc thành công!");
          setTimeout(() => setTaskSuccessMessage(null), 3000);
        }
      } else {
        const res = await createTask({
          booking_id: booking.id,
          title: taskFormData.title.trim(),
          type: taskFormData.type,
          due_at: dueIso,
          notes: taskFormData.notes.trim() || null,
        });

        if (res.error || !res.data) {
          setTaskFormError(res.error || "Không thể tạo công việc");
        } else {
          setBookingTasks((prev) => [res.data!, ...prev]);
          setIsTaskModalOpen(false);
          setTaskSuccessMessage("Thêm công việc mới thành công!");
          setTimeout(() => setTaskSuccessMessage(null), 3000);
        }
      }
    } catch {
      setTaskFormError("Đã xảy ra lỗi khi lưu công việc");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleDeleteTaskConfirm = async () => {
    if (!confirmDeleteTask) return;
    setIsDeletingTask(true);
    try {
      const res = await deleteTask(confirmDeleteTask.id);
      if (res.error) {
        setTaskActionError(res.error);
      } else {
        setBookingTasks((prev) => prev.filter((t) => t.id !== confirmDeleteTask.id));
        setConfirmDeleteTask(null);
        setTaskSuccessMessage("Đã xóa công việc thành công!");
        setTimeout(() => setTaskSuccessMessage(null), 3000);
      }
    } catch {
      setTaskActionError("Đã xảy ra lỗi khi xóa công việc");
    } finally {
      setIsDeletingTask(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết booking ${booking.code || ""}`}
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-[#111218] h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-white/[0.08] animate-in slide-in-from-right duration-200 cursor-default"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50 font-mono tabular-nums">
                {booking.code || "BK-TEMP"}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${currentStatusMeta.badgeBg} ${currentStatusMeta.text} ${currentStatusMeta.border}`}
              >
                {currentStatusMeta.label}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              KOL:{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">
                @{booking.kol?.username}
              </strong>{" "}
              • Tạo ngày <span className="font-mono tabular-nums">{formatDate(booking.created_at)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenEdit(booking)}
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
            >
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Workflow Advance Stepper */}
        <div className="px-6 py-3 bg-zinc-50/80 dark:bg-[#161821] border-b border-zinc-200 dark:border-white/[0.08]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Chuyển bước quy trình
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {booking.status === "contacted" && (
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(booking.id, "confirmed")}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium shadow-2xs cursor-pointer transition"
                >
                  &rarr; Chốt deal thành công
                </button>
              )}
              {booking.status === "confirmed" && (
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(booking.id, "sample_sent")}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-2xs cursor-pointer transition"
                >
                  &rarr; Đã gửi mẫu
                </button>
              )}
              {booking.status === "sample_sent" && (
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(booking.id, "sample_delivered")}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-2xs cursor-pointer transition"
                >
                  &rarr; Đã nhận mẫu
                </button>
              )}
              {booking.status === "sample_delivered" && (
                <>
                  <button
                    type="button"
                    onClick={() => onAdvanceStatus(booking.id, "posted")}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-2xs cursor-pointer transition"
                  >
                    &rarr; Đăng video ngay
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdvanceStatus(booking.id, "draft_submitted")}
                    className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-medium shadow-2xs cursor-pointer transition"
                  >
                    &rarr; Duyệt nháp trước
                  </button>
                </>
              )}
              {booking.status === "draft_submitted" && (
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(booking.id, "posted")}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-2xs cursor-pointer transition"
                >
                  &rarr; Duyệt & Đã lên video
                </button>
              )}
              {booking.status === "posted" && (
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(booking.id, "completed")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-2xs cursor-pointer transition"
                >
                  ✓ Hoàn tất nghiệm thu
                </button>
              )}
              {booking.status === "completed" && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ Đã hoàn tất hợp tác
                </span>
              )}
              {booking.status === "cancelled" && (
                <button
                  type="button"
                  onClick={() => onAdvanceStatus(booking.id, "contacted")}
                  className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium cursor-pointer transition"
                >
                  Mở lại booking
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-white/[0.08] px-6 overflow-x-auto">
          {[
            { id: "overview", label: "Tổng quan & Chi phí" },
            { id: "shipping", label: "Vận chuyển & Vận đơn" },
            { id: "deadlines", label: "Mốc thời gian" },
            { id: "videos", label: `Videos (${bookingVideos.length})` },
            { id: "tasks", label: `Công việc (${bookingTasks.length})` },
            { id: "history", label: "Lịch sử trạng thái" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDetailTab(tab.id as typeof detailTab)}
              className={`px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                detailTab === tab.id
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ================================================================
              TAB 1: OVERVIEW
             ================================================================ */}
          {detailTab === "overview" && (
            <div className="space-y-4">
              {/* KOL Card */}
              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Thông tin KOL Hợp tác
                </span>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {booking.kol?.display_name || booking.kol?.username}
                    </h4>
                    <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <PlatformIcon platform={booking.kol?.platform || "tiktok"} size="xs" />
                      <span>@{booking.kol?.username}</span>
                      <span>•</span>
                      <span className="font-mono tabular-nums">
                        {booking.kol?.followers_count?.toLocaleString() || 0} followers
                      </span>
                    </div>
                  </div>
                  {booking.kol?.channel_url && (
                    <a
                      href={booking.kol.channel_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 transition"
                    >
                      Kênh KOL ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Product & Campaign Card */}
              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Sản phẩm & Chiến dịch
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 block">Sản phẩm mẫu:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                      {booking.product?.name || "Chưa chọn sản phẩm"}
                    </span>
                    {booking.product?.brand && (
                      <span className="text-[11px] text-zinc-500">
                        Brand: {booking.product.brand}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Chiến dịch:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                      {booking.campaign?.name || "Ngoài chiến dịch"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Định dạng nội dung:</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
                      {booking.content_type || "Review sản phẩm"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Commercial Terms */}
              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Chi phí & Thanh toán
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1.5 ${paymentCfg.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${paymentCfg.dot}`} />
                    {paymentCfg.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.06]">
                    <span className="text-zinc-400 block text-[11px]">Chi phí Booking</span>
                    <span className="font-mono tabular-nums font-bold text-sm text-zinc-900 dark:text-zinc-50 block mt-0.5">
                      {formatVND(Number(booking.booking_fee) || 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.06]">
                    <span className="text-zinc-400 block text-[11px]">Đã thanh toán</span>
                    <span className="font-mono tabular-nums font-bold text-sm text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {formatVND(Number(booking.paid_amount) || 0)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.06]">
                    <span className="text-zinc-400 block text-[11px]">% Hoa hồng</span>
                    <span className="font-mono tabular-nums font-bold text-sm text-zinc-900 dark:text-zinc-100 block mt-0.5">
                      {booking.commission_rate || 0}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.06]">
                    <span className="text-zinc-400 block text-[11px]">% Ngân sách Ads</span>
                    <span className="font-mono tabular-nums font-bold text-sm text-zinc-900 dark:text-zinc-100 block mt-0.5">
                      {booking.ads_rate || 0}%
                    </span>
                  </div>
                </div>
                {Number(booking.booking_fee) > Number(booking.paid_amount) && (
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-medium font-mono tabular-nums">
                    Còn phải thanh toán:{" "}
                    {formatVND(Number(booking.booking_fee) - Number(booking.paid_amount))}
                  </div>
                )}
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
                    Ghi chú
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {booking.notes}
                  </p>
                </div>
              )}

              {/* Video & Ads Code Quick Preview in Overview */}
              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Video & Mã Ads
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60">
                      {bookingVideos.length} video
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailTab("videos");
                        handleOpenAddVideo();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      + Thêm video
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <button
                      type="button"
                      onClick={() => setDetailTab("videos")}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Xem tất cả &rarr;
                    </button>
                  </div>
                </div>

                {bookingVideos.length === 0 ? (
                  <div className="p-3 rounded-lg bg-white dark:bg-[#111218] border border-dashed border-zinc-300 dark:border-white/[0.1] text-xs text-zinc-500 flex items-center justify-between">
                    <span>Chưa có video hoặc mã Ads nào.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDetailTab("videos");
                        handleOpenAddVideo();
                      }}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                    >
                      + Thêm ngay
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookingVideos.slice(0, 2).map((vid, idx) => (
                      <div
                        key={vid.id}
                        className="p-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between text-xs gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {vid.title || `Video #${idx + 1}`}
                          </div>
                          {vid.video_url && (
                            <a
                              href={vid.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                            >
                              {vid.video_url} ↗
                            </a>
                          )}
                        </div>
                        {vid.ads_code && (
                          <button
                            type="button"
                            onClick={() => handleCopyAdsCode(vid.ads_code!, vid.id)}
                            className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition cursor-pointer"
                            title="Sao chép Ads Code"
                          >
                            {copiedAdsCodeId === vid.id ? "✓ Đã chép" : "Chép mã Ads"}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 2: SHIPPING
             ================================================================ */}
          {detailTab === "shipping" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Theo dõi bưu kiện & Vận đơn
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 block">Hãng vận chuyển:</span>
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 block mt-0.5">
                      {booking.sample_carrier || "Chưa chọn"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Mã vận đơn:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono tabular-nums font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {booking.sample_tracking_code || "Chưa có"}
                      </span>
                      {booking.sample_tracking_code && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(booking.sample_tracking_code || "");
                            setCopiedTracking(true);
                            setTimeout(() => setCopiedTracking(false), 2000);
                          }}
                          className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                        >
                          {copiedTracking ? "✓ Đã chép" : "Sao chép"}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Ngày gửi hàng:</span>
                    <span className="font-mono tabular-nums font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                      {formatDate(booking.sample_sent_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Ngày dự kiến nhận:</span>
                    <span className="font-mono tabular-nums font-medium text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                      {formatDate(booking.sample_expected_at)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Ngày KOL nhận thực tế:</span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {formatDate(booking.sample_delivered_at)}
                    </span>
                  </div>
                  {trackingUrl && (
                    <div className="flex items-end">
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition inline-block"
                      >
                        Tra cứu bưu cục ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Thông tin người nhận mẫu
                </span>
                <div className="text-xs space-y-2">
                  <p>
                    <span className="text-zinc-400">Họ tên:</span>{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {booking.recipient_name || "—"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Số điện thoại:</span>{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono tabular-nums">
                      {booking.recipient_phone || "—"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Địa chỉ giao:</span>{" "}
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {booking.recipient_address || "—"}
                    </span>
                  </p>
                  {booking.sample_product_notes && (
                    <p>
                      <span className="text-zinc-400">Ghi chú mẫu gửi kèm:</span>{" "}
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {booking.sample_product_notes}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: DEADLINES
             ================================================================ */}
          {detailTab === "deadlines" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                  Mốc thời gian & Hạn chót
                </span>

                <div className="p-3.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      Hạn chót đăng video
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Deadline cam kết KOL lên video chính thức
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
                    {formatDate(booking.expected_post_at)}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                      Mốc nhắc nhở kiểm tra
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Mốc thời gian chủ động nhắn tin giục tiến độ KOL
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {formatDate(booking.video_reminder_at)}
                  </span>
                </div>

                {booking.video_reminder_at && (
                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={handleCreateVideoReminderTask}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-semibold transition cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Tạo công việc nhắc đăng video</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 4: VIDEOS & SPARK ADS CODE
             ================================================================ */}
          {detailTab === "videos" && (
            <div className="space-y-4">
              {/* Tab Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-white/[0.08]">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Danh sách Video & Spark Ads Code
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Quản lý link video công khai, link Air file gốc, mã ủy quyền quảng cáo và chỉ số.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddVideo}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-2xs cursor-pointer shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm video mới
                </button>
              </div>

              {/* Feedback Messages */}
              {videoSuccessMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs flex items-center justify-between">
                  <span>✓ {videoSuccessMessage}</span>
                  <button
                    type="button"
                    onClick={() => setVideoSuccessMessage(null)}
                    className="text-xs underline ml-2 cursor-pointer font-medium"
                  >
                    Đóng
                  </button>
                </div>
              )}

              {videoActionError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs flex items-center justify-between">
                  <span>✕ {videoActionError}</span>
                  <button
                    type="button"
                    onClick={() => setVideoActionError(null)}
                    className="text-xs underline ml-2 cursor-pointer font-medium"
                  >
                    Đóng
                  </button>
                </div>
              )}

              {loadingVideos ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] animate-pulse space-y-3"
                    >
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                      <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-full" />
                    </div>
                  ))}
                </div>
              ) : bookingVideos.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-dashed border-zinc-300 dark:border-white/[0.1] space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Chưa có video nào được liên kết
                    </h5>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Thêm link video, link Air hoặc mã Spark Ads để lưu trữ và theo dõi hiệu quả.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddVideo}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer"
                  >
                    + Thêm video đầu tiên
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {bookingVideos.map((v, index) => {
                    const expStatus = getAdsCodeStatus(v.ads_code_expires_at);
                    return (
                      <div
                        key={v.id}
                        className="p-4 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-3"
                      >
                        {/* Header & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {v.title || `Video #${index + 1}`}
                            </h5>
                            <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5 flex-wrap">
                              <span>
                                Ngày đăng:{" "}
                                <strong className="font-mono tabular-nums text-zinc-700 dark:text-zinc-300">
                                  {formatDate(v.posted_at)}
                                </strong>
                              </span>
                              {v.video_id && (
                                <span className="font-mono text-zinc-400">ID: {v.video_id}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditVideo(v)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-white/[0.06] transition cursor-pointer"
                            >
                              Chỉnh sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteVideo(v)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {/* Performance Metrics Row */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/70 dark:border-white/[0.06] flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">Views</span>
                            <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
                              {(v.views_count ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/70 dark:border-white/[0.06] flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">Likes</span>
                            <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
                              {(v.likes_count ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/70 dark:border-white/[0.06] flex items-center justify-between">
                            <span className="text-[11px] text-zinc-400">Comments</span>
                            <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
                              {(v.comments_count ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Links Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div className="p-2.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/70 dark:border-white/[0.06]">
                            <span className="text-[11px] font-medium text-zinc-400 block mb-1">
                              Link Video chính thức:
                            </span>
                            {v.video_url ? (
                              <a
                                href={v.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 truncate"
                                title={v.video_url}
                              >
                                <span className="truncate">{v.video_url}</span>
                                <span className="shrink-0">↗</span>
                              </a>
                            ) : (
                              <span className="text-zinc-400 italic">Chưa có link video</span>
                            )}
                          </div>

                          <div className="p-2.5 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/70 dark:border-white/[0.06]">
                            <span className="text-[11px] font-medium text-zinc-400 block mb-1">
                              Link Air (File gốc):
                            </span>
                            {v.air_url ? (
                              <a
                                href={v.air_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 truncate"
                                title={v.air_url}
                              >
                                <span className="truncate">{v.air_url}</span>
                                <span className="shrink-0">↗</span>
                              </a>
                            ) : (
                              <span className="text-zinc-400 italic">Chưa có link Air</span>
                            )}
                          </div>
                        </div>

                        {/* Spark Ads Code Box */}
                        <div className="p-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400">
                              Spark Ads Code
                            </span>
                            {expStatus && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums font-medium border ${expStatus.className}`}
                              >
                                {expStatus.label}
                              </span>
                            )}
                          </div>

                          {v.ads_code ? (
                            <div className="flex items-center justify-between gap-2 bg-zinc-50 dark:bg-[#161821] px-3 py-1.5 rounded-md border border-zinc-200/80 dark:border-white/[0.06]">
                              <code className="font-mono text-xs text-zinc-800 dark:text-zinc-200 truncate select-all">
                                {v.ads_code}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopyAdsCode(v.ads_code!, v.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition cursor-pointer shrink-0"
                              >
                                {copiedAdsCodeId === v.id ? "✓ Đã chép" : "Sao chép"}
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-zinc-400 italic">
                              Chưa có Ads Code cho video này.
                            </div>
                          )}
                        </div>

                        {/* Notes if any */}
                        {v.notes && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#111218] p-2.5 rounded-lg border border-zinc-200/60 dark:border-white/[0.06] whitespace-pre-line">
                            <strong className="text-zinc-700 dark:text-zinc-300">Ghi chú:</strong>{" "}
                            {v.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              TAB 5: TASKS
             ================================================================ */}
          {detailTab === "tasks" && (
            <div className="space-y-4">
              {/* Tab Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-white/[0.08]">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Danh sách Công việc & Deadline ({bookingTasks.length})
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Theo dõi các đầu việc cần xử lý cho hợp tác này.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddTask}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-2xs cursor-pointer shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tạo công việc
                </button>
              </div>

              {/* Feedback Messages */}
              {taskSuccessMessage && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs flex items-center justify-between">
                  <span>✓ {taskSuccessMessage}</span>
                  <button
                    type="button"
                    onClick={() => setTaskSuccessMessage(null)}
                    className="text-xs underline ml-2 cursor-pointer font-medium"
                  >
                    Đóng
                  </button>
                </div>
              )}

              {taskActionError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs flex items-center justify-between">
                  <span>✕ {taskActionError}</span>
                  <button
                    type="button"
                    onClick={() => setTaskActionError(null)}
                    className="text-xs underline ml-2 cursor-pointer font-medium"
                  >
                    Đóng
                  </button>
                </div>
              )}

              {loadingTasks ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-2 animate-pulse"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 w-48 bg-zinc-200/80 dark:bg-white/[0.08] rounded" />
                          <div className="flex items-center gap-1.5">
                            <div className="h-4 w-20 bg-zinc-200/60 dark:bg-white/[0.06] rounded-md" />
                            <div className="h-4 w-16 bg-amber-200/50 dark:bg-amber-500/20 rounded-md" />
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="h-7 w-7 rounded-lg bg-zinc-200/60 dark:bg-white/[0.06]" />
                          <div className="h-7 w-7 rounded-lg bg-zinc-200/60 dark:bg-white/[0.06]" />
                        </div>
                      </div>
                      <div className="h-3 w-36 bg-zinc-200/60 dark:bg-white/[0.05] rounded" />
                    </div>
                  ))}
                </div>
              ) : bookingTasks.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-dashed border-zinc-300 dark:border-white/[0.1] space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Chưa có công việc nào
                    </h5>
                    <p className="text-xs text-zinc-500 mt-0.5 max-w-sm mx-auto">
                      Tạo công việc để theo dõi các mốc gửi sample, duyệt draft, thanh toán hoặc nhắc đăng video.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleOpenAddTask}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer"
                    >
                      + Tạo công việc
                    </button>
                    {booking.video_reminder_at && (
                      <button
                        type="button"
                        onClick={handleCreateVideoReminderTask}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 text-xs font-medium hover:bg-amber-100 transition cursor-pointer"
                      >
                        + Nhắc đăng video
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookingTasks.map((t) => {
                    const overdue = isTaskOverdue(t);
                    return (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <p
                              className={`font-semibold ${
                                t.status === "completed"
                                  ? "line-through text-zinc-400"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {t.title}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                                {TASK_TYPE_LABELS[t.type] || t.type}
                              </span>
                              {t.status === "completed" ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800/60">
                                  Đã hoàn thành
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800/60">
                                  Chờ xử lý
                                </span>
                              )}
                              {overdue && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900/60">
                                  Quá hạn
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {t.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => handleCompleteTaskAction(t)}
                                title="Đánh dấu hoàn thành"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditTask(t)}
                              title="Chỉnh sửa công việc"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-white/[0.06] transition cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteTask(t)}
                              title="Xóa công việc"
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                          <span>Hạn chót:</span>
                          <span className="font-mono tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
                            {formatDateTime(t.due_at)}
                          </span>
                        </div>

                        {t.notes && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#111218] p-2.5 rounded-lg border border-zinc-200/60 dark:border-white/[0.06] whitespace-pre-line">
                            <strong className="text-zinc-700 dark:text-zinc-300">Ghi chú:</strong>{" "}
                            {t.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              TAB 6: HISTORY
             ================================================================ */}
          {detailTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Lịch sử chuyển trạng thái ({auditHistory.length})
                </span>
                <button
                  type="button"
                  onClick={() => loadHistory(booking.id)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Làm mới
                </button>
              </div>

              {loadingHistory ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] space-y-1.5 animate-pulse"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="h-3.5 w-40 bg-zinc-200/80 dark:bg-white/[0.08] rounded" />
                        <div className="h-3 w-24 bg-zinc-200/60 dark:bg-white/[0.05] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : auditHistory.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8 bg-zinc-50/80 dark:bg-[#161821] rounded-xl border border-zinc-200 dark:border-white/[0.08]">
                  Chưa có lịch sử thay đổi trạng thái nào được ghi lại.
                </p>
              ) : (
                <div className="space-y-3">
                  {auditHistory.map((h) => (
                    <div
                      key={h.id}
                      className="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-[#161821] border border-zinc-200 dark:border-white/[0.08] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {h.from_status
                            ? `${STATUS_META[h.from_status]?.label || h.from_status} → `
                            : "Khởi tạo → "}
                          <span className={STATUS_META[h.to_status]?.text || ""}>
                            {STATUS_META[h.to_status]?.label || h.to_status}
                          </span>
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                          {formatDateTime(h.created_at)}
                        </span>
                      </div>
                      {h.profiles?.full_name && (
                        <span className="text-[11px] text-zinc-500 block">
                          Thực hiện bởi: {h.profiles.full_name}
                        </span>
                      )}
                      {h.note && (
                        <p className="text-zinc-600 dark:text-zinc-300 italic pt-1">
                          &ldquo;{h.note}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          MODAL 1: CREATE / EDIT VIDEO MODAL
         ==================================================================== */}
      {isVideoModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingVideo ? "Chỉnh sửa Video & Ads Code" : "Thêm Video mới"}
          onClick={(e) => {
            e.stopPropagation();
            setIsVideoModalOpen(false);
            setEditingVideo(null);
          }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#161821] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden animate-in zoom-in-95 duration-150 cursor-default"
          >
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {editingVideo ? "Chỉnh sửa Video & Ads Code" : "Thêm Video mới"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsVideoModalOpen(false);
                  setEditingVideo(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleVideoSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {videoFormError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs">
                  {videoFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tiêu đề / Nội dung Video
                </label>
                <input
                  type="text"
                  value={videoFormData.title || ""}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  placeholder="Ví dụ: Video review unboxing, clip biến hình..."
                  className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Link Video chính thức (TikTok, YouTube, Facebook...)
                </label>
                <input
                  type="url"
                  value={videoFormData.video_url || ""}
                  onChange={(e) => setVideoFormData({ ...videoFormData, video_url: e.target.value })}
                  placeholder="https://www.tiktok.com/@kol/video/..."
                  className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Link Air / File gốc (Google Drive, CapCut, Dropbox...)
                </label>
                <input
                  type="url"
                  value={videoFormData.air_url || ""}
                  onChange={(e) => setVideoFormData({ ...videoFormData, air_url: e.target.value })}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Spark Ads Code
                  </label>
                  <input
                    type="text"
                    value={videoFormData.ads_code || ""}
                    onChange={(e) => setVideoFormData({ ...videoFormData, ads_code: e.target.value })}
                    placeholder="Mã ủy quyền quảng cáo..."
                    className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Thời hạn mã Ads
                  </label>
                  <input
                    type="date"
                    value={videoFormData.ads_code_expires_at || ""}
                    onChange={(e) =>
                      setVideoFormData({ ...videoFormData, ads_code_expires_at: e.target.value })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ngày đăng video thực tế
                  </label>
                  <input
                    type="date"
                    value={videoFormData.posted_at || ""}
                    onChange={(e) => setVideoFormData({ ...videoFormData, posted_at: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mã Video ID (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={videoFormData.video_id || ""}
                    onChange={(e) => setVideoFormData({ ...videoFormData, video_id: e.target.value })}
                    placeholder="VD: 739182739182..."
                    className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Lượt xem (Views)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={videoFormData.views_count ?? 0}
                    onChange={(e) =>
                      setVideoFormData({ ...videoFormData, views_count: Number(e.target.value) })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Lượt thích (Likes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={videoFormData.likes_count ?? 0}
                    onChange={(e) =>
                      setVideoFormData({ ...videoFormData, likes_count: Number(e.target.value) })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Bình luận
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={videoFormData.comments_count ?? 0}
                    onChange={(e) =>
                      setVideoFormData({ ...videoFormData, comments_count: Number(e.target.value) })
                    }
                    className="w-full h-9 px-3 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs font-mono tabular-nums text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ghi chú nội bộ về video
                </label>
                <textarea
                  rows={2}
                  value={videoFormData.notes || ""}
                  onChange={(e) => setVideoFormData({ ...videoFormData, notes: e.target.value })}
                  placeholder="Lưu ý về bản quyền, phong cách video, yêu cầu sửa đổi..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsVideoModalOpen(false);
                    setEditingVideo(null);
                  }}
                  className="h-9 px-4 rounded-lg text-xs font-medium border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVideo}
                  className="h-9 px-4 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingVideo
                    ? "Đang lưu..."
                    : editingVideo
                    ? "Lưu thay đổi"
                    : "Tạo video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: DELETE VIDEO CONFIRMATION MODAL
         ==================================================================== */}
      {confirmDeleteVideo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xóa video"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDeleteVideo(null);
          }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#161821] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/[0.08] p-6 space-y-4 animate-in zoom-in-95 duration-150 cursor-default"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Xác nhận xóa video?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Bạn có chắc muốn xóa video{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">
                {confirmDeleteVideo.title || confirmDeleteVideo.video_url || "này"}
              </strong>{" "}
              khỏi booking? Thao tác này không thể hoàn tác.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteVideo(null)}
                className="h-9 px-4 rounded-lg text-xs font-medium border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteVideoConfirm}
                disabled={isDeletingVideo}
                className="h-9 px-4 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50 cursor-pointer"
              >
                {isDeletingVideo ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 3: TASK CREATE / EDIT MODAL FOR BOOKING
         ==================================================================== */}
      {isTaskModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingTask ? "Chỉnh sửa công việc" : "Tạo công việc cho hợp tác"}
          onClick={(e) => {
            e.stopPropagation();
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-[#161821] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/[0.08] overflow-hidden animate-in zoom-in-95 duration-150 cursor-default"
          >
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {editingTask ? "Chỉnh sửa công việc" : "Tạo công việc cho hợp tác"}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Gắn với hợp tác:{" "}
                  <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    {booking.code || "Booking"}
                  </span>
                  {booking.kol ? ` (@${booking.kol.username})` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setEditingTask(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTaskForm} className="p-6 space-y-4">
              {taskFormError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs">
                  {taskFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tên công việc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                  placeholder="Ví dụ: Giục KOL gửi video nháp..."
                  className="w-full h-9 px-3 rounded-lg text-xs bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Loại công việc
                </label>
                <CustomSelect
                  value={taskFormData.type}
                  onChange={(val) => setTaskFormData({ ...taskFormData, type: val as TaskType })}
                  options={[
                    { value: "sample_delivery_check", label: "Kiểm tra gửi sample" },
                    { value: "draft_review", label: "Giục gửi & Duyệt draft" },
                    { value: "video_reminder", label: "Nhắc đăng video" },
                    { value: "get_air_link", label: "Lấy link Air" },
                    { value: "get_ads_code", label: "Xin mã Ads Code" },
                    { value: "payment", label: "Thanh toán" },
                    { value: "general", label: "Công việc khác" },
                  ]}
                  placeholder="Chọn loại công việc..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ngày deadline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={taskFormData.due_date}
                    onChange={(e) => setTaskFormData({ ...taskFormData, due_date: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs font-mono bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Giờ
                  </label>
                  <input
                    type="time"
                    value={taskFormData.due_time}
                    onChange={(e) => setTaskFormData({ ...taskFormData, due_time: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg text-xs font-mono bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={taskFormData.notes}
                  onChange={(e) => setTaskFormData({ ...taskFormData, notes: e.target.value })}
                  placeholder="Chi tiết nhắc nhở hoặc yêu cầu đặc biệt..."
                  className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-[#111218] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-white/[0.08] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsTaskModalOpen(false);
                    setEditingTask(null);
                  }}
                  className="h-9 px-4 rounded-lg text-xs font-medium border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask}
                  className="h-9 px-4 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingTask
                    ? "Đang lưu..."
                    : editingTask
                    ? "Lưu thay đổi"
                    : "Tạo công việc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 4: TASK DELETE CONFIRMATION MODAL
         ==================================================================== */}
      {confirmDeleteTask && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Xác nhận xóa công việc"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDeleteTask(null);
          }}
          className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#161821] rounded-2xl shadow-2xl border border-zinc-200 dark:border-white/[0.08] p-6 space-y-4 animate-in zoom-in-95 duration-150 cursor-default"
          >
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Xác nhận xóa công việc?
              </h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Bạn có chắc muốn xóa công việc này khỏi booking?
              </p>
              <div className="mt-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-[#111218] border border-zinc-200/70 dark:border-white/[0.06] text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {confirmDeleteTask.title}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTask(null)}
                className="h-9 px-4 rounded-lg text-xs font-medium border border-zinc-200 dark:border-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/[0.05] transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={handleDeleteTaskConfirm}
                className="h-9 px-4 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition disabled:opacity-50 cursor-pointer"
              >
                {isDeletingTask ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
