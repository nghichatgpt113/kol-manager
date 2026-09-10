"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import type {
  Booking,
  BookingStatus,
  PaymentStatus,
  CreateBookingInput,
} from "@/lib/types/booking";
import type { Kol } from "@/lib/types/kol";
import type { Product } from "@/lib/types/product";
import type { Campaign } from "@/lib/types/campaign";
import {
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} from "@/lib/services/bookings";
import { getKols } from "@/lib/services/kols";
import { getProducts } from "@/lib/services/products";

// Components
import type { BookingViewMode, ColumnId, ViewPreset, SortField, SortDirection } from "./components/types";
import { VIEW_PRESETS } from "./components/types";
import BookingsRoiDashboard from "./components/bookings-roi-dashboard";
import BookingsToolbar from "./components/bookings-toolbar";
import BookingTable from "./components/table/booking-table";
import BookingKanban from "./components/kanban/booking-kanban";
import BookingDetailDrawer from "./components/drawer/booking-detail-drawer";
import BookingFormModal from "./components/modals/booking-form-modal";
import BookingDeleteModal from "./components/modals/booking-delete-modal";
import FloatingActionBar from "@/components/ui/floating-action-bar";

interface BookingsClientProps {
  initialBookings: Booking[];
  initialKols?: Kol[];
  initialProducts?: Product[];
  campaigns: Campaign[];
}

const STORAGE_KEYS = {
  VIEW_MODE: "kol_manager_bookings_view_mode",
  VISIBLE_COLUMNS: "kol_manager_bookings_columns",
  ACTIVE_PRESET: "kol_manager_bookings_preset",
  SORT_FIELD: "kol_manager_bookings_sort_field",
  SORT_DIR: "kol_manager_bookings_sort_dir",
};

