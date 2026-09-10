export interface NicheDefinition {
  id: string;
  label: string;
  icon: string;
  badgeClass: string;
  dotClass: string;
  description?: string;
}

export const POPULAR_NICHES: NicheDefinition[] = [
  {
    id: "lam-dep",
    label: "Làm đẹp",
    icon: "💄",
    badgeClass:
      "bg-pink-50 text-pink-700 border-pink-200/80 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60",
    dotClass: "bg-pink-500 dark:bg-pink-400",
    description: "Skincare, Mỹ phẩm, Chăm sóc sắc đẹp",
  },
  {
    id: "thoi-trang",
    label: "Thời trang",
    icon: "👗",
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
    dotClass: "bg-purple-500 dark:bg-purple-400",
    description: "Quần áo, Phụ kiện, Phối đồ & Xu hướng",
  },
  {
    id: "am-thuc",
    label: "Ẩm thực",
    icon: "🍜",
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    dotClass: "bg-amber-500 dark:bg-amber-400",
    description: "Review quán, Nấu ăn, Đồ uống & F&B",
  },
  {
    id: "cong-nghe",
    label: "Công nghệ",
    icon: "💻",
    badgeClass:
      "bg-cyan-50 text-cyan-800 border-cyan-200/80 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60",
    dotClass: "bg-cyan-500 dark:bg-cyan-400",
    description: "Review điện thoại, Laptop, Đồ gia dụng hi-tech",
  },
  {
    id: "me-be",
    label: "Mẹ & Bé",
    icon: "🍼",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    dotClass: "bg-rose-500 dark:bg-rose-400",
    description: "Bỉm sữa, Nuôi dạy con, Đồ chơi & Chăm sóc trẻ",
  },
  {
    id: "suc-khoe-fitness",
    label: "Sức khỏe & Fitness",
    icon: "🏋️",
    badgeClass:
      "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    dotClass: "bg-emerald-500 dark:bg-emerald-400",
    description: "Gym, Yoga, Dinh dưỡng & Thực phẩm bổ sung",
  },
  {
    id: "doi-song",
    label: "Đời sống",
    icon: "🌿",
    badgeClass:
      "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60",
    dotClass: "bg-teal-500 dark:bg-teal-400",
    description: "Daily vlog, Phong cách sống & Tâm sự",
  },
  {
    id: "nha-cua-doi-song",
    label: "Nhà cửa & Đời sống",
    icon: "🏠",
    badgeClass:
      "bg-orange-50 text-orange-800 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60",
    dotClass: "bg-orange-500 dark:bg-orange-400",
    description: "Decor phòng, Đồ gia dụng thông minh, Nội thất",
  },
  {
    id: "du-lich",
    label: "Du lịch",
    icon: "✈️",
    badgeClass:
      "bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
    dotClass: "bg-sky-500 dark:bg-sky-400",
    description: "Check-in, Khách sạn, Trải nghiệm văn hóa",
  },
  {
    id: "giai-tri",
    label: "Giải trí",
    icon: "🎬",
    badgeClass:
      "bg-yellow-50 text-yellow-800 border-yellow-200/80 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800/60",
    dotClass: "bg-yellow-500 dark:bg-yellow-400",
    description: "Hài hước, Diễn xuất, Parody & Clip viral",
  },
  {
    id: "giao-duc",
    label: "Giáo dục",
    icon: "📚",
    badgeClass:
      "bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60",
    dotClass: "bg-blue-500 dark:bg-blue-400",
    description: "Ngoại ngữ, Kỹ năng mềm, Sách & Kiến thức",
  },
  {
    id: "tai-chinh",
    label: "Tài chính & Kinh doanh",
    icon: "💰",
    badgeClass:
      "bg-lime-50 text-lime-800 border-lime-200/80 dark:bg-lime-950/40 dark:text-lime-300 dark:border-lime-800/60",
    dotClass: "bg-lime-600 dark:bg-lime-400",
    description: "Đầu tư, Khởi nghiệp, Quản lý tài chính cá nhân",
  },
  {
    id: "game-esports",
    label: "Game & Esports",
    icon: "🎮",
    badgeClass:
      "bg-violet-50 text-violet-800 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/60",
    dotClass: "bg-violet-500 dark:bg-violet-400",
    description: "Streamer, Gaming, Review game & Phụ kiện",
  },
  {
    id: "thu-cung",
    label: "Thú cưng",
    icon: "🐾",
    badgeClass:
      "bg-amber-50 text-amber-900 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800/60",
    dotClass: "bg-amber-600 dark:bg-amber-400",
    description: "Chó mèo, Thú nuôi & Phụ kiện chăm sóc thú",
  },
  {
    id: "xe-co",
    label: "Xe cộ",
    icon: "🚗",
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-300/80 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    dotClass: "bg-slate-500 dark:bg-slate-400",
    description: "Ô tô, Xe máy, Độ xe & Trải nghiệm lái",
  },
  {
    id: "khac",
    label: "Khác",
    icon: "🏷️",
    badgeClass:
      "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    dotClass: "bg-zinc-400 dark:bg-zinc-500",
    description: "Lĩnh vực chuyên biệt hoặc chưa phân loại",
  },
];

