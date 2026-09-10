"use client";

import { useState, useMemo } from "react";
import type { Kol } from "@/lib/types/kol";
import type { Product } from "@/lib/types/product";
import type { Campaign } from "@/lib/types/campaign";
import type { BookingStatus, CreateBookingInput } from "@/lib/types/booking";
import type { ColumnId } from "../types";
import { formatVND } from "../types";
import CustomSelect, { type SelectOption } from "@/components/ui/custom-select";
import DatePicker from "@/components/ui/date-picker";
import SearchableKolSelect from "./searchable-kol-select";
import { STATUS_META } from "./inline-status-cell";

interface QuickAddRowProps {
  kols: Kol[];
  products: Product[];
  campaigns: Campaign[];
  visibleColumns?: ColumnId[];
  onCancel: () => void;
  onCreate: (input: CreateBookingInput) => Promise<boolean>;
}

const CONTENT_TYPES: SelectOption[] = [
  { value: "Review sản phẩm", label: "Review sản phẩm 🎬" },
  { value: "Tài trợ video", label: "Tài trợ video 🎁" },
  { value: "Livestream", label: "Livestream 📡" },
  { value: "Story / Reels", label: "Story / Reels 📸" },
];

const STAGES: BookingStatus[] = [
  "contacted",
  "confirmed",
  "sample_sent",
  "sample_delivered",
  "draft_submitted",
  "posted",
  "completed",
  "cancelled",
];

