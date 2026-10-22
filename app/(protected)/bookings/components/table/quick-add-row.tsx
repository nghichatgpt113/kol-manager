"use client";

import { useState, useMemo } from "react";
import type { Kol } from "@/lib/types/kol";
import type { Product } from "@/lib/types/product";
import type { Campaign } from "@/lib/types/campaign";
import type { BookingStatus, CreateBookingInput } from "@/lib/types/booking";
import type { ColumnId } from "../types";
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
  { value: "Review sản phẩm", label: "Review sản phẩm" },
  { value: "Tài trợ video", label: "Tài trợ video" },
  { value: "Livestream", label: "Livestream" },
  { value: "Story / Reels", label: "Story / Reels" },
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
      className="bg-indigo-50/50 dark:bg-indigo-950/20 border-y-2 border-indigo-500/40 animate-in fade-in duration-100 transition-colors"
      onKeyDown={handleKeyDown}
    >
      {/* 1. Checkbox column indicator */}
      <td className="py-1 px-2 text-center align-middle w-9">
        <span
          title="Hàng nhập liệu nhanh (Enter: Tạo, Esc: Đóng)"
          className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-bold shadow-2xs cursor-default"
        >
          +
        </span>
      </td>

      {/* 2. Code & Content Type */}
      {visibleColumns.includes("code") && (
        <td className="py-1 px-2 align-middle w-[110px] whitespace-nowrap">
          <CustomSelect
            size="sm"
            options={CONTENT_TYPES}
            value={contentType}
            onChange={setContentType}
          />
        </td>
      )}

      {/* 3. KOL Selection */}
      {visibleColumns.includes("kol") && (
        <td className="py-1 px-2 align-middle min-w-[140px]">
          <SearchableKolSelect
            kols={kols}
            value={kolId}
            onChange={setKolId}
            placeholder="Chọn KOL..."
          />
        </td>
      )}

      {/* 4. Product & Campaign */}
      {visibleColumns.includes("product") && (
        <td className="py-1 px-2 align-middle min-w-[150px]">
          <div className="grid grid-cols-2 gap-1 min-w-[200px]">
            <CustomSelect
              size="sm"
              searchable
              options={productOptions}
              value={productId}
              onChange={setProductId}
              placeholder="Sản phẩm..."
            />
            <CustomSelect
              size="sm"
              searchable
              options={campaignOptions}
              value={campaignId}
              onChange={setCampaignId}
              placeholder="Chiến dịch..."
            />
          </div>
        </td>
      )}

      {/* 5. Status */}
      {visibleColumns.includes("status") && (
        <td className="py-1 px-2 align-middle w-[120px]">
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
        <td className="py-1 px-2 align-middle text-[11px] text-zinc-400 italic">
          (Cập nhật sau)
        </td>
      )}

      {/* 7. Deadline */}
      {visibleColumns.includes("deadline") && (
        <td className="py-1 px-2 align-middle w-[105px]">
          <DatePicker
            size="sm"
            placeholder="Hạn bài"
            value={deadline}
            onChange={setDeadline}
          />
        </td>
      )}

      {/* 8. Fee */}
      {visibleColumns.includes("fee") && (
        <td className="py-1 px-2 align-middle w-[100px]">
          <input
            type="number"
            min={0}
            step={50000}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            placeholder="Phí (đ)"
            className="w-full h-8 text-xs font-mono bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] rounded-lg px-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
        </td>
      )}

      {/* 9. Payment */}
      {visibleColumns.includes("payment") && (
        <td className="py-1 px-2 align-middle w-[105px] text-xs whitespace-nowrap">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 border border-zinc-200/60 dark:border-white/[0.06]">
            Chưa trả
          </span>
        </td>
      )}

      {/* 10. Recipient */}
      {visibleColumns.includes("recipient") && (
        <td className="py-1 px-2 align-middle text-xs min-w-[130px] max-w-[160px]">
          <span className="text-zinc-700 dark:text-zinc-300 truncate block font-medium">
            {selectedKol?.display_name || selectedKol?.username || "—"}
          </span>
        </td>
      )}

      {/* 11. Performance */}
      {visibleColumns.includes("performance") && (
        <td className="py-1 px-2 align-middle text-xs text-zinc-400 text-center w-[85px]">
          —
        </td>
      )}

      {/* 12. Notes */}
      {visibleColumns.includes("notes") && (
        <td className="py-1 px-2 align-middle min-w-[110px]">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú..."
            className="w-full h-8 text-xs bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] rounded-lg px-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
          />
        </td>
      )}

      {/* 13. Actions */}
      {visibleColumns.includes("actions") && (
        <td className="py-1 px-2 align-middle w-[70px] text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit()}
              className="h-8 inline-flex items-center gap-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
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
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
              title="Đóng (Esc)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
