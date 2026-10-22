import { TEMPLATE_CATEGORIES, type TemplateCategory } from "@/lib/types/template";

const CATEGORY_DOTS: Record<TemplateCategory, string> = {
  invitation: "bg-blue-500",
  confirmation: "bg-emerald-500",
  brief: "bg-purple-500",
  sample_sent: "bg-amber-500",
  video_reminder: "bg-rose-500",
  ads_code_request: "bg-sky-500",
  feedback: "bg-fuchsia-500",
  general: "bg-zinc-500",
};

export default function TemplatesLoading() {
  return (
    <div className="space-y-6 px-3 sm:px-5 py-3 pb-24">
      {/* Filter and Search Bar — 100% Static Shell matching TemplatesClient */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative max-w-md">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
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
            placeholder="Tìm kiếm văn mẫu theo tiêu đề, nội dung, danh mục..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
        </div>

        {/* Category Pills — Exact 9 pills from TEMPLATE_CATEGORIES with colored dots */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm cursor-default">
            Tất cả
          </span>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <span
              key={cat.value}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 cursor-default"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOTS[cat.value]}`} />
              <span>{cat.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="group relative flex flex-col justify-between p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm animate-pulse min-h-[220px]"
          >
            <div>
              {/* Category Badge & Action icons */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="h-6 w-28 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex items-center gap-1">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800/60" />
                </div>
              </div>

              {/* Title & Preview */}
              <div className="space-y-2 mt-2">
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="space-y-1.5 pt-1">
                  <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                  <div className="h-3 w-5/6 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                  <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                </div>
              </div>
            </div>

            {/* Bottom: Copy Button */}
            <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
              <div className="h-8 w-28 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