export default function QuickAddRow({
  kols,
  products,
  campaigns,
  visibleColumns = [
    "code",
    "kol",
    "product",
    "status",
    "logistics",
    "deadline",
    "fee",
    "payment",
    "recipient",
    "actions",
  ],
  onCancel,
  onCreate,
}: QuickAddRowProps) {
  const [kolId, setKolId] = useState(kols[0]?.id || "");
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id || "");
  const [fee, setFee] = useState<string>("0");
  const [status, setStatus] = useState<BookingStatus>("contacted");
  const [deadline, setDeadline] = useState("");
  const [contentType, setContentType] = useState("Review sản phẩm");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedKol = useMemo(() => kols.find((k) => k.id === kolId), [kols, kolId]);
  const selectedProduct = useMemo(() => products.find((p) => p.id === productId), [products, productId]);

  // Options for unified CustomSelect
  const productOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "(Chưa chọn SP)" },
      ...products.map((p) => ({
        value: p.id,
        label: p.name,
        subLabel: p.brand || undefined,
      })),
    ],
    [products]
  );

  const campaignOptions: SelectOption[] = useMemo(
    () => [
      { value: "", label: "(Không gán chiến dịch)" },
      ...campaigns.map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ],
    [campaigns]
  );

  const statusOptions: SelectOption[] = useMemo(
    () =>
      STAGES.map((st) => ({
        value: st,
        label: STATUS_META[st].label,
        dot: STATUS_META[st].dot,
      })),
    []
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!kolId) {
      setError("Vui lòng chọn KOL");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const success = await onCreate({
        kol_id: kolId,
        product_id: productId || null,
        campaign_id: campaignId || null,
        content_type: contentType,
        booking_fee: Math.max(0, Number(fee) || 0),
        commission_rate: selectedProduct?.default_commission_rate || 0,
        ads_rate: selectedProduct?.default_ads_rate || 0,
        status,
        expected_post_at: deadline || null,
        recipient_name: selectedKol?.display_name || selectedKol?.username || null,
        recipient_phone: selectedKol?.contact_phone || null,
        recipient_address: selectedKol?.address || null,
        notes: note.trim() || null,
      });
      if (success) {
        setFee("0");
        setDeadline("");
        setNote("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" && target.getAttribute("type") !== "search") {
        e.preventDefault();
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <tr
      className="bg-indigo-50/70 dark:bg-indigo-950/30 border-y-2 border-indigo-500/50 animate-in fade-in duration-150 transition-colors"
      onKeyDown={handleKeyDown}
    >
      {/* 1. Checkbox column indicator */}
      <td className="py-3 px-3 text-center align-middle">
        <span
          title="Hàng nhập liệu nhanh (Nhấn Enter để tạo, Esc để đóng)"
          className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-xs cursor-default"
        >
          ⚡
        </span>
      </td>

      {/* 2. Code & Content Type (CustomSelect) */}
      {visibleColumns.includes("code") && (
        <td className="py-2.5 px-3 align-middle whitespace-nowrap min-w-[150px]">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block mb-1">
            Mới (Auto)
          </span>
          <CustomSelect
            size="sm"
            options={CONTENT_TYPES}
            value={contentType}
            onChange={setContentType}
          />
        </td>
      )}

      {/* 3. KOL Searchable Selection */}
      {visibleColumns.includes("kol") && (
        <td className="py-2.5 px-3 align-middle min-w-[220px]">
          <SearchableKolSelect
            kols={kols}
            value={kolId}
            onChange={setKolId}
            placeholder="Tìm & chọn KOL..."
          />
          {selectedKol?.contact_phone && (
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-1 block truncate">
              📞 {selectedKol.contact_phone}
            </span>
          )}
        </td>
      )}

      {/* 4. Product & Campaign (CustomSelect with search) */}
      {visibleColumns.includes("product") && (
        <td className="py-2.5 px-3 align-middle min-w-[200px]">
          <CustomSelect
            size="sm"
            searchable
            options={productOptions}
            value={productId}
            onChange={setProductId}
            placeholder="(Chưa chọn SP)"
          />
          <div className="mt-1.5">
            <CustomSelect
              size="sm"
              searchable
              options={campaignOptions}
              value={campaignId}
              onChange={setCampaignId}
              placeholder="(Không gán chiến dịch)"
            />
          </div>
        </td>
      )}

      {/* 5. Status (CustomSelect with colored dots) */}
      {visibleColumns.includes("status") && (
        <td className="py-2.5 px-3 align-middle min-w-[160px]">
          <CustomSelect
            size="sm"
            options={statusOptions}
            value={status}
            onChange={(val) => setStatus(val as BookingStatus)}
          />
        </td>
      )}

      {/* 6. Logistics */}
      {visibleColumns.includes("logistics") && (
        <td className="py-2.5 px-3 align-middle text-xs text-zinc-400 italic">
          (Cập nhật sau)
        </td>
      )}

      {/* 7. Deadline (DatePicker with Vietnamese calendar) */}
      {visibleColumns.includes("deadline") && (
        <td className="py-2.5 px-3 align-middle min-w-[140px]">
          <DatePicker
            size="sm"
            placeholder="Hạn lên bài"
            value={deadline}
            onChange={setDeadline}
          />
        </td>
      )}

      {/* 8. Fee & Commission */}
      {visibleColumns.includes("fee") && (
        <td className="py-2.5 px-3 align-middle w-[140px]">
          <div className="relative">
            <input
              type="number"
              min={0}
              step={50000}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0 đ"
              className="w-full text-xs font-mono font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
            />
          </div>
          {fee && Number(fee) > 0 ? (
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold block mt-0.5 truncate">
              {formatVND(Number(fee))}
            </span>
          ) : (
            <span className="text-[10px] text-zinc-400 block mt-0.5">0 đ (Miễn phí)</span>
          )}
        </td>
      )}

      {/* 9. Payment */}
      {visibleColumns.includes("payment") && (
        <td className="py-2.5 px-3 align-middle text-xs">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            Chưa thanh toán
          </span>
        </td>
      )}

      {/* 10. Recipient */}
      {visibleColumns.includes("recipient") && (
        <td className="py-2.5 px-3 align-middle text-xs max-w-[180px]">
          <span className="text-zinc-700 dark:text-zinc-300 truncate block font-medium">
            {selectedKol?.display_name || selectedKol?.username || "—"}
          </span>
          <span className="text-[10px] text-zinc-400 block truncate">
            {selectedKol?.address || "Lấy từ hồ sơ KOL"}
          </span>
        </td>
      )}

      {/* 11. Performance */}
      {visibleColumns.includes("performance") && (
        <td className="py-2.5 px-3 align-middle text-xs text-zinc-400 text-center">
          —
        </td>
      )}

      {/* 12. Notes */}
      {visibleColumns.includes("notes") && (
        <td className="py-2.5 px-3 align-middle min-w-[150px]">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú nhanh..."
            className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs"
          />
        </td>
      )}

      {/* 13. Actions */}
      {visibleColumns.includes("actions") && (
        <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
              title="Lưu dòng này (Enter)"
            >
              {isSubmitting ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>Tạo</span>
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title="Đóng nhập nhanh (Esc)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {error && (
            <span className="text-[10px] text-rose-600 block mt-1">{error}</span>
          )}
        </td>
      )}
    </tr>
  );
}