// Fallback palette for arbitrary custom user inputs
const FALLBACK_COLOR_PALETTES = [
  {
    badgeClass:
      "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
    dotClass: "bg-indigo-500 dark:bg-indigo-400",
  },
  {
    badgeClass:
      "bg-pink-50 text-pink-700 border-pink-200/80 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/60",
    dotClass: "bg-pink-500 dark:bg-pink-400",
  },
  {
    badgeClass:
      "bg-teal-50 text-teal-800 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60",
    dotClass: "bg-teal-500 dark:bg-teal-400",
  },
  {
    badgeClass:
      "bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    dotClass: "bg-amber-500 dark:bg-amber-400",
  },
  {
    badgeClass:
      "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60",
    dotClass: "bg-purple-500 dark:bg-purple-400",
  },
  {
    badgeClass:
      "bg-cyan-50 text-cyan-800 border-cyan-200/80 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60",
    dotClass: "bg-cyan-500 dark:bg-cyan-400",
  },
  {
    badgeClass:
      "bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    dotClass: "bg-emerald-500 dark:bg-emerald-400",
  },
  {
    badgeClass:
      "bg-orange-50 text-orange-800 border-orange-200/80 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60",
    dotClass: "bg-orange-500 dark:bg-orange-400",
  },
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Returns badge styling info (badgeClass, dotClass, icon, label) for any niche string.
 */
export function getNicheStyle(nicheName: string): {
  badgeClass: string;
  dotClass: string;
  icon?: string;
  label: string;
} {
  const trimmed = nicheName.trim();
  if (!trimmed) {
    return {
      badgeClass:
        "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
      dotClass: "bg-zinc-400",
      label: trimmed,
    };
  }

  const normalized = normalizeText(trimmed);

  // Exact or close match in POPULAR_NICHES
  const found = POPULAR_NICHES.find((item) => {
    const normItem = normalizeText(item.label);
    return (
      normItem === normalized ||
      normalized.includes(normItem) ||
      normItem.includes(normalized)
    );
  });

  if (found) {
    return {
      badgeClass: found.badgeClass,
      dotClass: found.dotClass,
      icon: found.icon,
      label: trimmed,
    };
  }

  // Deterministic fallback color for custom niches
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash << 5) - hash + trimmed.charCodeAt(i);
    hash |= 0;
  }
  const paletteIndex = Math.abs(hash) % FALLBACK_COLOR_PALETTES.length;
  const palette = FALLBACK_COLOR_PALETTES[paletteIndex];

  return {
    badgeClass: palette.badgeClass,
    dotClass: palette.dotClass,
    label: trimmed,
  };
}
