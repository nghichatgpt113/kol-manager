"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import type {
  Booking,
  BookingStatus,
  PaymentStatus,
  CreateBookingInput,
  BookingStatusHistory,
} from "@/lib/types/booking";
import type { Kol } from "@/lib/types/kol";
import type { Product } from "@/lib/types/product";
import type { Campaign } from "@/lib/types/campaign";
import {
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  getBookingStatusHistory,
} from "@/lib/services/bookings";
import { getKols } from "@/lib/services/kols";
import { getProducts } from "@/lib/services/products";
import CustomSelect from "@/components/ui/custom-select";
import DatePicker from "@/components/ui/date-picker";
import PlatformIcon from "@/components/icons/platform-icon";

interface BookingsClientProps {
  initialBookings: Booking[];
  initialKols?: Kol[];
  initialProducts?: Product[];
  campaigns: Campaign[];
}

const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;
    description: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    badgeBg: string;
  }
> = {
  contacted: {
    label: "Đang liên hệ",
    description: "Đã nhắn tin mời hợp tác, đang chờ phản hồi hoặc chốt giá",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-500",
    badgeBg: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300",
  },
  confirmed: {
    label: "Đã chốt deal",
    description: "Đã thống nhất giá/mẫu và điều khoản hợp tác",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/30",
    dot: "bg-sky-500",
    badgeBg: "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300",
  },
  sample_sent: {
    label: "Đã gửi mẫu",
    description: "Đã gửi sản phẩm mẫu, có mã vận đơn theo dõi",
    bg: "bg-indigo-500/10",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-500/30",
    dot: "bg-indigo-500",
    badgeBg: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300",
  },
  sample_delivered: {
    label: "Đã nhận mẫu",
    description: "KOL đã nhận được mẫu, kích hoạt đếm ngược làm video",
    bg: "bg-purple-500/10",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-500/30",
    dot: "bg-purple-500",
    badgeBg: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300",
  },
  draft_submitted: {
    label: "Duyệt nháp",
    description: "KOL gửi video nháp kiểm tra trước khi đăng (Tùy chọn)",
    bg: "bg-fuchsia-500/10",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    border: "border-fuchsia-500/30",
    dot: "bg-fuchsia-500",
    badgeBg: "bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-800 dark:text-fuchsia-300",
  },
  posted: {
    label: "Đã lên video",
    description: "Video đã đăng tải công khai trên kênh của KOL",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/30",
    dot: "bg-blue-500",
    badgeBg: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300",
  },
  completed: {
    label: "Hoàn tất",
    description: "Nghiệm thu thành công và hoàn thành thanh toán",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/30",
    dot: "bg-emerald-500",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300",
  },
  cancelled: {
    label: "Hủy hợp tác",
    description: "KOL từ chối, bùng kèo hoặc hủy hợp tác",
    bg: "bg-zinc-500/10",
    text: "text-zinc-600 dark:text-zinc-400",
    border: "border-zinc-500/30",
    dot: "bg-zinc-400",
    badgeBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
  },
};

const PAYMENT_CONFIG: Record<
  PaymentStatus,
  { label: string; shortLabel: string; bg: string; dot: string }
> = {
  unpaid: {
    label: "Chưa thanh toán",
    shortLabel: "Chưa TT",
    bg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50",
    dot: "bg-rose-500",
  },
  partially_paid: {
    label: "Thanh toán 1 phần",
    shortLabel: "1 phần",
    bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50",
    dot: "bg-amber-500",
  },
  paid: {
    label: "Đã thanh toán đủ",
    shortLabel: "Đã TT",
    bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50",
    dot: "bg-emerald-500",
  },
};

function getDeadlineStatus(expectedPostAt: string | null): {
  isOverdue: boolean;
  isUrgent: boolean;
  badgeClass: string;
  label: string | null;
} {
  if (!expectedPostAt) {
    return {
      isOverdue: false,
      isUrgent: false,
      badgeClass:
        "text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80",
      label: null,
    };
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(expectedPostAt);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) {
    return {
      isOverdue: true,
      isUrgent: false,
      badgeClass:
        "text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 font-semibold",
      label: `Trễ ${Math.abs(diffDays)} ngày`,
    };
  }
  if (diffDays <= 2) {
    const label =
      diffDays === 0
        ? "Hôm nay"
        : diffDays === 1
        ? "Ngày mai"
        : "Còn 2 ngày";
    return {
      isOverdue: false,
      isUrgent: true,
      badgeClass:
        "text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 font-semibold",
      label,
    };
  }
  return {
    isOverdue: false,
    isUrgent: false,
    badgeClass:
      "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/80",
    label: null,
  };
}

const CARRIERS = [
  "GHTK",
  "Viettel Post",
  "J&T Express",
  "Shopee Xpress",
  "VNPost",
  "Grab / Ahamove",
  "Giao Hàng Nhanh (GHN)",
  "Khác",
];

const CONTENT_TYPES = [
  "Review sản phẩm",
  "Video lồng ghép / Tài trợ",
  "Livestream",
  "Bài viết / Hình ảnh",
  "Story / Reels ngắn",
  "Khác",
];

const KANBAN_STAGES: BookingStatus[] = [
  "contacted",
  "confirmed",
  "sample_sent",
  "sample_delivered",
  "draft_submitted",
  "posted",
  "completed",
  "cancelled",
];

