import PlatformIcon from "@/components/icons/platform-icon";

const PLATFORMS: { label: string; platform?: string }[] = [
  { label: "Tất cả" },
  { label: "TikTok", platform: "tiktok" },
  { label: "Facebook", platform: "facebook" },
  { label: "Instagram", platform: "instagram" },
  { label: "YouTube", platform: "youtube" },
  { label: "Shopee", platform: "shopee" },
  { label: "Khác", platform: "other" },
];

export default function KolsLoading() {
  return (
    <div className="space-y-4 px-3 sm:px-5 py-3 pb-24">
      {/* Filter & Search Bar — Static Shell */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#111218] p-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] shadow-xs">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            readOnly
            placeholder="Tìm theo username, tên hiển thị, ngành hàng, SĐT..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.08] text-xs focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>

        {/* Platform Tabs — Static Shell */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {PLATFORMS.map((item, idx) => (
            <span
              key={item.label}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-default ${
                idx === 0
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {item.platform && <PlatformIcon platform={item.platform} size="xs" />}
              <span>{item.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Table Container — Static thead with Skeletons inside tbody ONLY */}
      <div className="bg-white dark:bg-[#111218] rounded-xl border border-zinc-200/80 dark:border-white/[0.08] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 dark:bg-white/[0.02] border-b border-zinc-200/70 dark:border-white/[0.06] text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Nhà sáng tạo</th>
                <th className="px-4 py-3">Nền tảng</th>
                <th className="px-4 py-3">Người theo dõi</th>
                <th className="px-4 py-3">Ngành hàng</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.06]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="h-3.5 w-32 bg-zinc-200/80 dark:bg-white/[0.08] rounded" />
                      <div className="h-3 w-20 bg-zinc-100 dark:bg-white/[0.04] rounded font-mono" />
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="h-5 w-16 bg-zinc-200/70 dark:bg-white/[0.06] rounded-full" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="h-4 w-14 bg-zinc-200/70 dark:bg-white/[0.06] rounded" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="h-5 w-20 bg-zinc-100 dark:bg-white/[0.04] rounded-md" />
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    <div className="h-3 w-24 bg-zinc-200/70 dark:bg-white/[0.06] rounded" />
                    <div className="h-3 w-20 bg-zinc-100 dark:bg-white/[0.04] rounded" />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-6 w-10 bg-zinc-100 dark:bg-white/[0.04] rounded-lg" />
                      <div className="h-6 w-10 bg-zinc-100 dark:bg-white/[0.04] rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
