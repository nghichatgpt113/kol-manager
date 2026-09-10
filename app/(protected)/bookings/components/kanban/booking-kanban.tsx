"use client";

import { useState } from "react";
import type { Booking, BookingStatus, PaymentStatus } from "@/lib/types/booking";
import { formatVND, formatDate } from "../types";
import PlatformIcon from "@/components/icons/platform-icon";

interface BookingKanbanProps {
  bookings: Booking[];
  onOpenDetail: (booking: Booking) => void;
  onAdvanceStatus: (bookingId: string, nextStatus: BookingStatus) => void;
  onStatusDrop: (bookingId: string, targetStatus: BookingStatus) => void;
}

const KANBAN_STAGES: BookingStatus[] = [
  "contacted",
  "confirmed",
  "sample_sent",
  "sample_delivered",
  "draft_submitted",
  "posted",
  "completed",
  "cancelled",
];

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; dot: string }
> = {
  contacted: { label: "Đang liên hệ", dot: "bg-amber-500" },
  confirmed: { label: "Đã chốt deal", dot: "bg-sky-500" },
  sample_sent: { label: "Đã gửi mẫu", dot: "bg-indigo-500" },
  sample_delivered: { label: "Đã nhận mẫu", dot: "bg-purple-500" },
  draft_submitted: { label: "Duyệt nháp", dot: "bg-fuchsia-500" },
  posted: { label: "Đã lên video", dot: "bg-blue-500" },
  completed: { label: "Hoàn tất", dot: "bg-emerald-500" },
  cancelled: { label: "Hủy hợp tác", dot: "bg-zinc-400" },
};

const PAYMENT_CONFIG: Record<
  PaymentStatus,
  { label: string; shortLabel: string; bg: string; dot: string }
