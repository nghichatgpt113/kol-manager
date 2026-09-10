"use client";

import { useState, useRef, useEffect } from "react";
import { formatVND } from "../types";

interface InlineFeeCellProps {
  bookingId: string;
  bookingFee: number;
  commissionRate: number;
  adsRate: number;
  onUpdate: (data: { booking_fee?: number; commission_rate?: number }) => Promise<void> | void;
}

export default function InlineFeeCell({
  bookingFee,
  commissionRate,
  onUpdate,
}: InlineFeeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempFee, setTempFee] = useState<string>(String(bookingFee));
  const [tempCommission, setTempCommission] = useState<string>(String(commissionRate));
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempFee(String(bookingFee));
    setTempCommission(String(commissionRate));
  }, [bookingFee, commissionRate]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    const newFee = Math.max(0, Number(tempFee) || 0);
    const newComm = Math.min(100, Math.max(0, Number(tempCommission) || 0));

    if (newFee === bookingFee && newComm === commissionRate) {
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdate({
        booking_fee: newFee,
        commission_rate: newComm,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setTempFee(String(bookingFee));
      setTempCommission(String(commissionRate));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div
        className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 max-w-[210px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 min-w-0">
          <input
            ref={inputRef}
            type="number"
            min={0}
            step={50000}
            value={tempFee}
            onChange={(e) => setTempFee(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Phí booking"
            className="w-full text-xs font-mono font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none"
          />
          {tempFee && Number(tempFee) > 0 && (
            <span className="text-[10px] text-zinc-400 font-mono block px-1 truncate">
              {formatVND(Number(tempFee))}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          title="Lưu (Enter)"
          className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            setTempFee(String(bookingFee));
            setIsEditing(false);
          }}
          title="Hủy (Esc)"
          className="p-1 rounded-md text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 shrink-0 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div
      className="group/fee inline-flex items-center gap-1.5 text-left cursor-pointer"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div>
        <div className="flex items-center gap-1">
          <span
            className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-50 group-hover/fee:underline"
            title="Nhấp đúp hoặc bấm bút để sửa chi phí"
          >
            {formatVND(bookingFee)}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Sửa chi phí"
            className="opacity-0 group-hover/fee:opacity-100 p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity cursor-pointer"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        {commissionRate > 0 && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">
            Hoa hồng: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{commissionRate}%</strong>
          </span>
        )}
      </div>

      {isUpdating && (
        <svg className="w-3 h-3 animate-spin text-zinc-400 ml-1" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
    </div>
  );
}
