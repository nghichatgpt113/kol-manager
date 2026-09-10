"use client";

import { useState, useRef, useEffect } from "react";
import type { BookingStatus } from "@/lib/types/booking";

interface InlineStatusCellProps {
  bookingId: string;
  status: BookingStatus;
  onUpdate: (newStatus: BookingStatus) => Promise<void> | void;
}

export const STATUS_META: Record<
  BookingStatus,
  {
    label: string;
    description: string;
    dot: string;
    badgeBg: string;
    text: string;
    border: string;
  }
> = {
  contacted: {
    label: "Đang liên hệ",
    description: "Đã nhắn tin mời, đang chờ phản hồi hoặc chốt giá",
    dot: "bg-amber-500",
    badgeBg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  confirmed: {
    label: "Đã chốt deal",
    description: "Đã thống nhất giá, mẫu và điều khoản hợp tác",
    dot: "bg-sky-500",
    badgeBg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/60",
  },
  sample_sent: {
    label: "Đã gửi mẫu",
    description: "Đã gửi hàng mẫu, có mã bưu cục theo dõi",
    dot: "bg-indigo-500",
    badgeBg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800/60",
  },
  sample_delivered: {
    label: "Đã nhận mẫu",
    description: "KOL đã nhận sản phẩm, bắt đầu làm video",
    dot: "bg-purple-500",
    badgeBg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/60",
  },
  draft_submitted: {
    label: "Duyệt nháp",
    description: "KOL gửi video nháp kiểm tra trước khi đăng",
    dot: "bg-fuchsia-500",
    badgeBg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    border: "border-fuchsia-200 dark:border-fuchsia-800/60",
  },
  posted: {
    label: "Đã lên video",
    description: "Video đã đăng tải công khai trên kênh của KOL",
    dot: "bg-blue-500",
    badgeBg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/60",
  },
  completed: {
    label: "Hoàn tất",
    description: "Nghiệm thu thành công và thanh toán xong",
    dot: "bg-emerald-500",
    badgeBg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  cancelled: {
    label: "Hủy hợp tác",
    description: "KOL từ chối, bùng kèo hoặc hủy hợp tác",
    dot: "bg-zinc-400",
    badgeBg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-200 dark:border-zinc-700",
  },
};

const STAGES_ORDER: BookingStatus[] = [
  "contacted",
  "confirmed",
  "sample_sent",
  "sample_delivered",
  "draft_submitted",
  "posted",
  "completed",
  "cancelled",
];

export default function InlineStatusCell({
  status,
  onUpdate,
}: InlineStatusCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentConfig = STATUS_META[status] || STATUS_META.contacted;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = async (newStatus: BookingStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    setIsUpdating(true);
    try {
      await onUpdate(newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={isUpdating}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Nhấp để đổi trạng thái tức thì"
        className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] ${currentConfig.badgeBg} ${currentConfig.text} ${currentConfig.border}`}
      >
        {isUpdating ? (
          <svg
            className="w-2.5 h-2.5 animate-spin text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <span className={`w-1.5 h-1.5 rounded-full ${currentConfig.dot}`} />
        )}
        <span className="truncate max-w-[100px]">{currentConfig.label}</span>
        <svg
          className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity ml-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 z-50 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Chuyển trạng thái booking
          </div>
          {STAGES_ORDER.map((stage) => {
            const meta = STATUS_META[stage];
            const isSelected = stage === status;
            return (
              <button
                key={stage}
                type="button"
                onClick={(e) => handleSelect(stage, e)}
                className={`w-full text-left flex items-start gap-2.5 p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-zinc-100 dark:bg-zinc-800 font-semibold"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mt-1 shrink-0 ${meta.dot}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {meta.label}
                    </span>
                    {isSelected && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        ✓ Hiện tại
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                    {meta.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