function formatVND(amount: number): string {
  if (!amount && amount !== 0) return "0\u00A0đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0đ";
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export default function BookingsClient({
  initialBookings,
  initialKols = [],
  initialProducts = [],
  campaigns,
}: BookingsClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [kols, setKols] = useState<Kol[]>(initialKols);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [deadlineFilter, setDeadlineFilter] = useState<"all" | "urgent" | "overdue">("all");

  // Drag and Drop state
  const [draggingBookingId, setDraggingBookingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<BookingStatus | null>(null);

  // Background non-blocking load for modal dropdown lists
  useEffect(() => {
    let isMounted = true;
    if (initialKols.length === 0 || initialProducts.length === 0) {
      Promise.all([getKols(), getProducts()]).then(([kolsRes, prodsRes]) => {
        if (!isMounted) return;
        if (kolsRes.data && kolsRes.data.length > 0) {
          setKols(kolsRes.data);
        }
        if (prodsRes.data && prodsRes.data.length > 0) {
          setProducts(prodsRes.data);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [initialKols.length, initialProducts.length]);

  // Inspection Drawer
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "shipping" | "deadlines" | "history">("overview");
  const [auditHistory, setAuditHistory] = useState<BookingStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
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

  // Delete State
  const [confirmDeleteBooking, setConfirmDeleteBooking] = useState<Booking | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Escape key handler for drawer & modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDeleteBooking) setConfirmDeleteBooking(null);
        else if (isModalOpen) setIsModalOpen(false);
        else if (detailBooking) setDetailBooking(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDeleteBooking, isModalOpen, detailBooking]);

  // Metrics
  const metrics = useMemo(() => {
    const total = bookings.length;
    const inPipeline = bookings.filter((b) =>
      ["contacted", "confirmed"].includes(b.status)
    ).length;
    const inProduction = bookings.filter((b) =>
      ["sample_sent", "sample_delivered", "draft_submitted"].includes(b.status)
    ).length;
    const publishedAndDone = bookings.filter((b) =>
      ["posted", "completed"].includes(b.status)
    ).length;
    const totalFee = bookings.reduce(
      (acc, b) => acc + (Number(b.booking_fee) || 0),
      0
    );
    const totalPaid = bookings.reduce(
      (acc, b) => acc + (Number(b.paid_amount) || 0),
      0
    );
    return { total, inPipeline, inProduction, publishedAndDone, totalFee, totalPaid };
  }, [bookings]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (campaignFilter !== "all" && b.campaign_id !== campaignFilter) return false;
      if (paymentFilter !== "all" && b.payment_status !== paymentFilter) return false;

      if (deadlineFilter !== "all") {
        const deadline = getDeadlineStatus(b.expected_post_at);
        if (deadlineFilter === "urgent" && !deadline.isUrgent) return false;
        if (deadlineFilter === "overdue" && !deadline.isOverdue) return false;
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
  }, [bookings, statusFilter, campaignFilter, paymentFilter, deadlineFilter, searchQuery]);

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

  // Open Add Modal
  const handleOpenAdd = async () => {
    let currentKols = kols;
    let currentProducts = products;
    if (currentKols.length === 0 || currentProducts.length === 0) {
      const [kolsRes, prodsRes] = await Promise.all([getKols(), getProducts()]);
      if (kolsRes.data && kolsRes.data.length > 0) {
        currentKols = kolsRes.data;
        setKols(kolsRes.data);
      }
      if (prodsRes.data && prodsRes.data.length > 0) {
        currentProducts = prodsRes.data;
        setProducts(prodsRes.data);
      }
    }

    setEditingBooking(null);
    setFormData({
      kol_id: currentKols[0]?.id || "",
      product_id: currentProducts[0]?.id || "",
      campaign_id: campaigns[0]?.id || "",
      code: "",
      content_type: "Review sản phẩm",
      booking_fee: 0,
      commission_rate: currentProducts[0]?.default_commission_rate || 0,
      ads_rate: currentProducts[0]?.default_ads_rate || 0,
      status: "contacted",
      sample_product_notes: "",
      sample_sent_at: "",
      sample_expected_at: "",
      sample_delivered_at: "",
      sample_tracking_code: "",
      sample_carrier: "GHTK",
      recipient_name: currentKols[0]?.display_name || currentKols[0]?.username || "",
      recipient_phone: currentKols[0]?.contact_phone || "",
      recipient_address: currentKols[0]?.address || "",
      video_reminder_at: "",
      expected_post_at: "",
      payment_status: "unpaid",
      paid_amount: 0,
      notes: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (b: Booking) => {
    setEditingBooking(b);
    setFormData({
      kol_id: b.kol_id,
      product_id: b.product_id || "",
      campaign_id: b.campaign_id || "",
      code: b.code || "",
      content_type: b.content_type || "Review sản phẩm",
      booking_fee: b.booking_fee,
      commission_rate: b.commission_rate,
      ads_rate: b.ads_rate,
      status: b.status,
      sample_product_notes: b.sample_product_notes || "",
      sample_sent_at: b.sample_sent_at ? b.sample_sent_at.slice(0, 10) : "",
      sample_expected_at: b.sample_expected_at || "",
      sample_delivered_at: b.sample_delivered_at ? b.sample_delivered_at.slice(0, 10) : "",
      sample_tracking_code: b.sample_tracking_code || "",
      sample_carrier: b.sample_carrier || "GHTK",
      recipient_name: b.recipient_name || "",
      recipient_phone: b.recipient_phone || "",
      recipient_address: b.recipient_address || "",
      video_reminder_at: b.video_reminder_at || "",
      expected_post_at: b.expected_post_at || "",
      payment_status: b.payment_status,
      paid_amount: b.paid_amount,
      notes: b.notes || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle KOL change in form (auto-fill recipient info)
  const handleKolChange = (kolId: string) => {
    const selectedKol = kols.find((k) => k.id === kolId);
    setFormData((prev) => ({
      ...prev,
      kol_id: kolId,
      recipient_name: prev.recipient_name || selectedKol?.display_name || selectedKol?.username || "",
      recipient_phone: prev.recipient_phone || selectedKol?.contact_phone || "",
      recipient_address: prev.recipient_address || selectedKol?.address || "",
    }));
  };

  // Handle Product change in form (auto-fill rates)
  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    setFormData((prev) => ({
      ...prev,
      product_id: productId,
      commission_rate: selectedProduct ? selectedProduct.default_commission_rate : prev.commission_rate,
      ads_rate: selectedProduct ? selectedProduct.default_ads_rate : prev.ads_rate,
    }));
  };

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.kol_id) {
      setFormError("Vui lòng chọn KOL hợp tác.");
      return;
    }

    startTransition(async () => {
      if (editingBooking) {
        const res = await updateBooking(editingBooking.id, formData);
        if (res.error) {
          setFormError(res.error);
        } else if (res.data) {
          setBookings((prev) =>
            prev.map((item) => (item.id === editingBooking.id ? res.data! : item))
          );
          if (detailBooking?.id === editingBooking.id) {
            setDetailBooking(res.data);
          }
          setIsModalOpen(false);
        }
      } else {
        const res = await createBooking(formData);
        if (res.error) {
          setFormError(res.error);
        } else if (res.data) {
          setBookings((prev) => [res.data!, ...prev]);
          setIsModalOpen(false);
        }
      }
    });
  };

  // Quick Status Transition (respecting the branching model)
  const handleAdvanceStatus = (bookingId: string, nextStatus: BookingStatus) => {
    setActionError(null);
    startTransition(async () => {
      const res = await updateBookingStatus(bookingId, nextStatus);
      if (res.error) {
        setActionError(res.error);
      } else if (res.data) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? res.data! : b))
        );
        if (detailBooking?.id === bookingId) {
          setDetailBooking(res.data);
          // Refresh audit history
          loadHistory(bookingId);
        }
      }
    });
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDraggingBookingId(id);
  };

  const handleDragOver = (e: React.DragEvent, stage: BookingStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stage: BookingStatus) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: BookingStatus) => {
    e.preventDefault();
    setDragOverStage(null);
    const id = e.dataTransfer.getData("text/plain") || draggingBookingId;
    setDraggingBookingId(null);
    if (!id) return;

    const booking = bookings.find((b) => b.id === id);
    if (!booking || booking.status === targetStage) return;

    handleAdvanceStatus(id, targetStage);
  };

  const handleDragEnd = () => {
    setDraggingBookingId(null);
    setDragOverStage(null);
  };

  // Open Detail Inspector
  const handleOpenDetail = (booking: Booking) => {
    setDetailBooking(booking);
    setDetailTab("overview");
    loadHistory(booking.id);
  };

  const loadHistory = async (bookingId: string) => {
    setLoadingHistory(true);
    const res = await getBookingStatusHistory(bookingId);
    setLoadingHistory(false);
    if (res.data) {
      setAuditHistory(res.data);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = () => {
    if (!confirmDeleteBooking) return;
    setActionError(null);
    setDeletingId(confirmDeleteBooking.id);

    startTransition(async () => {
      const res = await deleteBooking(confirmDeleteBooking.id);
      setDeletingId(null);
      if (res.error) {
        setActionError(res.error);
      } else {
        setBookings((prev) =>
          prev.filter((b) => b.id !== confirmDeleteBooking.id)
        );
        if (detailBooking?.id === confirmDeleteBooking.id) {
          setDetailBooking(null);
        }
        setConfirmDeleteBooking(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Quản lý Booking & Hợp tác
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Workflow Trung Tâm
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Kết nối KOL, Sản phẩm, Chiến dịch và điều phối toàn bộ tiến độ hợp tác.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Tạo Booking mới
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
            Tổng Bookings
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {metrics.total}
            </span>
            <span className="text-xs text-zinc-400">hợp đồng</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 block">
            Đang đàm phán / Chốt
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {metrics.inPipeline}
            </span>
            <span className="text-xs text-zinc-400">giai đoạn đầu</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 block">
            Gửi mẫu & Sản xuất
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {metrics.inProduction}
            </span>
            <span className="text-xs text-zinc-400">đang làm video</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block">
            Đã đăng & Hoàn thành
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {metrics.publishedAndDone}
            </span>
            <span className="text-xs text-zinc-400">thành công</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
            Tổng ngân sách Booking
          </span>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-50 truncate block">
              {formatVND(metrics.totalFee)}
            </span>
            <span className="text-[11px] text-zinc-400 block mt-0.5">
              Đã chi: {formatVND(metrics.totalPaid)}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & View Toggle */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Kanban Pipeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Danh sách Bảng
            </button>
          </div>
        </div>

        {/* Dropdown Filters & Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Bộ lọc:</span>

          {/* Status Filter - Only shown in Table mode */}
          {viewMode === "table" && (
            <div className="min-w-[180px]">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as BookingStatus | "all")}
                options={[
                  { value: "all", label: `Tất cả trạng thái (${bookings.length})` },
                  ...KANBAN_STAGES.map((st) => ({
                    value: st,
                    label: STATUS_CONFIG[st].label,
                    dot: STATUS_CONFIG[st].dot,
                  })),
                ]}
              />
            </div>
          )}

          {/* Campaign Filter */}
          <div className="min-w-[170px]">
            <CustomSelect
              value={campaignFilter}
              onChange={(val) => setCampaignFilter(val)}
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
              onChange={(val) => setPaymentFilter(val as PaymentStatus | "all")}
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
              onClick={() => setDeadlineFilter("all")}
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
              onClick={() => setDeadlineFilter("urgent")}
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
              onClick={() => setDeadlineFilter("overdue")}
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
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition ml-auto cursor-pointer"
            >
              <span>✕ Đặt lại bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Không tìm thấy booking nào
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {bookings.length === 0
              ? "Bạn chưa có booking nào. Hãy tạo booking đầu tiên để bắt đầu quản lý hợp tác KOL."
              : "Không có kết quả khớp với tiêu chí tìm kiếm và bộ lọc hiện tại."}
          </p>
          {bookings.length === 0 && (
            <button
              onClick={handleOpenAdd}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition"
            >
              + Tạo Booking đầu tiên
            </button>
          )}
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN PIPELINE BOARD */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1980px]">
            {KANBAN_STAGES.map((stageKey) => {
              const stageConfig = STATUS_CONFIG[stageKey];
              const stageBookings = filteredBookings.filter((b) => b.status === stageKey);
              const stageTotalAmount = stageBookings.reduce((sum, b) => sum + (Number(b.booking_fee) || 0), 0);
              const isDragOver = dragOverStage === stageKey;

              return (
                <div
                  key={stageKey}
                  onDragOver={(e) => handleDragOver(e, stageKey)}
                  onDragLeave={(e) => handleDragLeave(e, stageKey)}
                  onDrop={(e) => handleDrop(e, stageKey)}
                  className={`flex-1 flex flex-col rounded-2xl p-3 min-w-[235px] max-w-[265px] transition-all duration-200 ${
                    isDragOver
                      ? "bg-indigo-50/80 dark:bg-indigo-950/30 border-2 border-dashed border-indigo-500 scale-[1.01]"
                      : "bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800"
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stageConfig.dot}`} />
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {stageConfig.label}
                      </span>
                      {stageKey === "draft_submitted" && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300 font-semibold shrink-0">
                          Tùy chọn
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 ml-1">
                      {stageBookings.length}
                    </span>
                  </div>

                  {/* Column Total Value */}
                  {stageTotalAmount > 0 && (
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium pb-2 flex items-center justify-between">
                      <span>Tổng giá trị:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatVND(stageTotalAmount)}
                      </span>
                    </div>
                  )}

                  {/* Cards List / Empty Dropzone */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                    {stageBookings.length === 0 ? (
                      <div
                        className={`h-32 flex flex-col items-center justify-center rounded-xl border border-dashed text-center p-3 transition-colors ${
                          isDragOver
                            ? "border-indigo-400 bg-indigo-100/40 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-medium"
                            : "border-zinc-300/80 dark:border-zinc-700/80 text-zinc-400 dark:text-zinc-500"
                        }`}
                      >
                        <span className="text-base mb-1">{isDragOver ? "📥" : "📋"}</span>
                        <p className="text-[11px] font-medium">
                          {isDragOver ? "Thả vào đây" : "Kéo thẻ vào đây"}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {isDragOver ? `Chuyển sang ${stageConfig.label}` : "hoặc tạo booking mới"}
                        </p>
                      </div>
                    ) : (
                      stageBookings.map((b) => {
                        const deadline = getDeadlineStatus(b.expected_post_at);
                        const isDraggingThis = draggingBookingId === b.id;
                        const paymentCfg = PAYMENT_CONFIG[b.payment_status] || PAYMENT_CONFIG.unpaid;
                        const remainingPayment = Math.max(0, (Number(b.booking_fee) || 0) - (Number(b.paid_amount) || 0));

                        return (
                          <div
                            key={b.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, b.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleOpenDetail(b)}
                            className={`p-3 rounded-xl bg-white dark:bg-zinc-900 border transition shadow-xs hover:shadow cursor-grab active:cursor-grabbing space-y-2.5 group relative ${
                              isDraggingThis
                                ? "opacity-40 border-indigo-400 scale-95"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                            }`}
                          >
                            {/* Header: Code & Payment Status */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0">
                                {b.code || "BK-TEMP"}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex items-center gap-1.5 shrink-0 ${paymentCfg.bg}`}
                                title={paymentCfg.label}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${paymentCfg.dot}`} />
                                <span>{paymentCfg.shortLabel || paymentCfg.label}</span>
                              </span>
                            </div>

                            {/* KOL Info */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xs shrink-0">
                                {b.kol?.username?.charAt(0).toUpperCase() || "K"}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {b.kol?.display_name || b.kol?.username || "Chưa gán KOL"}
                                </p>
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                                  {b.kol?.platform && <PlatformIcon platform={b.kol.platform} size="xs" />}
                                  <span className="truncate">@{b.kol?.username || "unknown"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Product & Campaign */}
                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] space-y-1">
                              {b.product && (
                                <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                                  <span className="text-zinc-400 shrink-0 text-xs">📦</span>
                                  <span className="truncate font-medium">{b.product.name}</span>
                                </div>
                              )}
                              {b.campaign && (
                                <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                                  <span className="text-zinc-400 shrink-0 text-xs">🎯</span>
                                  <span className="truncate">{b.campaign.name}</span>
                                </div>
                              )}
                            </div>

                            {/* Financials Summary: Remaining Payment to be paid */}
                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                              <span
                                className="text-xs font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap shrink-0"
                                title={
                                  b.paid_amount > 0
                                    ? `Còn lại: ${formatVND(remainingPayment)} (Tổng: ${formatVND(b.booking_fee)} • Đã trả: ${formatVND(b.paid_amount)})`
                                    : `Tổng phí: ${formatVND(b.booking_fee)}`
                                }
                              >
                                {b.payment_status === "paid" || remainingPayment === 0 ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Đã thanh toán</span>
                                ) : (
                                  formatVND(remainingPayment)
                                )}
                              </span>

                              {((b.commission_rate && b.commission_rate > 0) || (b.ads_rate && b.ads_rate > 0)) && (
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap shrink-0 flex items-center gap-1">
                                  {b.commission_rate > 0 && <span>{b.commission_rate}% HH</span>}
                                  {b.commission_rate > 0 && b.ads_rate > 0 && (
                                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                  )}
                                  {b.ads_rate > 0 && <span>{b.ads_rate}% Ads</span>}
                                </div>
                              )}
                            </div>

                            {/* Logistics Pill (if tracking code exists) */}
                            {b.sample_tracking_code && (
                              <div className="text-[10px] px-2 py-1 rounded-md bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 truncate flex items-center gap-1.5">
                                <span className="shrink-0">🚚</span>
                                <span className="truncate font-medium">{b.sample_carrier || "GHTK"}: {b.sample_tracking_code}</span>
                              </div>
                            )}

                            {/* Deadlines Tag with Balanced Spacing */}
                            {b.expected_post_at && (
                              <div className={`text-[11px] px-2.5 py-1.5 rounded-lg flex items-center justify-between gap-2 border ${deadline.badgeClass}`}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="shrink-0">⏱️</span>
                                  <span className="truncate font-medium">{formatDate(b.expected_post_at)}</span>
                                </div>
                                {deadline.label && (
                                  <span className="shrink-0 text-[10px] font-semibold whitespace-nowrap">
                                    {deadline.label}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Quick Branching Action Buttons on Card */}
                            <div
                              className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Next logic depending on stage */}
                              {stageKey === "contacted" && (
                                <button
                                  onClick={() => handleAdvanceStatus(b.id, "confirmed")}
                                  className="w-full py-1 px-2 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 text-[11px] font-semibold transition"
                                >
                                  Chốt deal &rarr;
                                </button>
                              )}

                              {stageKey === "confirmed" && (
                                <button
                                  onClick={() => handleAdvanceStatus(b.id, "sample_sent")}
                                  className="w-full py-1 px-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 text-[11px] font-semibold transition"
                                >
                                  Đã gửi mẫu &rarr;
                                </button>
                              )}

                              {stageKey === "sample_sent" && (
                                <button
                                  onClick={() => handleAdvanceStatus(b.id, "sample_delivered")}
                                  className="w-full py-1 px-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 text-[11px] font-semibold transition"
                                >
                                  Đã nhận mẫu &rarr;
                                </button>
                              )}

                              {/* BRANCHING: sample_delivered -> posted (direct) OR draft_submitted */}
                              {stageKey === "sample_delivered" && (
                                <div className="w-full flex flex-col gap-1">
                                  <button
                                    onClick={() => handleAdvanceStatus(b.id, "posted")}
                                    className="w-full py-1 px-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-semibold transition text-left flex items-center justify-between"
                                  >
                                    <span>🚀 Đăng video ngay</span>
                                    <span>&rarr;</span>
                                  </button>
                                  <button
                                    onClick={() => handleAdvanceStatus(b.id, "draft_submitted")}
                                    className="w-full py-1 px-2 rounded-lg bg-fuchsia-50 text-fuchsia-700 hover:bg-fuchsia-100 dark:bg-fuchsia-950/60 dark:text-fuchsia-300 text-[10px] font-semibold transition text-left flex items-center justify-between"
                                  >
                                    <span>📝 Duyệt nháp trước</span>
                                    <span>&rarr;</span>
                                  </button>
                                </div>
                              )}

                              {stageKey === "draft_submitted" && (
                                <button
                                  onClick={() => handleAdvanceStatus(b.id, "posted")}
                                  className="w-full py-1 px-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 text-[11px] font-semibold transition"
                                >
                                  Duyệt & Đã lên video &rarr;
                                </button>
                              )}

                              {stageKey === "posted" && (
                                <button
                                  onClick={() => handleAdvanceStatus(b.id, "completed")}
                                  className="w-full py-1 px-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 text-[11px] font-semibold transition"
                                >
                                  Hoàn tất nghiệm thu &rarr;
                                </button>
                              )}

                              {stageKey === "completed" && (
                                <span className="w-full text-center py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  ✓ Đã hoàn tất
                                </span>
                              )}

                              {stageKey === "cancelled" && (
                                <button
                                  onClick={() => handleAdvanceStatus(b.id, "contacted")}
                                  className="w-full py-1 px-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 text-[11px] font-semibold transition"
                                >
                                  Mở lại booking
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã & Định dạng</th>
                  <th className="py-3.5 px-4">KOL / KOC</th>
                  <th className="py-3.5 px-4">Sản phẩm & Chiến dịch</th>
                  <th className="py-3.5 px-4">Trạng thái Workflow</th>
                  <th className="py-3.5 px-4">Vận chuyển Mẫu</th>
                  <th className="py-3.5 px-4">Hạn làm video</th>
                  <th className="py-3.5 px-4">Chi phí & Thanh toán</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => handleOpenDetail(b)}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Code & Content type */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 block">
                        {b.code || "BK-TEMP"}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {b.content_type || "Review sản phẩm"}
                      </span>
                    </td>

                    {/* KOL */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {b.kol?.username?.charAt(0).toUpperCase() || "K"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {b.kol?.display_name || b.kol?.username || "Chưa gán"}
                          </p>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                            {b.kol?.platform && <PlatformIcon platform={b.kol.platform} size="xs" />}
                            <span>@{b.kol?.username}</span>
                            {b.kol?.platform && <span>• <span className="capitalize">{b.kol.platform}</span></span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Product & Campaign */}
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {b.product?.name || "Chưa chọn SP"}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {b.campaign?.name || "Không thuộc CD"}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          STATUS_CONFIG[b.status].badgeBg
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[b.status].dot}`} />
                        {STATUS_CONFIG[b.status].label}
                      </span>
                    </td>

                    {/* Logistics */}
                    <td className="py-3.5 px-4 text-xs text-zinc-600 dark:text-zinc-300">
                      {b.sample_tracking_code ? (
                        <div>
                          <span className="font-mono font-medium block">
                            {b.sample_tracking_code}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {b.sample_carrier || "GHTK"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">Chưa gửi</span>
                      )}
                    </td>

                    {/* Deadlines */}
                    <td className="py-3.5 px-4 text-xs">
                      {b.expected_post_at ? (
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 block">
                            {formatDate(b.expected_post_at)}
                          </span>
                          {b.video_reminder_at && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400">
                              Nhắc: {formatDate(b.video_reminder_at)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">Chưa hẹn</span>
                      )}
                    </td>

                    {/* Financials & Payment */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 block">
                        {formatVND(b.booking_fee)}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mt-0.5 border ${
                          PAYMENT_CONFIG[b.payment_status].bg
                        }`}
                      >
                        {PAYMENT_CONFIG[b.payment_status].label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 px-4 text-right space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                        title="Chỉnh sửa"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmDeleteBooking(b)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                        title="Xóa booking"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL & COLLABORATION INSPECTION DRAWER */}
      {detailBooking && (
        <div
          onClick={() => setDetailBooking(null)}
          className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-zinc-950 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 cursor-default"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                    {detailBooking.code || "Chi tiết Booking"}
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      STATUS_CONFIG[detailBooking.status].badgeBg
                    }`}
                  >
                    {STATUS_CONFIG[detailBooking.status].label}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  KOL: <span className="font-semibold text-zinc-700 dark:text-zinc-300">@{detailBooking.kol?.username}</span> • Tạo ngày {formatDate(detailBooking.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(detailBooking);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => setDetailBooking(null)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Visual Workflow Stepper Bar (Branching Model) */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-2.5">
                Tiến trình phối hợp (Branching Workflow)
              </span>

              {/* Progress visual */}
              <div className="flex items-center justify-between text-xs gap-1">
                {/* 1. Contacted */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      detailBooking.status !== "cancelled"
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-300 text-zinc-600"
                    }`}
                  >
                    1
                  </div>
                  <span className="text-[10px] font-medium mt-1">Liên hệ</span>
                </div>
                <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-700" />

                {/* 2. Confirmed */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      ["confirmed", "sample_sent", "sample_delivered", "draft_submitted", "posted", "completed"].includes(detailBooking.status)
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    2
                  </div>
                  <span className="text-[10px] font-medium mt-1">Chốt deal</span>
                </div>
                <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-700" />

                {/* 3. Sample Sent */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      ["sample_sent", "sample_delivered", "draft_submitted", "posted", "completed"].includes(detailBooking.status)
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-[10px] font-medium mt-1">Gửi mẫu</span>
                </div>
                <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-700" />

                {/* 4. Sample Delivered */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      ["sample_delivered", "draft_submitted", "posted", "completed"].includes(detailBooking.status)
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    4
                  </div>
                  <span className="text-[10px] font-medium mt-1">Nhận mẫu</span>
                </div>
                <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-700" />

                {/* 5. Posted */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      ["posted", "completed"].includes(detailBooking.status)
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    5
                  </div>
                  <span className="text-[10px] font-medium mt-1">Lên video</span>
                </div>
                <div className="flex-1 h-0.5 bg-zinc-200 dark:bg-zinc-700" />

                {/* 6. Completed */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      detailBooking.status === "completed"
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600"
                    }`}
                  >
                    ✓
                  </div>
                  <span className="text-[10px] font-medium mt-1">Hoàn tất</span>
                </div>
              </div>

              {/* Branching Stage Controls */}
              <div className="mt-4 p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
                  Thao tác chuyển trạng thái tiếp theo:
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {detailBooking.status === "contacted" && (
                    <button
                      onClick={() => handleAdvanceStatus(detailBooking.id, "confirmed")}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs"
                    >
                      &rarr; Chốt deal thành công
                    </button>
                  )}

                  {detailBooking.status === "confirmed" && (
                    <button
                      onClick={() => handleAdvanceStatus(detailBooking.id, "sample_sent")}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                    >
                      &rarr; Đã xuất kho & gửi mẫu
                    </button>
                  )}

                  {detailBooking.status === "sample_sent" && (
                    <button
                      onClick={() => handleAdvanceStatus(detailBooking.id, "sample_delivered")}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
                    >
                      &rarr; KOL đã nhận được mẫu
                    </button>
                  )}

                  {detailBooking.status === "sample_delivered" && (
                    <>
                      <button
                        onClick={() => handleAdvanceStatus(detailBooking.id, "posted")}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                      >
                        🚀 Lên video trực tiếp (Bỏ qua duyệt)
                      </button>
                      <button
                        onClick={() => handleAdvanceStatus(detailBooking.id, "draft_submitted")}
                        className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xs font-semibold shadow-xs"
                      >
                        📝 Nhận bản dựng nháp (Cần duyệt)
                      </button>
                    </>
                  )}

                  {detailBooking.status === "draft_submitted" && (
                    <button
                      onClick={() => handleAdvanceStatus(detailBooking.id, "posted")}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                    >
                      &rarr; Duyệt bản dựng & Đã đăng video
                    </button>
                  )}

                  {detailBooking.status === "posted" && (
                    <button
                      onClick={() => handleAdvanceStatus(detailBooking.id, "completed")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                    >
                      &rarr; Nghiệm thu hoàn tất hợp tác
                    </button>
                  )}

                  {detailBooking.status !== "cancelled" && detailBooking.status !== "completed" && (
                    <button
                      onClick={() => handleAdvanceStatus(detailBooking.id, "cancelled")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-rose-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold ml-auto"
                    >
                      ✕ Hủy hợp tác
                    </button>
                  )}

                  {detailBooking.status === "cancelled" && (
                    <button
                      onClick={() => handleAdvanceStatus(detailBooking.id, "contacted")}
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold"
                    >
                      ↺ Mở lại hợp tác (Liên hệ lại)
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6">
              {[
                { id: "overview", label: "Tổng quan & Thương mại" },
                { id: "shipping", label: "Vận chuyển & Mẫu" },
                { id: "deadlines", label: "Mốc thời gian" },
                { id: "history", label: "Lịch sử trạng thái" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setDetailTab(tab.id as typeof detailTab);
                    if (tab.id === "history") {
                      loadHistory(detailBooking.id);
                    }
                  }}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
                    detailTab === tab.id
                      ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Drawer Body Tabs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailTab === "overview" && (
                <div className="space-y-6">
                  {/* KOL Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Thông tin KOL Hợp tác
                    </span>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                          {detailBooking.kol?.display_name || detailBooking.kol?.username}
                        </h4>
                        <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          {detailBooking.kol?.platform && (
                            <PlatformIcon platform={detailBooking.kol.platform} size="xs" />
                          )}
                          <span>
                            @{detailBooking.kol?.username} • Nền tảng:{" "}
                            <span className="capitalize font-medium text-zinc-700 dark:text-zinc-300">
                              {detailBooking.kol?.platform}
                            </span>{" "}
                            • Ngành: {detailBooking.kol?.niche || "Chưa set"}
                          </span>
                        </div>
                      </div>
                      {detailBooking.kol?.channel_url && (
                        <a
                          href={detailBooking.kol.channel_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-indigo-600 dark:text-indigo-400"
                        >
                          Xem kênh &rarr;
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
                      <div>
                        <span className="text-zinc-400 block">SĐT:</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {detailBooking.kol?.contact_phone || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block">Zalo:</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {detailBooking.kol?.contact_zalo || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block">Followers:</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {detailBooking.kol?.followers_count?.toLocaleString() || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commercial Terms */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Điều khoản Thương mại & Thanh toán
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
                        <span className="text-zinc-400 block text-[11px]">Chi phí Booking</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block mt-1">
                          {formatVND(detailBooking.booking_fee)}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
                        <span className="text-zinc-400 block text-[11px]">% Hoa hồng chốt</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block mt-1">
                          {detailBooking.commission_rate}%
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
                        <span className="text-zinc-400 block text-[11px]">% Ngân sách Ads</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block mt-1">
                          {detailBooking.ads_rate}%
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60">
                        <span className="text-zinc-400 block text-[11px]">Đã thanh toán</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                          {formatVND(detailBooking.paid_amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
                      <span className="text-zinc-500">Trạng thái thanh toán:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold border ${
                          PAYMENT_CONFIG[detailBooking.payment_status].bg
                        }`}
                      >
                        {PAYMENT_CONFIG[detailBooking.payment_status].label}
                      </span>
                    </div>

                    {detailBooking.booking_fee > detailBooking.paid_amount && (
                      <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        Còn phải thanh toán: {formatVND(detailBooking.booking_fee - detailBooking.paid_amount)}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {detailBooking.notes && (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                      <span className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block text-[11px]">
                        Ghi chú trao đổi
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200 whitespace-pre-line">
                        {detailBooking.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === "shipping" && (
                <div className="space-y-6">
                  {/* Logistics Tracking Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Thông tin Gửi hàng Mẫu
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-zinc-400 block">Đơn vị vận chuyển:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                          {detailBooking.sample_carrier || "Chưa thiết lập"}
                        </span>
                      </div>

                      <div>
                        <span className="text-zinc-400 block">Mã vận đơn:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            {detailBooking.sample_tracking_code || "Chưa có mã"}
                          </span>
                          {detailBooking.sample_tracking_code && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(detailBooking.sample_tracking_code!);
                                alert("Đã sao chép mã vận đơn!");
                              }}
                              className="text-[11px] text-indigo-600 hover:underline"
                            >
                              Sao chép
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-zinc-400 block">Ngày gửi hàng:</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {formatDate(detailBooking.sample_sent_at)}
                        </span>
                      </div>

                      <div>
                        <span className="text-zinc-400 block">Ngày dự kiến nhận:</span>
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {formatDate(detailBooking.sample_expected_at)}
                        </span>
                      </div>

                      <div>
                        <span className="text-zinc-400 block">Ngày KOL nhận thực tế:</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatDate(detailBooking.sample_delivered_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recipient Card */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
                    <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                      Địa chỉ nhận hàng của KOL
                    </span>
                    <div>
                      <span className="text-zinc-400 block">Người nhận:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {detailBooking.recipient_name || "—"} ({detailBooking.recipient_phone || "Chưa có SĐT"})
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Địa chỉ:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {detailBooking.recipient_address || "Chưa có địa chỉ"}
                      </span>
                    </div>
                    {detailBooking.sample_product_notes && (
                      <div>
                        <span className="text-zinc-400 block">Chi tiết mẫu gửi kèm:</span>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {detailBooking.sample_product_notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailTab === "deadlines" && (
                <div className="space-y-6 text-xs">
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <span className="font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                      Mốc Thời gian & Deadline Video
                    </span>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          Hạn chót đăng video
                        </span>
                        <span className="text-zinc-500 text-[11px]">
                          Deadline cam kết của KOL lên video chính thức
                        </span>
                      </div>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {formatDate(detailBooking.expected_post_at)}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          Mốc nhắc nhở video
                        </span>
                        <span className="text-zinc-500 text-[11px]">
                          Mốc thời gian chủ động nhắn tin giục tiến độ KOL
                        </span>
                      </div>
                      <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {formatDate(detailBooking.video_reminder_at)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === "history" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Audit Log — Vết lịch sử trạng thái
                    </span>
                    <button
                      onClick={() => loadHistory(detailBooking.id)}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Làm mới
                    </button>
                  </div>

                  {loadingHistory ? (
                    <div className="p-6 text-center text-xs text-zinc-400">
                      Đang tải lịch sử...
                    </div>
                  ) : auditHistory.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      Chưa có thay đổi trạng thái nào được ghi nhận.
                    </div>
                  ) : (
                    <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800 pl-7">
                      {auditHistory.map((h) => (
                        <div key={h.id} className="relative text-xs">
                          <div className="absolute -left-7 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white dark:ring-zinc-950" />
                          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                {h.from_status ? (
                                  <>
                                    <span className="text-zinc-400">{STATUS_CONFIG[h.from_status]?.label || h.from_status}</span>
                                    {" → "}
                                  </>
                                ) : (
                                  "Khởi tạo → "
                                )}
                                <span className={STATUS_CONFIG[h.to_status]?.text || ""}>
                                  {STATUS_CONFIG[h.to_status]?.label || h.to_status}
                                </span>
                              </span>
                              <span className="text-[11px] text-zinc-400 font-mono">
                                {new Date(h.created_at).toLocaleString("vi-VN")}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              Người thực hiện: {h.profiles?.full_name || "Tự động / Hệ thống"}
                            </div>
                            {h.note && (
                              <p className="text-zinc-700 dark:text-zinc-300 italic pt-1">
                                &quot;{h.note}&quot;
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT BOOKING MODAL */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
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
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg"
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition disabled:opacity-50"
                >
                  {isPending ? "Đang lưu..." : editingBooking ? "Cập nhật Booking" : "Tạo Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDeleteBooking && (
        <div
          onClick={() => setConfirmDeleteBooking(null)}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 cursor-default"
          >
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Xác nhận xóa Booking?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Bạn có chắc chắn muốn xóa hợp tác{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {confirmDeleteBooking.code}
              </span>{" "}
              với KOL{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                @{confirmDeleteBooking.kol?.username}
              </span>
              ? Mọi dữ liệu liên quan sẽ bị xóa và không thể khôi phục.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={Boolean(deletingId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
              >
                {deletingId ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