> = {
  unpaid: {
    label: "Chưa thanh toán",
    shortLabel: "Chưa TT",
    bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-500",
  },
  partially_paid: {
    label: "Thanh toán 1 phần",
    shortLabel: "1 phần",
    bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  paid: {
    label: "Đã thanh toán đủ",
    shortLabel: "Đã TT",
    bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
};

function getDeadlineStatus(expectedPostAt: string | null) {
  if (!expectedPostAt) {
    return { isOverdue: false, isUrgent: false, badgeClass: "", label: null };
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(expectedPostAt);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      isOverdue: true,
      isUrgent: false,
      badgeClass: "text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 font-semibold",
      label: `Trễ ${Math.abs(diffDays)} ngày`,
    };
  }
  if (diffDays <= 2) {
    const label = diffDays === 0 ? "Hôm nay" : diffDays === 1 ? "Ngày mai" : "Còn 2 ngày";
    return {
      isOverdue: false,
      isUrgent: true,
      badgeClass: "text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 font-semibold",
      label,
    };
  }
  return {
    isOverdue: false,
    isUrgent: false,
    badgeClass: "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80",
    label: null,
  };
}

export default function BookingKanban({
  bookings,
  onOpenDetail,
  onAdvanceStatus,
  onStatusDrop,
}: BookingKanbanProps) {
  const [draggingBookingId, setDraggingBookingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<BookingStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingBookingId(id);
  };

  const handleDragEnd = () => {
    setDraggingBookingId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageKey: BookingStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageKey) {
      setDragOverStage(stageKey);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageKey: BookingStatus) => {
    e.preventDefault();
    if (dragOverStage === stageKey) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: BookingStatus) => {
    e.preventDefault();
    const droppedId = e.dataTransfer.getData("text/plain") || draggingBookingId;
    setDragOverStage(null);
    setDraggingBookingId(null);
    if (!droppedId) return;
    onStatusDrop(droppedId, targetStage);
  };

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[2360px]">
        {KANBAN_STAGES.map((stageKey) => {
          const stageConfig = STATUS_CONFIG[stageKey];
          const stageBookings = bookings.filter((b) => b.status === stageKey);
          const stageTotalAmount = stageBookings.reduce(
            (sum, b) => sum + (Number(b.booking_fee) || 0),
            0
          );
          const isDragOver = dragOverStage === stageKey;

          return (
            <div
              key={stageKey}
              onDragOver={(e) => handleDragOver(e, stageKey)}
              onDragLeave={(e) => handleDragLeave(e, stageKey)}
              onDrop={(e) => handleDrop(e, stageKey)}
              className={`w-[280px] shrink-0 flex flex-col rounded-2xl p-3 transition-all duration-200 ${
                isDragOver
                  ? "bg-indigo-50/80 dark:bg-indigo-950/30 border-2 border-dashed border-indigo-500 scale-[1.01]"
                  : "bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stageConfig.dot}`} />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {stageConfig.label}
                  </span>
                  {stageKey === "draft_submitted" && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300 font-semibold shrink-0">
                      Tùy chọn
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 ml-1">
                  {stageBookings.length}
                </span>
              </div>

              {/* Column Total Value */}
              {stageTotalAmount > 0 && (
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium pb-2 flex items-center justify-between">
                  <span>Tổng giá trị:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatVND(stageTotalAmount)}
                  </span>
                </div>
              )}

              {/* Cards List / Empty Dropzone */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {stageBookings.length === 0 ? (
                  <div
                    className={`h-32 flex flex-col items-center justify-center rounded-xl border border-dashed text-center p-3 transition-colors ${
                      isDragOver
                        ? "border-indigo-400 bg-indigo-100/40 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-medium"
                        : "border-zinc-300/80 dark:border-zinc-700/80 text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    <span className="text-base mb-1">{isDragOver ? "📥" : "📋"}</span>
                    <p className="text-[11px] font-medium">
                      {isDragOver ? "Thả vào đây" : "Kéo thẻ vào đây"}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {isDragOver ? `Chuyển sang ${stageConfig.label}` : "hoặc tạo booking mới"}
                    </p>
                  </div>
                ) : (
                  stageBookings.map((b) => {
                    const deadline = getDeadlineStatus(b.expected_post_at);
                    const isDraggingThis = draggingBookingId === b.id;
                    const paymentCfg = PAYMENT_CONFIG[b.payment_status] || PAYMENT_CONFIG.unpaid;
                    const remainingPayment = Math.max(
                      0,
                      (Number(b.booking_fee) || 0) - (Number(b.paid_amount) || 0)
                    );

                    return (
                      <div
                        key={b.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, b.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onOpenDetail(b)}
                        className={`p-3 rounded-xl bg-white dark:bg-zinc-900 border transition shadow-xs hover:shadow cursor-grab active:cursor-grabbing space-y-2.5 group relative overflow-hidden ${
                          isDraggingThis
                            ? "opacity-40 border-indigo-400 scale-95"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                        }`}
                      >
                        {/* Header: Code & Payment Status */}
                        <div className="flex items-center justify-between gap-1.5 min-w-0">
                          <span className="whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                            {b.code || "BK-TEMP"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1.5 shrink-0 ${paymentCfg.bg}`}
                            title={paymentCfg.label}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${paymentCfg.dot}`} />
                            <span>{paymentCfg.shortLabel || paymentCfg.label}</span>
                          </span>
                        </div>

                        {/* KOL Info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xs shrink-0">
                            {b.kol?.username?.charAt(0).toUpperCase() || "K"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {b.kol?.display_name || b.kol?.username || "Chưa gán KOL"}
                            </p>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                              {b.kol?.platform && <PlatformIcon platform={b.kol.platform} size="xs" />}
                              <span className="truncate">@{b.kol?.username || "unknown"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Product & Campaign */}
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 min-w-0 text-xs">
                          <p className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                            {b.product?.name || "Chưa chọn sản phẩm"}
                          </p>
                          {b.campaign && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-600 dark:text-zinc-400 truncate max-w-full">
                              {b.campaign.name}
                            </span>
                          )}
                        </div>

                        {/* Financials & Deadline */}
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-medium">
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                              {formatVND(Number(b.booking_fee) || 0)}
                            </span>
                            {remainingPayment > 0 && (
                              <p className="text-[10px] text-rose-500 font-mono">
                                Thiếu {formatVND(remainingPayment)}
                              </p>
                            )}
                          </div>
                          {b.expected_post_at && (
                            <div className="text-right">
                              <span className="text-[11px] text-zinc-400 font-mono block">
                                {formatDate(b.expected_post_at)}
                              </span>
                              {deadline.label && (
                                <span
                                  className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] ${deadline.badgeClass}`}
                                >
                                  {deadline.label}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Quick Branching Advance Buttons */}
                        <div
                          className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {stageKey === "contacted" && (
                            <button
                              onClick={() => onAdvanceStatus(b.id, "confirmed")}
                              className="w-full py-1 px-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 text-[11px] font-semibold transition cursor-pointer"
                            >
                              Chốt deal &rarr;
                            </button>
                          )}
                          {stageKey === "confirmed" && (
                            <button
                              onClick={() => onAdvanceStatus(b.id, "sample_sent")}
                              className="w-full py-1 px-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 text-[11px] font-semibold transition cursor-pointer"
                            >
                              Đã gửi mẫu &rarr;
                            </button>
                          )}
                          {stageKey === "sample_sent" && (
                            <button
                              onClick={() => onAdvanceStatus(b.id, "sample_delivered")}
                              className="w-full py-1 px-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 text-[11px] font-semibold transition cursor-pointer"
                            >
                              Đã nhận mẫu &rarr;
                            </button>
                          )}
                          {stageKey === "sample_delivered" && (
                            <div className="w-full flex flex-col gap-1">
                              <button
                                onClick={() => onAdvanceStatus(b.id, "posted")}
                                className="w-full py-1 px-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-semibold transition text-left flex items-center justify-between cursor-pointer"
                              >
                                <span>🚀 Đăng video ngay</span>
                                <span>&rarr;</span>
                              </button>
                              <button
                                onClick={() => onAdvanceStatus(b.id, "draft_submitted")}
                                className="w-full py-1 px-2 rounded-lg bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 text-[10px] font-semibold transition text-left flex items-center justify-between cursor-pointer"
                              >
                                <span>📝 Duyệt nháp trước</span>
                                <span>&rarr;</span>
                              </button>
                            </div>
                          )}
                          {stageKey === "draft_submitted" && (
                            <button
                              onClick={() => onAdvanceStatus(b.id, "posted")}
                              className="w-full py-1 px-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 text-[11px] font-semibold transition cursor-pointer"
                            >
                              Duyệt & Đã lên video &rarr;
                            </button>
                          )}
                          {stageKey === "posted" && (
                            <button
                              onClick={() => onAdvanceStatus(b.id, "completed")}
                              className="w-full py-1 px-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-semibold transition cursor-pointer"
                            >
                              Hoàn tất nghiệm thu &rarr;
                            </button>
                          )}
                          {stageKey === "completed" && (
                            <span className="w-full text-center py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              ✓ Đã hoàn tất
                            </span>
                          )}
                          {stageKey === "cancelled" && (
                            <button
                              onClick={() => onAdvanceStatus(b.id, "contacted")}
                              className="w-full py-1 px-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 text-[11px] font-semibold transition cursor-pointer"
                            >
                              Mở lại booking
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
