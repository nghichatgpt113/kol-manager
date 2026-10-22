export default function BookingsLoading() {
  return (
    <div className="w-full flex flex-col pb-24">
      {/* UNIFIED FULL-BLEED WORKSPACE CONTAINER SKELETON */}
      <div className="w-full bg-white dark:bg-zinc-900 border-y border-zinc-200/90 dark:border-zinc-800 shadow-2xs overflow-hidden">
        {/* 1. Integrated Header Toolbar — 100% Static Controls (No unnecessary pulse blocks) */}
        <div className="px-3 py-2 sm:px-4 sm:py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200/90 dark:border-zinc-800 space-y-2">
          {/* Top row: Search, Table Tools, View Mode */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            {/* Search Box */}
            <div className="relative flex-1 max-w-lg">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400"
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
                placeholder="Tìm theo mã booking, KOL, sản phẩm, mã vận đơn, người nhận..."
                className="w-full h-8 pl-8 pr-3 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none shadow-2xs"
              />
            </div>

            {/* View Mode & Table Tools */}
            <div className="flex items-center gap-1.5 self-start md:self-auto shrink-0">
              {/* Quick Add Row Button (Static) */}
              <div className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-2xs">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span>Thêm dòng nhanh</span>
              </div>

              {/* Column Customizer Button (Static) */}
              <div className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/80 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-2xs">
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                  />
                </svg>
                <span>Cột hiển thị</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                  12/12
                </span>
              </div>

              {/* View Mode Toggle (Static with exact icons) */}
              <div className="h-8 flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80">
                <div className="h-7 px-2.5 rounded-md text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Bảng</span>
                </div>
                <div className="h-7 px-2.5 rounded-md text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                    />
                  </svg>
                  <span>Kanban</span>
                </div>
                <div className="h-7 px-2.5 rounded-md text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span>Tiến độ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Second row: Static Filter Controls & Quick Deadline Pills (No pulse blocks) */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider shrink-0">
              Bộ lọc:
            </span>

            {/* Status Filter Static Shell */}
            <div className="min-w-[150px] max-w-[170px]">
              <div className="w-full h-8 px-2.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-50 flex items-center justify-between gap-2 shadow-2xs">
                <span className="truncate font-medium">Tất cả trạng thái</span>
                <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Campaign Filter Static Shell */}
            <div className="min-w-[145px] max-w-[170px]">
              <div className="w-full h-8 px-2.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-50 flex items-center justify-between gap-2 shadow-2xs">
                <span className="truncate font-medium">Tất cả chiến dịch</span>
                <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Payment Filter Static Shell */}
            <div className="min-w-[140px] max-w-[160px]">
              <div className="w-full h-8 px-2.5 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-50 flex items-center justify-between gap-2 shadow-2xs">
                <span className="truncate font-medium">Tất cả thanh toán</span>
                <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Quick Deadline Pills Static Shell */}
            <div className="h-8 flex items-center gap-0.5 p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60 shrink-0">
              <span className="h-7 px-2.5 rounded-md text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs inline-flex items-center">
                Tất cả hạn
              </span>
              <span className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                48h
              </span>
              <span className="h-7 inline-flex items-center gap-1.5 px-2.5 rounded-md text-xs font-semibold text-rose-600 dark:text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Quá hạn
              </span>
            </div>
          </div>
        </div>

        {/* 2. Table Shell — Exact 13 Columns matching VIEW_PRESETS.all.columns */}
        <div className="flex flex-col w-full">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-200px)] min-h-[450px] relative">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-zinc-50/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-zinc-200 dark:border-zinc-800 shadow-2xs select-none">
                <tr className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="py-2 px-2.5 w-9 text-center bg-inherit">
                    <input
                      type="checkbox"
                      disabled
                      className="rounded border-zinc-300 w-3.5 h-3.5 opacity-40 cursor-default"
                    />
                  </th>
                  <th className="py-2 px-2.5 w-[110px] whitespace-nowrap bg-inherit">
                    Mã & Loại
                  </th>
                  <th className="py-2 px-2.5 min-w-[140px] max-w-[180px] whitespace-nowrap bg-inherit">
                    KOL / KOC
                  </th>
                  <th className="py-2 px-2.5 min-w-[150px] max-w-[200px] whitespace-nowrap bg-inherit">
                    Sản phẩm & Chiến dịch
                  </th>
                  <th className="py-2 px-2.5 w-[120px] whitespace-nowrap bg-inherit">
                    Trạng thái
                  </th>
                  <th className="py-2 px-2.5 min-w-[125px] max-w-[160px] whitespace-nowrap bg-inherit">
                    Hậu cần & Vận đơn
                  </th>
                  <th className="py-2 px-2.5 w-[105px] whitespace-nowrap bg-inherit">
                    Hạn video
                  </th>
                  <th className="py-2 px-2.5 w-[100px] whitespace-nowrap bg-inherit">
                    Chi phí & HH
                  </th>
                  <th className="py-2 px-2.5 w-[105px] whitespace-nowrap bg-inherit">
                    Thanh toán
                  </th>
                  <th className="py-2 px-2.5 min-w-[130px] max-w-[170px] whitespace-nowrap bg-inherit">
                    Người nhận hàng
                  </th>
                  <th className="py-2 px-2.5 w-[85px] whitespace-nowrap bg-inherit">
                    Hiệu quả
                  </th>
                  <th className="py-2 px-2.5 min-w-[110px] max-w-[160px] whitespace-nowrap bg-inherit">
                    Ghi chú
                  </th>
                  <th className="py-2 px-2.5 w-[70px] text-right whitespace-nowrap bg-inherit">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-2 px-2.5 text-center">
                      <div className="w-3.5 h-3.5 rounded bg-zinc-200 dark:bg-zinc-800 mx-auto" />
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded font-mono" />
                        <div className="h-3 w-14 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                      </div>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="space-y-1">
                        <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800/50 rounded font-mono" />
                      </div>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                      </div>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="h-6 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="h-5 w-20 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="space-y-1">
                        <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                      </div>
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="h-3.5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="h-3.5 w-20 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Static Pinned Pagination Footer Bar */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 bg-zinc-50/80 dark:bg-zinc-900/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 select-none">
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="inline-flex items-center gap-1.5">
                <span>Hiển thị</span>
                <span className="h-3.5 w-10 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse inline-block" />
                <span>booking</span>
              </div>

              <div className="h-3.5 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">Dòng/trang:</span>
                <span className="text-xs font-semibold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-0.5 text-zinc-800 dark:text-zinc-200">
                  25
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="p-1.5 rounded-lg text-xs font-medium text-zinc-400 opacity-40">«</span>
              <span className="p-1.5 rounded-lg text-xs font-medium text-zinc-400 opacity-40">‹</span>
              <span className="min-w-[28px] h-7 px-2 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs inline-flex items-center justify-center">
                1
              </span>
              <span className="p-1.5 rounded-lg text-xs font-medium text-zinc-400 opacity-40">›</span>
              <span className="p-1.5 rounded-lg text-xs font-medium text-zinc-400 opacity-40">»</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
