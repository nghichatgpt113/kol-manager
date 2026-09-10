"use client";

import { useState, useMemo, useEffect } from "react";
import type { Booking, BookingStatus, CreateBookingInput } from "@/lib/types/booking";
import type { Kol } from "@/lib/types/kol";
import type { Product } from "@/lib/types/product";
import type { Campaign } from "@/lib/types/campaign";
import type { ColumnId, SortField, SortDirection } from "../types";
import PlatformIcon from "@/components/icons/platform-icon";
import InlineStatusCell from "./inline-status-cell";
import InlinePaymentCell from "./inline-payment-cell";
import InlineTrackingCell from "./inline-tracking-cell";
import InlineDateCell from "./inline-date-cell";
import InlineFeeCell from "./inline-fee-cell";
import InlineNotesCell from "./inline-notes-cell";
import QuickAddRow from "./quick-add-row";
import CopyButton from "@/components/ui/copy-button";

interface BookingTableProps {
  bookings: Booking[];
  visibleColumns: ColumnId[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenDetail: (booking: Booking) => void;
  onClone: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
  onUpdateStatus: (id: string, status: BookingStatus) => Promise<void>;
  onUpdateBooking: (id: string, input: Partial<CreateBookingInput>) => Promise<void>;
  showQuickAdd: boolean;
  onCloseQuickAdd: () => void;
  onCreateQuickAdd: (input: CreateBookingInput) => Promise<boolean>;
  kols: Kol[];
  products: Product[];
  campaigns: Campaign[];
}

export default function BookingTable({
  bookings,
  visibleColumns,
  sortField,
  sortDirection,
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDetail,
  onClone,
  onDelete,
  onUpdateStatus,
  onUpdateBooking,
  showQuickAdd,
  onCloseQuickAdd,
  onCreateQuickAdd,
  kols,
  products,
  campaigns,
}: BookingTableProps) {
  // Pagination State
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Total pages and safe current page
  const totalPages = Math.max(1, Math.ceil(bookings.length / pageSize));

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(bookings.length, startIndex + pageSize);

  const paginatedBookings = useMemo(() => {
    return bookings.slice(startIndex, endIndex);
  }, [bookings, startIndex, endIndex]);

  const isAllSelected = bookings.length > 0 && selectedIds.length === bookings.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < bookings.length;

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-3 h-3 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {sortDirection === "asc" ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        )}
      </svg>
    );
  };

  // Generate pagination numbers array
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col overflow-hidden">
      {/* 
        Scrollable Table Container:
        - Max height calculated to fit viewport
        - Sticky thead so header stays firmly pinned on top
        - Rows scroll INSIDE the table, page doesn't scroll wildly
      */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] min-h-[420px] relative">
        <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-20 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-zinc-200 dark:border-zinc-800 shadow-2xs select-none">
            <tr className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
              {/* Checkbox select all */}
              <th className="py-3 px-3 w-10 text-center bg-inherit">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isPartiallySelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>

              {/* Code */}
              {visibleColumns.includes("code") && (
                <th
                  onClick={() => onSort("created_at")}
                  className="py-3 px-4 w-[140px] whitespace-nowrap cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition group bg-inherit"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Mã & Định dạng</span>
                    {renderSortIndicator("created_at")}
                  </div>
                </th>
              )}

              {/* KOL */}
              {visibleColumns.includes("kol") && (
                <th
                  onClick={() => onSort("kol_name")}
                  className="py-3 px-4 min-w-[190px] whitespace-nowrap cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition group bg-inherit"
                >
                  <div className="flex items-center gap-1.5">
                    <span>KOL / KOC</span>
                    {renderSortIndicator("kol_name")}
                  </div>
                </th>
              )}

              {/* Product & Campaign */}
              {visibleColumns.includes("product") && (
                <th className="py-3 px-4 min-w-[200px] whitespace-nowrap bg-inherit">
                  Sản phẩm & Chiến dịch
                </th>
              )}

              {/* Status */}
              {visibleColumns.includes("status") && (
                <th
                  onClick={() => onSort("status")}
                  className="py-3 px-4 w-[160px] whitespace-nowrap cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition group bg-inherit"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Trạng thái</span>
                    {renderSortIndicator("status")}
                  </div>
                </th>
              )}

              {/* Logistics */}
              {visibleColumns.includes("logistics") && (
                <th className="py-3 px-4 min-w-[180px] whitespace-nowrap bg-inherit">
                  Hậu cần & Vận đơn
                </th>
              )}

              {/* Deadline */}
              {visibleColumns.includes("deadline") && (
                <th
                  onClick={() => onSort("expected_post_at")}
                  className="py-3 px-4 w-[150px] whitespace-nowrap cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition group bg-inherit"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Hạn làm video</span>
                    {renderSortIndicator("expected_post_at")}
                  </div>
                </th>
              )}

              {/* Fee & Commission */}
              {visibleColumns.includes("fee") && (
                <th
                  onClick={() => onSort("booking_fee")}
                  className="py-3 px-4 w-[150px] whitespace-nowrap cursor-pointer hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition group bg-inherit"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Chi phí & HH</span>
                    {renderSortIndicator("booking_fee")}
                  </div>
                </th>
              )}

              {/* Payment */}
              {visibleColumns.includes("payment") && (
                <th className="py-3 px-4 min-w-[160px] whitespace-nowrap bg-inherit">
                  Thanh toán
                </th>
              )}

              {/* Recipient */}
              {visibleColumns.includes("recipient") && (
                <th className="py-3 px-4 min-w-[220px] whitespace-nowrap bg-inherit">
                  Người nhận hàng
                </th>
              )}

              {/* Performance */}
              {visibleColumns.includes("performance") && (
                <th className="py-3 px-4 w-[130px] whitespace-nowrap bg-inherit">
                  Hiệu quả video
                </th>
              )}

              {/* Notes */}
              {visibleColumns.includes("notes") && (
                <th className="py-3 px-4 min-w-[160px] whitespace-nowrap bg-inherit">
                  Ghi chú nhanh
                </th>
              )}

              {/* Actions */}
              {visibleColumns.includes("actions") && (
                <th className="py-3 px-4 w-[90px] text-right whitespace-nowrap bg-inherit">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {/* Quick Add Row (if active) */}
            {showQuickAdd && (
              <QuickAddRow
                kols={kols}
                products={products}
                campaigns={campaigns}
                visibleColumns={visibleColumns}
                onCancel={onCloseQuickAdd}
                onCreate={onCreateQuickAdd}
              />
            )}

            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1}
                  className="py-12 text-center text-zinc-400"
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">📋</span>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Không có booking nào phù hợp
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Bấm "+ Thêm dòng nhanh" hoặc "Tạo Booking mới" để bắt đầu
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedBookings.map((b) => {
                const isSelected = selectedIds.includes(b.id);
                const videoCount = b.videos?.length || 0;
                const totalViews = (b.videos || []).reduce(
                  (sum, v) => sum + (Number(v.views_count) || 0),
                  0
                );

                return (
                  <tr
                    key={b.id}
                    onClick={() => onOpenDetail(b)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20"
                        : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                    }`}
                  >
                    {/* Row checkbox */}
                    <td
                      className="py-3 px-3 text-center align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(b.id)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>

                    {/* Code & Type */}
                    {visibleColumns.includes("code") && (
                      <td className="py-3 px-4 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 inline-block shadow-2xs">
                            {b.code || "BK-TEMP"}
                          </span>
                          {b.code && (
                            <CopyButton text={b.code} title="Sao chép mã booking" size="xs" />
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {b.content_type || "Review"}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* KOL */}
                    {visibleColumns.includes("kol") && (
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-2xs">
                            {b.kol?.display_name
                              ? b.kol.display_name.charAt(0).toUpperCase()
                              : b.kol?.username?.charAt(0).toUpperCase() || "?"}
                            <span className="absolute -bottom-0.5 -right-0.5">
                              <PlatformIcon platform={b.kol?.platform || "tiktok"} size="xs" />
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {b.kol?.display_name || b.kol?.username || "Chưa gắn KOL"}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <span>@{b.kol?.username || "—"}</span>
                              {b.kol?.username && (
                                <CopyButton
                                  text={b.kol.username}
                                  title={`Sao chép @${b.kol.username}`}
                                  size="xs"
                                />
                              )}
                              {b.kol?.channel_url && (
                                <a
                                  href={b.kol.channel_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                  title="Mở kênh TikTok"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                              {b.kol?.followers_count ? (
                                <>
                                  <span>•</span>
                                  <span>
                                    {new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(
                                      b.kol.followers_count
                                    )}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Product & Campaign */}
                    {visibleColumns.includes("product") && (
                      <td className="py-3 px-4 align-middle">
                        <div className="font-medium text-xs text-zinc-800 dark:text-zinc-200 truncate max-w-[190px]">
                          {b.product?.name || (
                            <span className="text-zinc-400 italic">Chưa gắn SP</span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          {b.campaign ? (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/60 truncate max-w-[130px]">
                              {b.campaign.name}
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic text-[10px]">Ngoài chiến dịch</span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Status (INLINE EDIT) */}
                    {visibleColumns.includes("status") && (
                      <td className="py-3 px-4 align-middle">
                        <InlineStatusCell
                          bookingId={b.id}
                          status={b.status}
                          onUpdate={(newStatus) => onUpdateStatus(b.id, newStatus)}
                        />
                      </td>
                    )}

                    {/* Logistics (INLINE EDIT & CARRIER LINK) */}
                    {visibleColumns.includes("logistics") && (
                      <td className="py-3 px-4 align-middle">
                        <InlineTrackingCell
                          bookingId={b.id}
                          carrier={b.sample_carrier}
                          trackingCode={b.sample_tracking_code}
                          recipientName={b.recipient_name}
                          recipientPhone={b.recipient_phone}
                          recipientAddress={b.recipient_address}
                          onUpdate={(data) => onUpdateBooking(b.id, data)}
                        />
                      </td>
                    )}

                    {/* Deadline (INLINE EDIT) */}
                    {visibleColumns.includes("deadline") && (
                      <td className="py-3 px-4 align-middle">
                        <InlineDateCell
                          bookingId={b.id}
                          expectedPostAt={b.expected_post_at}
                          onUpdate={(date) => onUpdateBooking(b.id, { expected_post_at: date })}
                        />
                      </td>
                    )}

                    {/* Fee & Commission (INLINE EDIT) */}
                    {visibleColumns.includes("fee") && (
                      <td className="py-3 px-4 align-middle">
                        <InlineFeeCell
                          bookingId={b.id}
                          bookingFee={Number(b.booking_fee) || 0}
                          commissionRate={Number(b.commission_rate) || 0}
                          adsRate={Number(b.ads_rate) || 0}
                          onUpdate={(data) => onUpdateBooking(b.id, data)}
                        />
                      </td>
                    )}

                    {/* Payment (INLINE EDIT) */}
                    {visibleColumns.includes("payment") && (
                      <td className="py-3 px-4 align-middle">
                        <InlinePaymentCell
                          bookingId={b.id}
                          paymentStatus={b.payment_status}
                          paidAmount={Number(b.paid_amount) || 0}
                          bookingFee={Number(b.booking_fee) || 0}
                          onUpdate={(data) => onUpdateBooking(b.id, data)}
                        />
                      </td>
                    )}

                    {/* Recipient info */}
                    {visibleColumns.includes("recipient") && (
                      <td className="py-3 px-4 align-middle">
                        <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                          {b.recipient_name || "—"} {b.recipient_phone ? `(${b.recipient_phone})` : ""}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[200px] mt-0.5">
                          {b.recipient_address || "—"}
                        </div>
                      </td>
                    )}

                    {/* Video Performance */}
                    {visibleColumns.includes("performance") && (
                      <td className="py-3 px-4 align-middle">
                        {videoCount > 0 ? (
                          <div>
                            <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                              {new Intl.NumberFormat("vi-VN").format(totalViews)}
                            </span>
                            <span className="text-[10px] text-zinc-400 block">
                              {videoCount} video
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">Chưa có video</span>
                        )}
                      </td>
                    )}

                    {/* Notes (INLINE EDIT) */}
                    {visibleColumns.includes("notes") && (
                      <td className="py-3 px-4 align-middle">
                        <InlineNotesCell
                          bookingId={b.id}
                          notes={b.notes}
                          onUpdate={(notes) => onUpdateBooking(b.id, { notes })}
                        />
                      </td>
                    )}

                    {/* Actions */}
                    {visibleColumns.includes("actions") && (
                      <td
                        className="py-3 px-4 text-right align-middle whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onClone(b)}
                            title="Tái hợp tác / Nhân bản booking"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(b)}
                            title="Xóa booking"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pinned Pagination Footer Bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 bg-zinc-50/80 dark:bg-zinc-900/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 select-none">
        {/* Left: Range and total */}
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {bookings.length > 0 ? (
            <>
              Hiển thị{" "}
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                {startIndex + 1} - {endIndex}
              </strong>{" "}
              trên tổng số{" "}
              <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
                {bookings.length}
              </strong>{" "}
              booking
            </>
          ) : (
            "0 booking"
          )}
        </div>

        {/* Center: Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Số dòng:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value={15}>15 / trang</option>
            <option value={25}>25 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        </div>

        {/* Right: Page navigation buttons */}
        <div className="flex items-center gap-1">
          {/* First page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(1)}
            title="Trang đầu"
            className="p-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            «
          </button>
          {/* Prev page */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Trang trước"
            className="p-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            ‹
          </button>

          {/* Page numbers */}
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCurrentPage(p)}
              className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentPage === p
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {p}
            </button>
          ))}

          {/* Next page */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            title="Trang tiếp"
            className="p-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            ›
          </button>
          {/* Last page */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(totalPages)}
            title="Trang cuối"
            className="p-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}
