const TASK_TABS = [
  "Tất cả",
  "Chờ xử lý",
  "Đã hoàn thành",
  "Quá hạn",
  "Đã hủy",
];

export default function TasksLoading() {
  return (
    <div className="space-y-6 px-3 sm:px-5 py-3 pb-24">
      {/* 1. Metrics Cards — Static labels & colored accents matching TasksClient */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Tasks */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Tổng công việc
            </span>
            <span className="w-2 h-2 rounded-full bg-zinc-400 opacity-70" />
          </div>
          <div className="mt-2 h-8 w-12 bg-zinc-200/80 dark:bg-white/[0.08] rounded-md animate-pulse" />
        </div>

        {/* Pending Tasks */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Chờ xử lý
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-2 h-8 w-12 bg-amber-200/60 dark:bg-amber-500/20 rounded-md animate-pulse" />
        </div>

        {/* Completed Tasks */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Đã hoàn thành
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 h-8 w-12 bg-emerald-200/60 dark:bg-emerald-500/20 rounded-md animate-pulse" />
        </div>

        {/* Overdue Tasks */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Quá hạn
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="mt-2 h-8 w-12 bg-rose-200/60 dark:bg-rose-500/20 rounded-md animate-pulse" />
        </div>
      </div>

      {/* 2. Filter Toolbar — Static Shell */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#111218] p-3 rounded-xl border border-zinc-200/80 dark:border-white/[0.08] shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {TASK_TABS.map((tab, idx) => (
            <span
              key={tab}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-default ${
                idx === 0
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <span>{tab}</span>
            </span>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            readOnly
            placeholder="Tìm theo tên, mã booking, KOL..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Tasks Table — Static thead with Skeletons inside tbody ONLY */}
      <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/70 dark:bg-white/[0.02] border-b border-zinc-200/70 dark:border-white/[0.06] text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Công việc</th>
                <th className="py-3 px-4">Loại</th>
                <th className="py-3 px-4">Hợp tác</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.06]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="h-3.5 w-44 bg-zinc-200/80 dark:bg-white/[0.08] rounded" />
                      <div className="h-2.5 w-28 bg-zinc-100 dark:bg-white/[0.04] rounded" />
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="h-5 w-20 bg-zinc-100 dark:bg-white/[0.04] rounded-md" />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="h-3.5 w-24 bg-zinc-200/80 dark:bg-white/[0.08] rounded font-mono" />
                      <div className="h-2.5 w-16 bg-zinc-100 dark:bg-white/[0.04] rounded" />
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="h-4 w-24 bg-zinc-200/70 dark:bg-white/[0.06] rounded" />
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="h-5 w-20 bg-zinc-100 dark:bg-white/[0.04] rounded-full" />
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <div className="h-6 w-20 bg-zinc-100 dark:bg-white/[0.04] rounded-lg" />
                      <div className="h-6 w-6 bg-zinc-100 dark:bg-white/[0.04] rounded-lg" />
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
