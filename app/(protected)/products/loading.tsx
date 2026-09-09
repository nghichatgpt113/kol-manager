export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      {/* Header - Static */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Danh mục Sản phẩm
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Quản lý danh mục sản phẩm tiếp thị, giá vốn hàng mẫu và tỷ lệ hoa hồng/ngân sách quảng cáo mặc định.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm sản phẩm mới
        </button>
      </div>

      {/* Filter & Search Bar - Static Shell */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
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
            placeholder="Tìm theo tên sản phẩm, thương hiệu, mã SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-hidden"
          />
        </div>

        {/* Status Tabs - Static Shell */}
        <div className="flex items-center gap-1">
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-default">
            Tất cả
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-default">
            Đang hoạt động
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-default">
            Đã lưu trữ
          </span>
        </div>
      </div>

      {/* Table Container - Exact Static Table Shell with Skeletons inside tbody ONLY */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Sản phẩm</th>
                <th className="px-6 py-3.5">Mã SKU / Thương hiệu</th>
                <th className="px-6 py-3.5">Giá vốn mẫu</th>
                <th className="px-6 py-3.5">Hoa hồng (%)</th>
                <th className="px-6 py-3.5">Định mức Ads (%)</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="space-y-1.5">
                      <div className="h-4 w-44 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-850 rounded" />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-y-1">
                    <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-850 rounded" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-6 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
                      <div className="h-6 w-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
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
