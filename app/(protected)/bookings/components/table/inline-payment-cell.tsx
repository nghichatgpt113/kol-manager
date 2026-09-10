"use client";

import { useState, useRef, useEffect } from "react";
import type { PaymentStatus } from "@/lib/types/booking";
import { formatVND } from "../types";

interface InlinePaymentCellProps {
  bookingId: string;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  bookingFee: number;
  onUpdate: (data: { payment_status: PaymentStatus; paid_amount: number }) => Promise<void> | void;
}

export default function InlinePaymentCell({
  paymentStatus,
  paidAmount,
  bookingFee,
  onUpdate,
}: InlinePaymentCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStatus, setTempStatus] = useState<PaymentStatus>(paymentStatus);
  const [tempAmount, setTempAmount] = useState<string>(paidAmount > 0 ? String(paidAmount) : "");
  const [isUpdating, setIsUpdating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempStatus(paymentStatus);
    setTempAmount(paidAmount > 0 ? String(paidAmount) : "");
  }, [paymentStatus, paidAmount]);

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

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = Math.max(0, Number(tempAmount) || 0);
    let finalStatus = tempStatus;

    if (num >= bookingFee && bookingFee > 0) {
      finalStatus = "paid";
    } else if (num > 0) {
      finalStatus = "partially_paid";
    } else if (tempStatus === "paid" && num === 0) {
      finalStatus = "paid";
    }

    setIsOpen(false);
    setIsUpdating(true);
    try {
      await onUpdate({
        payment_status: finalStatus,
        paid_amount: num,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const remaining = Math.max(0, bookingFee - paidAmount);

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
        title="Nhấp để cập nhật thanh toán"
        className="group text-left cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center gap-1.5">
          {paymentStatus === "paid" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Đã TT đủ
            </span>
          )}
          {paymentStatus === "partially_paid" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Đã cọc {formatVND(paidAmount)}
            </span>
          )}
          {paymentStatus === "unpaid" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Chưa thanh toán
            </span>
          )}

          {isUpdating && (
            <svg className="w-3 h-3 animate-spin text-zinc-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>

        {paymentStatus !== "paid" && remaining > 0 && (
          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">
            Còn thiếu: <span className="text-rose-600 dark:text-rose-400 font-semibold">{formatVND(remaining)}</span>
          </div>
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 z-50 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Cập nhật thanh toán
            </span>
            <span className="text-[11px] text-zinc-400 font-mono">
              Phí: {formatVND(bookingFee)}
            </span>
          </div>

          {/* Quick status radio pills */}
          <div className="grid grid-cols-3 gap-1 p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => {
                setTempStatus("unpaid");
                setTempAmount("0");
              }}
              className={`py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                tempStatus === "unpaid"
                  ? "bg-rose-500 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
              }`}
            >
              Chưa TT
            </button>
            <button
              type="button"
              onClick={() => {
                setTempStatus("partially_paid");
                if (!tempAmount || tempAmount === "0") {
                  setTempAmount(String(Math.round(bookingFee * 0.5)));
                }
              }}
              className={`py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                tempStatus === "partially_paid"
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
              }`}
            >
              1 phần
            </button>
            <button
              type="button"
              onClick={() => {
                setTempStatus("paid");
                setTempAmount(String(bookingFee));
              }}
              className={`py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                tempStatus === "paid"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900"
              }`}
            >
              Đã đủ (100%)
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Số tiền đã thanh toán (VND):
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={bookingFee * 2}
                step={10000}
                value={tempAmount}
                onChange={(e) => {
                  setTempAmount(e.target.value);
                  const val = Number(e.target.value) || 0;
                  if (val === 0) setTempStatus("unpaid");
                  else if (val >= bookingFee && bookingFee > 0) setTempStatus("paid");
                  else setTempStatus("partially_paid");
                }}
                placeholder="Nhập số tiền..."
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-400">
                đ
              </span>
            </div>
            {tempAmount && Number(tempAmount) > 0 && (
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-right font-mono">
                {formatVND(Number(tempAmount))}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-2xs cursor-pointer"
            >
              Lưu ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
