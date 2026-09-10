"use client";

import { useState, useEffect } from "react";
import type { Booking, BookingStatus, BookingStatusHistory } from "@/lib/types/booking";
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

interface BookingDetailDrawerProps {
  booking: Booking | null;
  onClose: () => void;
  onOpenEdit: (booking: Booking) => void;
  onAdvanceStatus: (bookingId: string, nextStatus: BookingStatus) => void;
}

export default function BookingDetailDrawer({
  booking,
  onClose,
  onOpenEdit,
  onAdvanceStatus,
}: BookingDetailDrawerProps) {
  const [detailTab, setDetailTab] = useState<
    "overview" | "shipping" | "deadlines" | "videos" | "tasks" | "history"
  >("overview");

  // History state
  const [auditHistory, setAuditHistory] = useState<BookingStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Videos state
  const [bookingVideos, setBookingVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
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
    notes: "",
  });
  const [videoFormError, setVideoFormError] = useState<string | null>(null);
  const [copiedAdsCodeId, setCopiedAdsCodeId] = useState<string | null>(null);

  // Tasks state
  const [bookingTasks, setBookingTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
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

  // Load resources when tab changes or booking changes
  useEffect(() => {
    if (!booking) return;
    setDetailTab("overview");
    setBookingVideos(booking.videos || []);
  }, [booking]);

  const loadHistory = async (bookingId: string) => {
    setLoadingHistory(true);
    try {
      const res = await getBookingStatusHistory(bookingId);
      if (res.data) setAuditHistory(res.data);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadVideos = async (bookingId: string) => {
    setLoadingVideos(true);
    try {
      const res = await getVideosByBookingId(bookingId);
      if (res.data) setBookingVideos(res.data);
    } finally {
      setLoadingVideos(false);
    }
  };

  const loadTasks = async (bookingId: string) => {
    setLoadingTasks(true);
    try {
      const res = await getTasksByBookingId(bookingId);
      if (res.data) setBookingTasks(res.data);
    } finally {
      setLoadingTasks(false);
    }
  };

  if (!booking) return null;

  const currentStatusMeta = STATUS_META[booking.status] || STATUS_META.contacted;
  const trackingUrl = getCarrierTrackingUrl(booking.sample_carrier, booking.sample_tracking_code);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200 cursor-default"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 font-mono">
                {booking.code || "BK-TEMP"}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStatusMeta.badgeBg} ${currentStatusMeta.text} ${currentStatusMeta.border}`}
              >
                {currentStatusMeta.label}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              KOL:{" "}
              <strong className="text-zinc-700 dark:text-zinc-300">
                @{booking.kol?.username}
              </strong>{" "}
              • Tạo ngày {formatDate(booking.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEdit(booking)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Chỉnh sửa
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Workflow Advance Stepper */}
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Chuyển bước quy trình
            </span>
            <div className="flex items-center gap-2">
              {booking.status === "contacted" && (
                <button
                  onClick={() => onAdvanceStatus(booking.id, "confirmed")}
                  className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  &rarr; Chốt deal thành công
                </button>
              )}
              {booking.status === "confirmed" && (
                <button
                  onClick={() => onAdvanceStatus(booking.id, "sample_sent")}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  &rarr; Đã gửi mẫu
                </button>
              )}
              {booking.status === "sample_sent" && (
                <button
                  onClick={() => onAdvanceStatus(booking.id, "sample_delivered")}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  &rarr; Đã nhận mẫu
                </button>
              )}
              {booking.status === "sample_delivered" && (
                <>
                  <button
                    onClick={() => onAdvanceStatus(booking.id, "posted")}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    🚀 Đăng video ngay
                  </button>
                  <button
                    onClick={() => onAdvanceStatus(booking.id, "draft_submitted")}
                    className="px-3 py-1 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    📝 Duyệt nháp trước
                  </button>
                </>
              )}
              {booking.status === "draft_submitted" && (
                <button
                  onClick={() => onAdvanceStatus(booking.id, "posted")}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  &rarr; Duyệt & Đã lên video
                </button>
              )}
              {booking.status === "posted" && (
                <button
                  onClick={() => onAdvanceStatus(booking.id, "completed")}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
                >
                  ✓ Hoàn tất nghiệm thu
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 overflow-x-auto">
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
              onClick={() => {
                setDetailTab(tab.id as typeof detailTab);
                if (tab.id === "history") loadHistory(booking.id);
                if (tab.id === "videos") loadVideos(booking.id);
                if (tab.id === "tasks") loadTasks(booking.id);
              }}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                detailTab === tab.id
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {detailTab === "overview" && (
            <div className="space-y-5">
              {/* KOL Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Thông tin KOL Hợp tác
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {booking.kol?.display_name || booking.kol?.username}
                    </h4>
                    <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                      <PlatformIcon platform={booking.kol?.platform || "tiktok"} size="xs" />
                      <span>@{booking.kol?.username}</span>
                      <span>•</span>
                      <span>{booking.kol?.followers_count?.toLocaleString()} followers</span>
                    </div>
                  </div>
                  {booking.kol?.channel_url && (
                    <a
                      href={booking.kol.channel_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      Kênh KOL ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Product & Campaign Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Sản phẩm & Chiến dịch
                </span>
                <div className="grid grid-cols-2 gap-4 text-xs">
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
                </div>
              </div>

              {/* Commercial Terms */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Chi phí & Thanh toán
                </span>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400 block">Chi phí Booking:</span>
                    <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-50 block mt-0.5">
                      {formatVND(Number(booking.booking_fee) || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Đã thanh toán:</span>
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 block mt-0.5">
                      {formatVND(Number(booking.paid_amount) || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block">Hoa hồng:</span>
                    <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 block mt-0.5">
                      {booking.commission_rate || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                    Ghi chú
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {booking.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SHIPPING */}
          {detailTab === "shipping" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                  Theo dõi bưu kiện & Vận đơn
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-zinc-400">Hãng vận chuyển:</span>
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block mt-0.5">
                      {booking.sample_carrier || "Chưa chọn"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400">Mã vận đơn:</span>
                    <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 block mt-0.5">
                      {booking.sample_tracking_code || "Chưa có"}
                    </span>
                  </div>
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                    >
                      Tra cứu bưu cục ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                  Thông tin người nhận mẫu
                </span>
                <div className="text-xs space-y-1.5">
                  <p>
                    <span className="text-zinc-400">Họ tên:</span>{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200">
                      {booking.recipient_name || "—"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Số điện thoại:</span>{" "}
                    <strong className="text-zinc-800 dark:text-zinc-200 font-mono">
                      {booking.recipient_phone || "—"}
                    </strong>
                  </p>
                  <p>
                    <span className="text-zinc-400">Địa chỉ giao:</span>{" "}
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {booking.recipient_address || "—"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEADLINES */}
          {detailTab === "deadlines" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                  Hạn chót đăng video
                </span>
                <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 block">
                  {formatDate(booking.expected_post_at)}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
                  Mốc nhắc nhở kiểm tra
                </span>
                <span className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 block">
                  {formatDate(booking.video_reminder_at)}
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: VIDEOS */}
          {detailTab === "videos" && (
            <div className="space-y-4">
              {loadingVideos ? (
                <p className="text-xs text-zinc-400">Đang tải danh sách video...</p>
              ) : bookingVideos.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <span className="text-2xl mb-1 block">🎬</span>
                  <p className="text-xs">Chưa có video nào được liên kết với booking này.</p>
                </div>
              ) : (
                bookingVideos.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {v.title || "Video không tên"}
                      </h5>
                      {v.video_url && (
                        <a
                          href={v.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Xem video ↗
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                      <span>Views: {v.views_count?.toLocaleString()}</span>
                      <span>Likes: {v.likes_count?.toLocaleString()}</span>
                      <span>Comments: {v.comments_count?.toLocaleString()}</span>
                    </div>
                    {v.ads_code && (
                      <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                        <span className="text-[11px] text-zinc-400">Mã Ads:</span>
                        <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700">
                          {v.ads_code}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(v.ads_code || "");
                            setCopiedAdsCodeId(v.id);
                            setTimeout(() => setCopiedAdsCodeId(null), 2000);
                          }}
                          className="text-[11px] text-indigo-600 font-semibold cursor-pointer"
                        >
                          {copiedAdsCodeId === v.id ? "✓ Đã chép" : "Copy mã"}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: TASKS */}
          {detailTab === "tasks" && (
            <div className="space-y-3">
              {loadingTasks ? (
                <p className="text-xs text-zinc-400">Đang tải công việc...</p>
              ) : bookingTasks.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <span className="text-2xl mb-1 block">✅</span>
                  <p className="text-xs">Chưa có task công việc nào.</p>
                </div>
              ) : (
                bookingTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p
                        className={`font-semibold ${
                          t.status === "completed"
                            ? "line-through text-zinc-400"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {t.title}
                      </p>
                      <span className="text-[11px] text-zinc-400">
                        Hạn: {formatDateTime(t.due_at)}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.status === "completed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {t.status === "completed" ? "Đã xong" : "Đang chờ"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: HISTORY */}
          {detailTab === "history" && (
            <div className="space-y-3">
              {loadingHistory ? (
                <p className="text-xs text-zinc-400">Đang tải lịch sử...</p>
              ) : auditHistory.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">
                  Chưa có lịch sử thay đổi trạng thái nào được ghi lại.
                </p>
              ) : (
                auditHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        Chuyển sang: {STATUS_META[h.to_status]?.label || h.to_status}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {formatDateTime(h.created_at)}
                      </span>
                    </div>
                    {h.from_status && (
                      <span className="text-[11px] text-zinc-400 block">
                        Từ: {STATUS_META[h.from_status]?.label || h.from_status}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
