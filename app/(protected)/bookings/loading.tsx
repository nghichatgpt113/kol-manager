const KANBAN_STAGES_CONFIG = [
  { key: "contacted", label: "Đang liên hệ", dot: "bg-amber-500" },
  { key: "confirmed", label: "Đã chốt deal", dot: "bg-sky-500" },
  { key: "sample_sent", label: "Đã gửi mẫu", dot: "bg-indigo-500" },
  { key: "sample_delivered", label: "Đã nhận mẫu", dot: "bg-purple-500" },
  { key: "draft_submitted", label: "Duyệt nháp", dot: "bg-fuchsia-500", isOptional: true },
  { key: "posted", label: "Đã lên video", dot: "bg-blue-500" },
  { key: "completed", label: "Hoàn tất", dot: "bg-emerald-500" },
  { key: "cancelled", label: "Hủy hợp tác", dot: "bg-zinc-400" },
];

export default function BookingsLoading() {
  return (
    <div className="space-y-6">
      {/* Top Banner & Title - Static */}
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
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Tạo Booking mới
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip - Static Labels with pulse values only */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
            Tổng Bookings
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <span className="text-xs text-zinc-400">hợp đồng</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 block">
            Đang đàm phán / Chốt
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <span className="text-xs text-zinc-400">giai đoạn đầu</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 block">
            Gửi mẫu & Sản xuất
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <span className="text-xs text-zinc-400">đang làm video</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block">
            Đã đăng & Hoàn thành
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <span className="text-xs text-zinc-400">thành công</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 block">
            Tổng ngân sách Booking
          </span>
          <div className="mt-2">
            <div className="h-7 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse" />
            <div className="mt-1 h-3.5 w-20 bg-zinc-100 dark:bg-zinc-850 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & View Toggle - Static Shell */}
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
              readOnly
              placeholder="Tìm theo mã booking, KOL, sản phẩm, mã vận đơn, người nhận..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none"
            />
          </div>

          {/* View Mode Toggle - Static */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 self-start md:self-auto">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-xs cursor-default">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Kanban Pipeline
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-400 cursor-default">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Danh sách Bảng
            </span>
          </div>
        </div>

        {/* Filters Strip - Static Shell */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          {/* Quick Deadline Filter Pills */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mr-1 flex items-center gap-1">
              <span>⏱️</span>
              <span className="hidden sm:inline">Hạn đăng:</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
              Tất cả hạn
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Sắp đến hạn
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              Quá hạn
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />

          {/* Select Filter Shells */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
              Tất cả chiến dịch
            </span>
            <span className="px-3 py-1.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
              Tất cả thanh toán
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Pipeline Board - Exact Static Columns with Card Skeletons inside */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1980px]">
          {KANBAN_STAGES_CONFIG.map((col) => (
            <div
              key={col.key}
              className="flex-1 flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-3 min-w-[235px] max-w-[265px]"
            >
              {/* Column Header - Static */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {col.label}
                  </span>
                  {col.isOptional && (
                    <span className="text-[10px] px-1 rounded bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300 font-semibold">
                      Tùy chọn
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  -
                </span>
              </div>

              {/* Cards List Skeleton inside column */}
              <div className="flex-1 space-y-3 pr-0.5">
                {[1, 2].map((cardIdx) => (
                  <div
                    key={cardIdx}
                    className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-2.5 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-3.5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-4 w-12 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-4 w-32 bg-zinc-300 dark:bg-zinc-700 rounded" />
                      <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                      <div className="h-3.5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3.5 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
