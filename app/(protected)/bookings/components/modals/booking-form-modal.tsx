"use client";

import { useState, useEffect } from "react";
import type { Booking, CreateBookingInput, PaymentStatus } from "@/lib/types/booking";
import type { Kol } from "@/lib/types/kol";
import type { Product } from "@/lib/types/product";
import type { Campaign } from "@/lib/types/campaign";
import CustomSelect from "@/components/ui/custom-select";
import DatePicker from "@/components/ui/date-picker";
import PlatformIcon from "@/components/icons/platform-icon";
import { CARRIERS } from "../types";

const CONTENT_TYPES = [
  "Review sản phẩm",
  "Video lồng ghép / Tài trợ",
  "Livestream",
  "Bài viết / Hình ảnh",
  "Story / Reels ngắn",
  "Khác",
];

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBooking: Booking | null;
  kols: Kol[];
  products: Product[];
  campaigns: Campaign[];
  onSubmit: (data: CreateBookingInput) => Promise<boolean>;
  isPending: boolean;
}

export default function BookingFormModal({
  isOpen,
  onClose,
  editingBooking,
  kols,
  products,
  campaigns,
  onSubmit,
  isPending,
}: BookingFormModalProps) {
  const [formData, setFormData] = useState<CreateBookingInput>({
    kol_id: "",
    product_id: "",
    campaign_id: "",
    code: "",
    content_type: "Review sản phẩm",
    booking_fee: 0,
    commission_rate: 0,
    ads_rate: 0,
    status: "contacted",
    sample_product_notes: "",
    sample_sent_at: "",
    sample_expected_at: "",
    sample_delivered_at: "",
    sample_tracking_code: "",
    sample_carrier: "GHTK",
    recipient_name: "",
    recipient_phone: "",
    recipient_address: "",
    video_reminder_at: "",
    expected_post_at: "",
    payment_status: "unpaid",
    paid_amount: 0,
    notes: "",
  });

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (editingBooking) {
      setFormData({
        kol_id: editingBooking.kol_id,
        product_id: editingBooking.product_id || "",
        campaign_id: editingBooking.campaign_id || "",
        code: editingBooking.code || "",
        content_type: editingBooking.content_type || "Review sản phẩm",
        booking_fee: Number(editingBooking.booking_fee) || 0,
        commission_rate: Number(editingBooking.commission_rate) || 0,
        ads_rate: Number(editingBooking.ads_rate) || 0,
        status: editingBooking.status,
        sample_product_notes: editingBooking.sample_product_notes || "",
        sample_sent_at: editingBooking.sample_sent_at ? editingBooking.sample_sent_at.slice(0, 10) : "",
        sample_expected_at: editingBooking.sample_expected_at || "",
        sample_delivered_at: editingBooking.sample_delivered_at ? editingBooking.sample_delivered_at.slice(0, 10) : "",
        sample_tracking_code: editingBooking.sample_tracking_code || "",
        sample_carrier: editingBooking.sample_carrier || "GHTK",
        recipient_name: editingBooking.recipient_name || "",
        recipient_phone: editingBooking.recipient_phone || "",
        recipient_address: editingBooking.recipient_address || "",
        video_reminder_at: editingBooking.video_reminder_at || "",
        expected_post_at: editingBooking.expected_post_at || "",
        payment_status: editingBooking.payment_status,
        paid_amount: Number(editingBooking.paid_amount) || 0,
        notes: editingBooking.notes || "",
      });
    } else {
      const firstKol = kols[0];
      const firstProduct = products[0];
      setFormData({
        kol_id: firstKol?.id || "",
        product_id: firstProduct?.id || "",
        campaign_id: campaigns[0]?.id || "",
        code: "",
        content_type: "Review sản phẩm",
        booking_fee: 0,
        commission_rate: firstProduct?.default_commission_rate || 0,
        ads_rate: firstProduct?.default_ads_rate || 0,
        status: "contacted",
        sample_product_notes: "",
        sample_sent_at: "",
        sample_expected_at: "",
        sample_delivered_at: "",
        sample_tracking_code: "",
        sample_carrier: "GHTK",
        recipient_name: firstKol?.display_name || firstKol?.username || "",
        recipient_phone: firstKol?.contact_phone || "",
        recipient_address: firstKol?.address || "",
        video_reminder_at: "",
        expected_post_at: "",
        payment_status: "unpaid",
        paid_amount: 0,
        notes: "",
      });
    }
    setFormError(null);
  }, [editingBooking, isOpen, kols, products, campaigns]);

  if (!isOpen) return null;

  const handleKolChange = (kolId: string) => {
    const selected = kols.find((k) => k.id === kolId);
    setFormData((prev) => ({
      ...prev,
      kol_id: kolId,
      recipient_name: prev.recipient_name || selected?.display_name || selected?.username || "",
      recipient_phone: prev.recipient_phone || selected?.contact_phone || "",
      recipient_address: prev.recipient_address || selected?.address || "",
    }));
  };

  const handleProductChange = (productId: string) => {
    const selected = products.find((p) => p.id === productId);
    setFormData((prev) => ({
      ...prev,
      product_id: productId,
      commission_rate: selected?.default_commission_rate ?? prev.commission_rate,
      ads_rate: selected?.default_ads_rate ?? prev.ads_rate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kol_id) {
      setFormError("Vui lòng chọn KOL hợp tác.");
      return;
    }
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-150 cursor-default"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {editingBooking ? "Chỉnh sửa Booking" : "Tạo Booking Hợp tác mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs">
              {formError}
            </div>
          )}

          {/* 1. Entity Connections: KOL, Product, Campaign */}
          <div className="space-y-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
              1. Thực thể liên kết (KOL, Sản phẩm, Chiến dịch)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* KOL Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  KOL / KOC <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={formData.kol_id}
                  onChange={(val) => handleKolChange(val)}
                  placeholder="-- Chọn KOL hợp tác --"
                  options={kols.map((k) => ({
                    value: k.id,
                    label: `${k.display_name || k.username} (@${k.username})`,
                    subLabel: `Nền tảng: ${k.platform} • ${k.followers_count.toLocaleString()} followers`,
                    icon: <PlatformIcon platform={k.platform} size="sm" />,
                  }))}
                />
              </div>

              {/* Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Sản phẩm mẫu
                </label>
                <CustomSelect
                  value={formData.product_id || ""}
                  onChange={(val) => handleProductChange(val)}
                  placeholder="-- Không gán sản phẩm --"
                  options={[
                    { value: "", label: "-- Không gán sản phẩm --" },
                    ...products.map((p) => ({
                      value: p.id,
                      label: p.name,
                      subLabel: p.brand ? `Thương hiệu: ${p.brand}` : undefined,
                    })),
                  ]}
                />
              </div>

              {/* Campaign Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Chiến dịch
                </label>
                <CustomSelect
                  value={formData.campaign_id || ""}
                  onChange={(val) => setFormData({ ...formData, campaign_id: val })}
                  placeholder="-- Không thuộc chiến dịch --"
                  options={[
                    { value: "", label: "-- Không thuộc chiến dịch --" },
                    ...campaigns.map((c) => ({
                      value: c.id,
                      label: c.name,
                    })),
                  ]}
                />
              </div>

              {/* Booking Code */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mã Booking (Để trống để tự tạo)
                </label>
                <input
                  type="text"
                  placeholder="VD: BK-202609-001"
                  value={formData.code || ""}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* 2. Commercial Terms */}
          <div className="space-y-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
              2. Điều khoản Thương mại & Thanh toán
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Chi phí Booking (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.booking_fee}
                  onChange={(e) => setFormData({ ...formData, booking_fee: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  % Hoa hồng chốt (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.commission_rate}
                  onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  % Ngân sách Ads (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={formData.ads_rate}
                  onChange={(e) => setFormData({ ...formData, ads_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Trạng thái thanh toán
                </label>
                <CustomSelect
                  value={formData.payment_status}
                  onChange={(val) => setFormData({ ...formData, payment_status: val as PaymentStatus })}
                  options={[
                    { value: "unpaid", label: "Chưa thanh toán", dot: "bg-rose-500" },
                    { value: "partially_paid", label: "Thanh toán 1 phần", dot: "bg-amber-500" },
                    { value: "paid", label: "Đã thanh toán đủ", dot: "bg-emerald-500" },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Số tiền đã thanh toán (VNĐ)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.paid_amount}
                  onChange={(e) => setFormData({ ...formData, paid_amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Định dạng video
                </label>
                <CustomSelect
                  value={formData.content_type || "Review sản phẩm"}
                  onChange={(val) => setFormData({ ...formData, content_type: val })}
                  options={CONTENT_TYPES.map((ct) => ({
                    value: ct,
                    label: ct,
                  }))}
                />
              </div>
            </div>
          </div>

          {/* 3. Sample Logistics */}
          <div className="space-y-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
              3. Vận chuyển & Thông tin gửi mẫu
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Đơn vị vận chuyển
                </label>
                <CustomSelect
                  value={formData.sample_carrier || "GHTK"}
                  onChange={(val) => setFormData({ ...formData, sample_carrier: val })}
                  options={CARRIERS.map((car) => ({
                    value: car,
                    label: car,
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mã vận đơn
                </label>
                <input
                  type="text"
                  placeholder="VD: GHTK1238912"
                  value={formData.sample_tracking_code || ""}
                  onChange={(e) => setFormData({ ...formData, sample_tracking_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tên người nhận
                </label>
                <input
                  type="text"
                  value={formData.recipient_name || ""}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  SĐT người nhận
                </label>
                <input
                  type="text"
                  value={formData.recipient_phone || ""}
                  onChange={(e) => setFormData({ ...formData, recipient_phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Địa chỉ nhận hàng chi tiết
                </label>
                <input
                  type="text"
                  value={formData.recipient_address || ""}
                  onChange={(e) => setFormData({ ...formData, recipient_address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* 4. Timelines & Deadlines */}
          <div className="space-y-3.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
              4. Mốc thời gian & Hạn chót
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hạn chót đăng video
                </label>
                <DatePicker
                  value={formData.expected_post_at || ""}
                  onChange={(val) => setFormData({ ...formData, expected_post_at: val })}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Mốc nhắc nhở video
                </label>
                <DatePicker
                  value={formData.video_reminder_at || ""}
                  onChange={(val) => setFormData({ ...formData, video_reminder_at: val })}
                  placeholder="dd/mm/yyyy"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ghi chú thêm
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ghi chú yêu cầu đặc biệt, brief, thỏa thuận riêng..."
                  className="w-full px-3 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Form Buttons */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isPending ? "Đang lưu..." : editingBooking ? "Cập nhật Booking" : "Tạo Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
