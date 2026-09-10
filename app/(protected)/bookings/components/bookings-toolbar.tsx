"use client";

import type { BookingStatus, PaymentStatus } from "@/lib/types/booking";
import type { Campaign } from "@/lib/types/campaign";
import type { BookingViewMode, ColumnId, ViewPreset } from "./types";
import CustomSelect from "@/components/ui/custom-select";
import ColumnCustomizer from "./column-customizer";
import { STATUS_META } from "./table/inline-status-cell";

interface BookingsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: BookingViewMode;
  onViewModeChange: (mode: BookingViewMode) => void;
  statusFilter: BookingStatus | "all";
  onStatusFilterChange: (status: BookingStatus | "all") => void;
  campaignFilter: string;
  onCampaignFilterChange: (campaignId: string) => void;
  paymentFilter: PaymentStatus | "all";
  onPaymentFilterChange: (payment: PaymentStatus | "all") => void;
  deadlineFilter: "all" | "urgent" | "overdue";
  onDeadlineFilterChange: (deadline: "all" | "urgent" | "overdue") => void;
  campaigns: Campaign[];
  totalBookingsCount: number;
  isAnyFilterActive: boolean;
  onResetFilters: () => void;
  // Column customization
  visibleColumns: ColumnId[];
  onChangeColumns: (columns: ColumnId[]) => void;
  activePreset: ViewPreset | "custom";
  onSelectPreset: (preset: ViewPreset) => void;
  // Quick Add Row
  showQuickAdd: boolean;
  onToggleQuickAdd: () => void;
  // Bulk Actions
  selectedCount: number;
  onBulkStatusChange: (status: BookingStatus) => void;
  onBulkMarkPaid: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

const STAGES_LIST: BookingStatus[] = [
  "contacted",
  "confirmed",
  "sample_sent",
  "sample_delivered",
  "draft_submitted",
  "posted",
  "completed",
  "cancelled",
];

export default function BookingsToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  statusFilter,
  onStatusFilterChange,
  campaignFilter,
  onCampaignFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  deadlineFilter,
  onDeadlineFilterChange,
  campaigns,
  totalBookingsCount,
  isAnyFilterActive,
  onResetFilters,
  visibleColumns,
  onChangeColumns,
  activePreset,
  onSelectPreset,
  showQuickAdd,
  onToggleQuickAdd,
  selectedCount,
  onBulkStatusChange,
  onBulkMarkPaid,
  onBulkDelete,
  onClearSelection,
}: BookingsToolbarProps) {
  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
      {/* Top row: Search, View Mode Toggle, Quick Add toggle, Column Customizer */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo mã booking, KOL, sản phẩm, mã vận đơn, người nhận..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400"
          />
        </div>

        {/* View Mode & Table Tools */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Quick Add Row Toggle (Only in table mode) */}
          {viewMode === "table" && (
            <button
              type="button"
              onClick={onToggleQuickAdd}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                showQuickAdd
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
              }`}
              title="Mở hàng nhập liệu nhanh trên đầu bảng (Phím tắt: N)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>{showQuickAdd ? "Đóng nhập nhanh" : "Thêm dòng nhanh"}</span>
            </button>
          )}

          {/* Column Customizer (Only in table mode) */}
          {viewMode === "table" && (
            <ColumnCustomizer
              visibleColumns={visibleColumns}
              onChangeColumns={onChangeColumns}
              activePreset={activePreset}
              onSelectPreset={onSelectPreset}
            />
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80">
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Bảng dữ liệu
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Kanban
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("analytics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "analytics"
                  ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Tiến độ & ROI
            </button>
          </div>
        </div>
      </div>

      {/* Second row: Dropdown filters & Quick Deadline pills */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Bộ lọc:</span>

        {/* Status filter (Table mode only) */}
        {viewMode === "table" && (
          <div className="min-w-[180px]">
            <CustomSelect
              value={statusFilter}
              onChange={(val) => onStatusFilterChange(val as BookingStatus | "all")}
              options={[
                { value: "all", label: `Tất cả trạng thái (${totalBookingsCount})` },
                ...STAGES_LIST.map((st) => ({
                  value: st,
                  label: STATUS_META[st].label,
                  dot: STATUS_META[st].dot,
                })),
              ]}
            />
          </div>
        )}

        {/* Campaign Filter */}
        <div className="min-w-[170px]">
          <CustomSelect
            value={campaignFilter}
            onChange={(val) => onCampaignFilterChange(val)}
            options={[
              { value: "all", label: "Tất cả chiến dịch" },
              ...campaigns.map((camp) => ({
                value: camp.id,
                label: camp.name,
              })),
            ]}
          />
        </div>

        {/* Payment Filter */}
        <div className="min-w-[170px]">
          <CustomSelect
            value={paymentFilter}
            onChange={(val) => onPaymentFilterChange(val as PaymentStatus | "all")}
            options={[
              { value: "all", label: "Tất cả thanh toán" },
              { value: "unpaid", label: "Chưa thanh toán", dot: "bg-rose-500" },
              { value: "partially_paid", label: "Thanh toán 1 phần", dot: "bg-amber-500" },
              { value: "paid", label: "Đã thanh toán đủ", dot: "bg-emerald-500" },
            ]}
          />
        </div>

        {/* Quick Deadline Pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => onDeadlineFilterChange("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              deadlineFilter === "all"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Tất cả hạn
          </button>
          <button
            type="button"
            onClick={() => onDeadlineFilterChange("urgent")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              deadlineFilter === "urgent"
                ? "bg-amber-500 text-white shadow-2xs"
                : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Sắp đến hạn (48h)
          </button>
          <button
            type="button"
            onClick={() => onDeadlineFilterChange("overdue")}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              deadlineFilter === "overdue"
                ? "bg-rose-600 text-white shadow-2xs"
                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Quá hạn
          </button>
        </div>

        {isAnyFilterActive && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition ml-auto cursor-pointer"
          >
            <span>✕ Đặt lại bộ lọc</span>
          </button>
        )}
      </div>

      {/* Bulk Action Strip (appears when rows are checked) */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">
              {selectedCount}
            </span>
            <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
              Đang chọn {selectedCount} booking
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Status Select */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  onBulkStatusChange(e.target.value as BookingStatus);
                  e.target.value = "";
                }
              }}
              className="text-xs bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2.5 py-1 text-zinc-900 dark:text-zinc-100 font-medium focus:outline-none cursor-pointer"
            >
              <option value="" disabled>
                ⚡ Chuyển trạng thái hàng loạt...
              </option>
              {STAGES_LIST.map((st) => (
                <option key={st} value={st}>
                  {STATUS_META[st].label}
                </option>
              ))}
            </select>

            {/* Bulk Mark as Paid */}
            <button
              type="button"
              onClick={onBulkMarkPaid}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer"
            >
              ✓ Đã TT đủ
            </button>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={onBulkDelete}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition cursor-pointer"
            >
              Xóa ({selectedCount})
            </button>

            {/* Deselect all */}
            <button
              type="button"
              onClick={onClearSelection}
              className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
