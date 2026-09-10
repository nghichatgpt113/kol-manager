"use client";

import { useState, useRef, useEffect } from "react";
import { CARRIERS, getCarrierTrackingUrl } from "../types";
import CustomSelect from "@/components/ui/custom-select";

interface InlineTrackingCellProps {
  bookingId: string;
  carrier?: string | null;
  trackingCode?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientAddress?: string | null;
  onUpdate: (data: {
    sample_carrier?: string | null;
    sample_tracking_code?: string | null;
  }) => Promise<void> | void;
}

export default function InlineTrackingCell({
  carrier,
  trackingCode,
  recipientName,
  recipientPhone,
  recipientAddress,
  onUpdate,
}: InlineTrackingCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempCarrier, setTempCarrier] = useState(carrier || "GHTK");
  const [tempCode, setTempCode] = useState(trackingCode || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempCarrier(carrier || "GHTK");
    setTempCode(trackingCode || "");
  }, [carrier, trackingCode]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    setIsEditing(false);
    if (tempCarrier === carrier && tempCode.trim() === (trackingCode || "").trim()) {
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdate({
        sample_carrier: tempCarrier || null,
        sample_tracking_code: tempCode.trim() || null,
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
      setTempCarrier(carrier || "GHTK");
      setTempCode(trackingCode || "");
      setIsEditing(false);
    }
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!trackingCode) return;
    navigator.clipboard.writeText(trackingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyFullShipping = (e: React.MouseEvent) => {
    e.stopPropagation();
    const parts = [recipientName, recipientPhone, recipientAddress].filter(Boolean);
    if (parts.length === 0) return;
    navigator.clipboard.writeText(parts.join(" - "));
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const trackingUrl = getCarrierTrackingUrl(carrier, trackingCode);

  if (isEditing) {
    return (
      <div
        className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 max-w-[240px]"
        onClick={(e) => e.stopPropagation()}
      >
        <CustomSelect
          size="xs"
          options={CARRIERS}
          value={tempCarrier}
          onChange={setTempCarrier}
          className="w-24 shrink-0"
        />
        <input
          ref={inputRef}
          type="text"
          value={tempCode}
          onChange={(e) => setTempCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập mã đơn..."
          className="w-full text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-zinc-900 dark:text-zinc-100 focus:outline-none min-w-0"
        />
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
            setTempCarrier(carrier || "GHTK");
            setTempCode(trackingCode || "");
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

  if (!trackingCode && !carrier) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-0.5 px-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-dashed border-zinc-200 dark:border-zinc-700"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm vận đơn
        </button>
        {recipientAddress && (
          <button
            type="button"
            onClick={handleCopyFullShipping}
            title={`Copy thông tin gửi: ${recipientName} - ${recipientPhone} - ${recipientAddress}`}
            className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded cursor-pointer"
          >
            {copiedAddress ? (
              <span className="text-[10px] text-emerald-600 font-bold">✓ Đã chép</span>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="group/track inline-flex items-center gap-1.5 text-xs text-left"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase shrink-0">
            {carrier || "Vận đơn"}
          </span>

          {trackingCode ? (
            <span
              onClick={() => setIsEditing(true)}
              className="font-mono text-xs text-zinc-900 dark:text-zinc-100 font-medium hover:underline cursor-pointer truncate max-w-[100px]"
              title="Nhấp đúp hoặc bấm để sửa mã vận đơn"
            >
              {trackingCode}
            </span>
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              className="text-[11px] text-zinc-400 hover:underline cursor-pointer italic"
            >
              Chưa nhập mã
            </span>
          )}

          {/* Quick action buttons on hover */}
          <div className="opacity-0 group-hover/track:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                title="Mở link tra cứu bưu cục trực tiếp"
                className="p-1 rounded text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            {trackingCode && (
              <button
                type="button"
                onClick={handleCopyCode}
                title="Sao chép mã vận đơn"
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                {copiedCode ? (
                  <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title="Chỉnh sửa mã vận đơn"
              className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Copy full shipping format for shipper app */}
        {recipientAddress && (
          <button
            type="button"
            onClick={handleCopyFullShipping}
            className="text-[10px] text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-left truncate max-w-[170px] mt-0.5 flex items-center gap-1 cursor-pointer"
            title={`Copy thông tin gửi: ${recipientName} - ${recipientPhone} - ${recipientAddress}`}
          >
            <span>📋</span>
            <span className="truncate">
              {copiedAddress ? "✓ Đã copy địa chỉ shipper!" : `${recipientName || "Người nhận"} - ${recipientPhone || ""}`}
            </span>
          </button>
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
