"use client";

import { useState, useRef, useEffect } from "react";
import { formatDate } from "../types";
import DatePicker from "@/components/ui/date-picker";

interface InlineDateCellProps {
  bookingId: string;
  expectedPostAt?: string | null;
  onUpdate: (expectedPostAt: string | null) => Promise<void> | void;
}

function getDeadlineInfo(dateStr?: string | null) {
  if (!dateStr) {
    return {
      label: null,
      isOverdue: false,
      isUrgent: false,
      className: "text-zinc-400 dark:text-zinc-500",
    };
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Trễ ${Math.abs(diffDays)} ngày`,
      isOverdue: true,
      isUrgent: false,
      className: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 font-semibold",
    };
  }
  if (diffDays <= 2) {
    const label = diffDays === 0 ? "Hôm nay" : diffDays === 1 ? "Ngày mai" : "Còn 2 ngày";
    return {
      label,
      isOverdue: false,
      isUrgent: true,
      className: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 font-semibold",
    };
  }
  return {
    label: null,
    isOverdue: false,
    isUrgent: false,
    className: "text-zinc-700 dark:text-zinc-300",
  };
}

function addDaysToToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function InlineDateCell({
  expectedPostAt,
  onUpdate,
}: InlineDateCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(expectedPostAt ? expectedPostAt.slice(0, 10) : "");
  const [isUpdating, setIsUpdating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempDate(expectedPostAt ? expectedPostAt.slice(0, 10) : "");
  }, [expectedPostAt]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleApplyDate = async (dateVal: string | null) => {
    setIsOpen(false);
    if (dateVal === (expectedPostAt ? expectedPostAt.slice(0, 10) : null)) {
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdate(dateVal);
    } finally {
      setIsUpdating(false);
    }
  };

  const deadline = getDeadlineInfo(expectedPostAt);

  return (
    <div
      ref={containerRef}
      className="relative inline-block text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={isUpdating}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Nhấp để đổi ngày hẹn lên bài"
        className="group text-left cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex flex-col items-start gap-0.5">
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100 group-hover:underline">
              {formatDate(expectedPostAt)}
            </span>
            {isUpdating && (
              <svg className="w-3 h-3 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          {deadline.label && (
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] border shrink-0 ${deadline.className}`}
            >
              {deadline.label}
            </span>
          )}
        </div>
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 z-50 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Hạn lên video (Deadline)
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => handleApplyDate(addDaysToToday(0))}
              className="py-1 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium transition cursor-pointer text-left"
            >
              ⚡ Hôm nay
            </button>
            <button
              type="button"
              onClick={() => handleApplyDate(addDaysToToday(3))}
              className="py-1 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium transition cursor-pointer text-left"
            >
              +3 ngày nữa
            </button>
            <button
              type="button"
              onClick={() => handleApplyDate(addDaysToToday(7))}
              className="py-1 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium transition cursor-pointer text-left"
            >
              +1 tuần (7 ngày)
            </button>
            <button
              type="button"
              onClick={() => handleApplyDate(addDaysToToday(14))}
              className="py-1 px-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium transition cursor-pointer text-left"
            >
              +2 tuần (14 ngày)
            </button>
          </div>

          {/* Custom DatePicker */}
          <div className="space-y-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-[10px] font-medium text-zinc-400">
              Hoặc chọn ngày cụ thể:
            </label>
            <DatePicker
              size="sm"
              value={tempDate}
              onChange={(d) => handleApplyDate(d || null)}
              placeholder="Chọn ngày cụ thể..."
            />
          </div>

          {/* Remove date */}
          {expectedPostAt && (
            <button
              type="button"
              onClick={() => handleApplyDate(null)}
              className="w-full text-center py-1 text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
            >
              Xóa ngày hẹn
            </button>
          )}
        </div>
      )}
    </div>
  );
}
