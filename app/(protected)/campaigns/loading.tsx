const STATUS_FILTER_LABELS = [
  "Tất cả",
  "Đang chạy",
  "Lập kế hoạch",
  "Tạm dừng",
  "Đã hoàn thành",
];

export default function CampaignsLoading() {
  return (
    <div className="space-y-4 pb-24">

      {/* Metric Cards - Static Labels with pulse only for values */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Tổng chiến dịch
          </span>
          <div className="mt-1 h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Đang chạy
          </span>
          <div className="mt-1 h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Tổng ngân sách
          </span>
          <div className="mt-1 h-8 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Đã hoàn thành
          </span>
          <div className="mt-1 h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Filter and Search Bar - Static Shell */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
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
            placeholder="Tìm kiếm theo tên chiến dịch, kỳ chạy, ghi chú..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-transparent rounded-xl text-sm placeholder-zinc-400 focus:outline-none"
          />
        </div>

        {/* Status Filter Tabs - Static Shell */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {STATUS_FILTER_LABELS.map((label, idx) => (
            <span
              key={label}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-default ${
                idx === 0
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Campaigns Table - Exact Static Table Shell with Skeletons inside tbody ONLY */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50/75 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Tên chiến dịch</th>
                <th className="py-3.5 px-4">Kỳ chạy / Thời gian</th>
                <th className="py-3.5 px-4">Ngân sách</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4 space-y-1.5">
                    <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-850 rounded" />
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap space-y-1">
                    <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-36 bg-zinc-100 dark:bg-zinc-850 rounded" />
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <div className="h-7 w-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
                      <div className="h-7 w-7 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
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
