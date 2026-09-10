import type { BookingStatus, PaymentStatus } from "@/lib/types/booking";

export type ColumnId =
  | "code"
  | "kol"
  | "product"
  | "status"
  | "logistics"
  | "deadline"
  | "fee"
  | "payment"
  | "recipient"
  | "performance"
  | "notes"
  | "actions";

export interface ColumnDefinition {
  id: ColumnId;
  label: string;
  shortLabel?: string;
  description: string;
  defaultVisible: boolean;
  required?: boolean; // Cannot be hidden (e.g. kol, actions)
  minWidth?: string;
}

export const AVAILABLE_COLUMNS: ColumnDefinition[] = [
  {
    id: "code",
    label: "Mã & Định dạng",
    shortLabel: "Mã BK",
    description: "Mã định danh hợp đồng booking & loại nội dung hợp tác",
    defaultVisible: true,
    minWidth: "140px",
  },
  {
    id: "kol",
    label: "KOL / KOC",
    shortLabel: "KOL",
    description: "Tên hiển thị, kênh, nền tảng và SĐT liên hệ của KOL",
    defaultVisible: true,
    required: true,
    minWidth: "190px",
  },
  {
    id: "product",
    label: "Sản phẩm & Chiến dịch",
    shortLabel: "Sản phẩm",
    description: "Sản phẩm mẫu và chiến dịch tháng tương ứng",
    defaultVisible: true,
    minWidth: "190px",
  },
  {
    id: "status",
    label: "Trạng thái quy trình",
    shortLabel: "Trạng thái",
    description: "Tiến độ hợp tác (8 bước: liên hệ, chốt, mẫu, duyệt, đăng, xong)",
    defaultVisible: true,
    required: true,
    minWidth: "160px",
  },
  {
    id: "logistics",
    label: "Hậu cần & Vận đơn",
    shortLabel: "Vận đơn",
    description: "Hãng bưu cục, mã vận đơn và link tra cứu đơn hàng trực tiếp",
    defaultVisible: true,
    minWidth: "180px",
  },
  {
    id: "deadline",
    label: "Hạn lên video",
    shortLabel: "Deadline",
    description: "Ngày dự kiến lên bài, cảnh báo trễ deadline hoặc khẩn cấp",
    defaultVisible: true,
    minWidth: "150px",
  },
  {
    id: "fee",
    label: "Chi phí & Hoa hồng",
    shortLabel: "Chi phí",
    description: "Mức phí booking thỏa thuận và % hoa hồng affiliate",
    defaultVisible: true,
    minWidth: "150px",
  },
  {
    id: "payment",
    label: "Thanh toán & Đã chi",
    shortLabel: "Thanh toán",
    description: "Tình trạng thanh toán, số tiền đã trả và công nợ còn lại",
    defaultVisible: true,
    minWidth: "160px",
  },
  {
    id: "recipient",
    label: "Người nhận hàng",
    shortLabel: "Người nhận",
    description: "Họ tên, SĐT và địa chỉ nhận mẫu của KOL",
    defaultVisible: false,
    minWidth: "220px",
  },
  {
    id: "performance",
    label: "Hiệu quả video",
    shortLabel: "Lượt xem",
    description: "Lượt views, tương tác từ video đã gắn link",
    defaultVisible: false,
    minWidth: "140px",
  },
  {
    id: "notes",
    label: "Ghi chú nhanh",
    shortLabel: "Ghi chú",
    description: "Ghi chú nội bộ cho booking này",
    defaultVisible: false,
    minWidth: "160px",
  },
  {
    id: "actions",
    label: "Thao tác",
    shortLabel: "",
    description: "Xem chi tiết, nhân bản hoặc xóa",
    defaultVisible: true,
    required: true,
    minWidth: "90px",
  },
];

export type ViewPreset = "compact" | "logistics" | "finance" | "all";

export const VIEW_PRESETS: Record<
  ViewPreset,
  { label: string; icon: string; description: string; columns: ColumnId[] }
> = {
  compact: {
    label: "Rút gọn",
    icon: "⚡",
    description: "Tập trung KOL, trạng thái, deadline và chi phí",
    columns: ["code", "kol", "status", "deadline", "fee", "actions"],
  },
  logistics: {
    label: "Vận hành",
    icon: "🚚",
    description: "Tập trung bưu cục, mã vận đơn, địa chỉ giao hàng và hạn bài",
    columns: ["code", "kol", "product", "status", "logistics", "recipient", "deadline", "actions"],
  },
  finance: {
    label: "Tài chính",
    icon: "💰",
    description: "Tập trung chi phí, hoa hồng, tình trạng thanh toán và công nợ",
    columns: ["code", "kol", "product", "status", "fee", "payment", "performance", "actions"],
  },
  all: {
    label: "Đầy đủ",
    icon: "📋",
    description: "Hiển thị toàn bộ thông tin chi tiết",
    columns: [
      "code",
      "kol",
      "product",
      "status",
      "logistics",
      "deadline",
      "fee",
      "payment",
      "recipient",
      "performance",
      "notes",
      "actions",
    ],
  },
};

export type BookingViewMode = "table" | "kanban" | "analytics";

export type SortField =
  | "expected_post_at"
  | "booking_fee"
  | "created_at"
  | "kol_name"
  | "status";
export type SortDirection = "asc" | "desc";

export const CARRIERS = [
  "GHTK",
  "Viettel Post",
  "Giao Hàng Nhanh (GHN)",
  "Shopee Xpress",
  "J&T Express",
  "VNPost",
  "Grab / Ahamove",
  "Khác",
];

export function getCarrierTrackingUrl(
  carrier?: string | null,
  trackingCode?: string | null
): string | null {
  if (!trackingCode || !trackingCode.trim()) return null;
  const code = trackingCode.trim();
  const c = (carrier || "").toLowerCase();

  if (c.includes("ghtk") || c.includes("tiết kiệm")) {
    return `https://khachhang.ghtk.vn/tra-cuu-don-hang?tracking=${encodeURIComponent(code)}`;
  }
  if (c.includes("viettel")) {
    return `https://viettelpost.vn/tra-cuu-hanh-trinh-don/?order_number=${encodeURIComponent(code)}`;
  }
  if (c.includes("ghn") || c.includes("nhanh")) {
    return `https://donhang.ghn.vn/?order_code=${encodeURIComponent(code)}`;
  }
  if (c.includes("shopee") || c.includes("spx")) {
    return `https://spx.vn/track?${encodeURIComponent(code)}`;
  }
  if (c.includes("j&t") || c.includes("jt")) {
    return `https://jtexpress.vn/vi/tracking?type=track&billcode=${encodeURIComponent(code)}`;
  }
  if (c.includes("vnpost") || c.includes("bưu điện")) {
    return `https://mpt.vnpost.vn/tra-cuu/buu-gui?buugui=${encodeURIComponent(code)}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent((carrier ? carrier + " " : "") + code)}`;
}

export function formatVND(amount: number): string {
  if (!amount && amount !== 0) return "0\u00A0đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + "\u00A0đ";
}

export function formatDate(dateStr?: string | null): string {
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

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}