export default function BookingsClient({
  initialBookings,
  initialKols = [],
  initialProducts = [],
  campaigns,
}: BookingsClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [kols, setKols] = useState<Kol[]>(initialKols);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // View & UI Preferences
  const [viewMode, setViewMode] = useState<BookingViewMode>("table");
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(VIEW_PRESETS.all.columns);
  const [activePreset, setActivePreset] = useState<ViewPreset | "custom">("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [deadlineFilter, setDeadlineFilter] = useState<"all" | "urgent" | "overdue">("all");

  // Selection & Quick Add
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Modals & Drawer
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [confirmDeleteBooking, setConfirmDeleteBooking] = useState<Booking | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast / Feedback notification
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as BookingViewMode | null;
      if (savedMode === "table" || savedMode === "kanban" || savedMode === "analytics") {
        setViewMode(savedMode);
      }
      const savedPreset = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET) as ViewPreset | "custom" | null;
      if (savedPreset) {
        setActivePreset(savedPreset);
      }
      const savedCols = localStorage.getItem(STORAGE_KEYS.VISIBLE_COLUMNS);
      if (savedCols) {
        const parsed = JSON.parse(savedCols);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleColumns(parsed);
        }
      }
      const savedSortField = localStorage.getItem(STORAGE_KEYS.SORT_FIELD) as SortField | null;
      if (savedSortField) setSortField(savedSortField);
      const savedSortDir = localStorage.getItem(STORAGE_KEYS.SORT_DIR) as SortDirection | null;
      if (savedSortDir) setSortDirection(savedSortDir);
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  // Background non-blocking load for KOLs & Products dropdowns if empty
  useEffect(() => {
    let isMounted = true;
    if (initialKols.length === 0 || initialProducts.length === 0) {
      Promise.all([getKols(), getProducts()]).then(([kolsRes, prodsRes]) => {
        if (!isMounted) return;
        if (kolsRes.data && kolsRes.data.length > 0) setKols(kolsRes.data);
        if (prodsRes.data && prodsRes.data.length > 0) setProducts(prodsRes.data);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [initialKols.length, initialProducts.length]);

  // Show auto-dismiss toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Preference change setters with persistence
  const handleViewModeChange = (mode: BookingViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
    } catch {}
  };

  const handleColumnsChange = (columns: ColumnId[]) => {
    setVisibleColumns(columns);
    setActivePreset("custom");
    try {
      localStorage.setItem(STORAGE_KEYS.VISIBLE_COLUMNS, JSON.stringify(columns));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET, "custom");
    } catch {}
  };

  const handleSelectPreset = (preset: ViewPreset) => {
    const cols = VIEW_PRESETS[preset].columns;
    setVisibleColumns(cols);
    setActivePreset(preset);
    try {
      localStorage.setItem(STORAGE_KEYS.VISIBLE_COLUMNS, JSON.stringify(cols));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET, preset);
    } catch {}
  };

  const handleSort = (field: SortField) => {
    let newDir: SortDirection = "asc";
    if (sortField === field) {
      newDir = sortDirection === "asc" ? "desc" : "asc";
    }
    setSortField(field);
    setSortDirection(newDir);
    try {
      localStorage.setItem(STORAGE_KEYS.SORT_FIELD, field);
      localStorage.setItem(STORAGE_KEYS.SORT_DIR, newDir);
    } catch {}
  };

  // Keyboard shortcut: 'N' to toggle quick add row (when not in input)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "n" || e.key === "N") &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName) &&
        !isModalOpen &&
        !detailBooking
      ) {
        if (viewMode === "table") {
          e.preventDefault();
          setShowQuickAdd((prev) => !prev);
        }
      }
      if (e.key === "Escape") {
        if (confirmDeleteBooking) setConfirmDeleteBooking(null);
        else if (isModalOpen) setIsModalOpen(false);
        else if (detailBooking) setDetailBooking(null);
        else if (showQuickAdd) setShowQuickAdd(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDeleteBooking, isModalOpen, detailBooking, showQuickAdd, viewMode]);

  // Filtered & Sorted Bookings
  const filteredBookings = useMemo(() => {
    const filtered = bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (campaignFilter !== "all" && b.campaign_id !== campaignFilter) return false;
      if (paymentFilter !== "all" && b.payment_status !== paymentFilter) return false;

      if (deadlineFilter !== "all") {
        if (!b.expected_post_at) return false;
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const target = new Date(b.expected_post_at);
        target.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (deadlineFilter === "urgent" && (diffDays < 0 || diffDays > 2)) return false;
        if (deadlineFilter === "overdue" && diffDays >= 0) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const kolMatch =
        b.kol?.username?.toLowerCase().includes(q) ||
        b.kol?.display_name?.toLowerCase().includes(q);
      const codeMatch = b.code?.toLowerCase().includes(q);
      const productMatch = b.product?.name?.toLowerCase().includes(q);
      const carrierMatch = b.sample_carrier?.toLowerCase().includes(q);
      const trackingMatch = b.sample_tracking_code?.toLowerCase().includes(q);
      const recipientMatch =
        b.recipient_name?.toLowerCase().includes(q) ||
        b.recipient_phone?.toLowerCase().includes(q);

      return (
        kolMatch ||
        codeMatch ||
        productMatch ||
        carrierMatch ||
        trackingMatch ||
        recipientMatch
      );
    });

    // Sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === "expected_post_at") {
        const dateA = a.expected_post_at ? new Date(a.expected_post_at).getTime() : 0;
        const dateB = b.expected_post_at ? new Date(b.expected_post_at).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortField === "booking_fee") {
        comparison = (Number(a.booking_fee) || 0) - (Number(b.booking_fee) || 0);
      } else if (sortField === "kol_name") {
        const nameA = (a.kol?.display_name || a.kol?.username || "").toLowerCase();
        const nameB = (b.kol?.display_name || b.kol?.username || "").toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === "status") {
        comparison = (a.status || "").localeCompare(b.status || "");
      } else {
        // created_at
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        comparison = dateA - dateB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [
    bookings,
    statusFilter,
    campaignFilter,
    paymentFilter,
    deadlineFilter,
    searchQuery,
    sortField,
    sortDirection,
  ]);

  const isAnyFilterActive =
    (viewMode === "table" && statusFilter !== "all") ||
    campaignFilter !== "all" ||
    paymentFilter !== "all" ||
    deadlineFilter !== "all" ||
    !!searchQuery.trim();

  const handleResetFilters = () => {
    setStatusFilter("all");
    setCampaignFilter("all");
    setPaymentFilter("all");
    setDeadlineFilter("all");
    setSearchQuery("");
  };

  // --- INLINE EDIT HANDLERS (OPTIMISTIC UI) ---

  const handleUpdateStatus = async (id: string, newStatus: BookingStatus) => {
    // 1. Optimistic update
    const previous = bookings;
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    if (detailBooking && detailBooking.id === id) {
      setDetailBooking((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await updateBookingStatus(id, newStatus);
      if (res.error) {
        // Revert
        setBookings(previous);
        showToast(`Lỗi cập nhật trạng thái: ${res.error}`, "error");
      } else if (res.data) {
        setBookings((prev) => prev.map((b) => (b.id === id ? res.data! : b)));
        showToast("Đã cập nhật trạng thái");
      }
    } catch {
      setBookings(previous);
      showToast("Lỗi kết nối máy chủ", "error");
    }
  };

  const handleUpdateBooking = async (
    id: string,
    partialInput: Partial<CreateBookingInput>
  ) => {
    // 1. Optimistic update
    const previous = bookings;
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        return {
          ...b,
          ...partialInput,
          // Handle numeric overrides
          booking_fee:
            partialInput.booking_fee !== undefined
              ? Number(partialInput.booking_fee)
              : b.booking_fee,
          commission_rate:
            partialInput.commission_rate !== undefined
              ? Number(partialInput.commission_rate)
              : b.commission_rate,
          paid_amount:
            partialInput.paid_amount !== undefined
              ? Number(partialInput.paid_amount)
              : b.paid_amount,
        };
      })
    );

    try {
      const res = await updateBooking(id, partialInput);
      if (res.error) {
        setBookings(previous);
        showToast(`Lỗi lưu dữ liệu: ${res.error}`, "error");
      } else if (res.data) {
        setBookings((prev) => prev.map((b) => (b.id === id ? res.data! : b)));
        if (detailBooking && detailBooking.id === id) {
          setDetailBooking(res.data);
        }
        showToast("Đã lưu thay đổi");
      }
    } catch {
      setBookings(previous);
      showToast("Lỗi kết nối mạng", "error");
    }
  };

  // --- QUICK ADD ROW HANDLER ---

  const handleCreateQuickAdd = async (input: CreateBookingInput): Promise<boolean> => {
    try {
      const res = await createBooking(input);
      if (res.error) {
        showToast(`Lỗi tạo booking: ${res.error}`, "error");
        return false;
      }
      if (res.data) {
        setBookings((prev) => [res.data!, ...prev]);
        showToast("Đã thêm booking thành công! Tiếp tục nhập dòng tiếp theo.");
        return true;
      }
      return false;
    } catch {
      showToast("Lỗi kết nối khi tạo booking", "error");
      return false;
    }
  };

  // --- MODAL FORM SUBMIT (CREATE / EDIT) ---

  const handleModalSubmit = async (data: CreateBookingInput): Promise<boolean> => {
    try {
      if (editingBooking) {
        const res = await updateBooking(editingBooking.id, data);
        if (res.error) {
          showToast(`Lỗi cập nhật: ${res.error}`, "error");
          return false;
        }
        if (res.data) {
          setBookings((prev) =>
            prev.map((b) => (b.id === editingBooking.id ? res.data! : b))
          );
          if (detailBooking && detailBooking.id === editingBooking.id) {
            setDetailBooking(res.data);
          }
          showToast("Đã cập nhật booking thành công");
          return true;
        }
      } else {
        const res = await createBooking(data);
        if (res.error) {
          showToast(`Lỗi tạo booking: ${res.error}`, "error");
          return false;
        }
        if (res.data) {
          setBookings((prev) => [res.data!, ...prev]);
          showToast("Đã tạo booking mới thành công");
          return true;
        }
      }
      return false;
    } catch {
      showToast("Lỗi máy chủ", "error");
      return false;
    }
  };

  // --- CLONE / DUPLICATE BOOKING ---

  const handleCloneBooking = (booking: Booking) => {
    // Clone with same KOL, Product, Campaign, Fee, Recipient, but reset code and dates
    setEditingBooking(null);
    setIsModalOpen(true);
    // Preload into editing form via a special clone object
    const cloned: Booking = {
      ...booking,
      id: "",
      code: "",
      sample_tracking_code: "",
      sample_sent_at: null,
      sample_expected_at: null,
      sample_delivered_at: null,
      video_reminder_at: null,
      expected_post_at: null,
      payment_status: "unpaid",
      paid_amount: 0,
      status: "contacted",
    };
    setEditingBooking(cloned);
  };

  // --- DELETE CONFIRMATION ---

  const handleDeleteConfirm = async (booking: Booking) => {
    setIsDeleting(true);
    try {
      const res = await deleteBooking(booking.id);
      if (res.error) {
        showToast(`Lỗi xóa: ${res.error}`, "error");
      } else {
        setBookings((prev) => prev.filter((b) => b.id !== booking.id));
        setSelectedIds((prev) => prev.filter((id) => id !== booking.id));
        if (detailBooking && detailBooking.id === booking.id) {
          setDetailBooking(null);
        }
        setConfirmDeleteBooking(null);
        showToast("Đã xóa booking vĩnh viễn");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // --- SELECTION & BULK ACTIONS ---

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredBookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBookings.map((b) => b.id));
    }
  };

  const handleBulkStatusChange = async (newStatus: BookingStatus) => {
    if (selectedIds.length === 0) return;
    const targetIds = [...selectedIds];

    // Optimistic
    setBookings((prev) =>
      prev.map((b) => (targetIds.includes(b.id) ? { ...b, status: newStatus } : b))
    );
    showToast(`Đang cập nhật ${targetIds.length} booking...`);

    try {
      await Promise.all(targetIds.map((id) => updateBookingStatus(id, newStatus)));
      showToast(`Đã chuyển ${targetIds.length} booking sang "${newStatus}"`);
      setSelectedIds([]);
    } catch {
      showToast("Lỗi khi cập nhật hàng loạt", "error");
    }
  };

  const handleBulkMarkPaid = async () => {
    if (selectedIds.length === 0) return;
    const targetIds = [...selectedIds];

    // Optimistic
    setBookings((prev) =>
      prev.map((b) => {
        if (!targetIds.includes(b.id)) return b;
        return {
          ...b,
          payment_status: "paid",
          paid_amount: b.booking_fee,
        };
      })
    );

    try {
      await Promise.all(
        targetIds.map((id) => {
          const b = bookings.find((item) => item.id === id);
          return updateBooking(id, {
            payment_status: "paid",
            paid_amount: b ? b.booking_fee : 0,
          });
        })
      );
      showToast(`Đã đánh dấu thanh toán đủ cho ${targetIds.length} booking`);
      setSelectedIds([]);
    } catch {
      showToast("Lỗi khi cập nhật thanh toán", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa ${selectedIds.length} booking đã chọn? Hành động này không thể hoàn tác!`
      )
    ) {
      return;
    }

    const targetIds = [...selectedIds];
    setBookings((prev) => prev.filter((b) => !targetIds.includes(b.id)));
    setSelectedIds([]);

    try {
      await Promise.all(targetIds.map((id) => deleteBooking(id)));
      showToast(`Đã xóa thành công ${targetIds.length} booking`);
    } catch {
      showToast("Lỗi xóa hàng loạt", "error");
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in slide-in-from-bottom-2 duration-150 ${
            toastMessage.type === "error"
              ? "bg-rose-600 text-white border-rose-700"
              : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-700"
          }`}
        >
          <span>{toastMessage.type === "error" ? "⚠️" : "✓"}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* TOOLBAR (Search, Filters, Column Customizer, Quick Add Toggle, Bulk Actions, View Mode) */}
      <BookingsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        campaignFilter={campaignFilter}
        onCampaignFilterChange={setCampaignFilter}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={setPaymentFilter}
        deadlineFilter={deadlineFilter}
        onDeadlineFilterChange={setDeadlineFilter}
        campaigns={campaigns}
        totalBookingsCount={bookings.length}
        isAnyFilterActive={isAnyFilterActive}
        onResetFilters={handleResetFilters}
        visibleColumns={visibleColumns}
        onChangeColumns={handleColumnsChange}
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        showQuickAdd={showQuickAdd}
        onToggleQuickAdd={() => setShowQuickAdd((prev) => !prev)}
        selectedCount={selectedIds.length}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkMarkPaid={handleBulkMarkPaid}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedIds([])}
      />

      {/* MAIN VIEW: TABLE / KANBAN / TIẾN ĐỘ & ROI */}
      {viewMode === "analytics" ? (
        <div className="space-y-4 animate-in fade-in duration-150">
          <BookingsRoiDashboard bookings={filteredBookings} />
        </div>
      ) : viewMode === "kanban" ? (
        <BookingKanban
          bookings={filteredBookings}
          onOpenDetail={(b) => setDetailBooking(b)}
          onAdvanceStatus={handleUpdateStatus}
          onStatusDrop={handleUpdateStatus}
        />
      ) : (
        <BookingTable
          bookings={filteredBookings}
          visibleColumns={visibleColumns}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onOpenDetail={(b) => setDetailBooking(b)}
          onClone={handleCloneBooking}
          onDelete={(b) => setConfirmDeleteBooking(b)}
          onUpdateStatus={handleUpdateStatus}
          onUpdateBooking={handleUpdateBooking}
          showQuickAdd={showQuickAdd}
          onCloseQuickAdd={() => setShowQuickAdd(false)}
          onCreateQuickAdd={handleCreateQuickAdd}
          kols={kols}
          products={products}
          campaigns={campaigns}
        />
      )}

      {/* INSPECTION DRAWER */}
      {detailBooking && (
        <BookingDetailDrawer
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
          onOpenEdit={(b) => {
            setEditingBooking(b);
            setIsModalOpen(true);
          }}
          onAdvanceStatus={handleUpdateStatus}
        />
      )}

      {/* CREATE / EDIT BOOKING MODAL */}
      <BookingFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingBooking={editingBooking}
        kols={kols}
        products={products}
        campaigns={campaigns}
        onSubmit={handleModalSubmit}
        isPending={isPending}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <BookingDeleteModal
        booking={confirmDeleteBooking}
        onClose={() => setConfirmDeleteBooking(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      {/* FLOATING ACTION BAR (Figma / Trello style dock) */}
      <FloatingActionBar
        primaryAction={{
          label: "Tạo Booking mới",
          onClick: () => {
            setEditingBooking(null);
            setIsModalOpen(true);
          },
          shortcut: "c",
        }}
        secondaryActions={[
          {
            label: showQuickAdd ? "Đóng dòng nhanh" : "Thêm dòng nhanh",
            icon: (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            ),
            onClick: () => setShowQuickAdd((prev) => !prev),
            active: showQuickAdd,
            shortcut: "n",
            title: "Bật/Tắt hàng nhập liệu tức thì trên bảng (Phím N)",
          },
        ]}
        badge={
          selectedIds.length > 0 ? (
            <span className="text-indigo-400 font-semibold">
              Đã chọn {selectedIds.length}
            </span>
          ) : (
            <span className="text-zinc-400">
              {filteredBookings.length} bookings
            </span>
          )
        }
      />
    </div>
  );
}
