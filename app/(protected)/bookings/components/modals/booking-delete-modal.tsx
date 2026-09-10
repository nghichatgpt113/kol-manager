"use client";

import type { Booking } from "@/lib/types/booking";

interface BookingDeleteModalProps {
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (booking: Booking) => Promise<void>;
  isDeleting: boolean;
}

export default function BookingDeleteModal({
  booking,
  onClose,
  onConfirm,
  isDeleting,
}: BookingDeleteModalProps) {
  if (!booking) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 animate-in zoom-in-95 duration-150 cursor-default"
      >
        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            Xác nhận xóa Booking?
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
            Bạn có chắc muốn xóa hợp đồng booking mã{" "}
            <strong className="text-zinc-800 dark:text-zinc-200 font-mono">
              {booking.code || "BK-TEMP"}
            </strong>{" "}
            với KOL{" "}
            <strong className="text-zinc-800 dark:text-zinc-200">
              {booking.kol?.display_name || booking.kol?.username || "này"}
            </strong>
            ? Hành động này sẽ xóa các video và công việc liên quan và không thể hoàn tác.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onConfirm(booking)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isDeleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
          </button>
        </div>
      </div>
    </div>
  );
}
