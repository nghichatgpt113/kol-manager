import Link from "next/link";
import DashboardFloatingAction from "@/components/dashboard-floating-action";

const STATUS_STAGES = [
  { label: "Đã liên hệ", dot: "bg-sky-500" },
  { label: "Đã xác nhận", dot: "bg-indigo-500" },
  { label: "Đã gửi mẫu", dot: "bg-amber-500" },
  { label: "Đã nhận mẫu", dot: "bg-yellow-500" },
  { label: "Đã gửi draft", dot: "bg-purple-500" },
  { label: "Đã đăng", dot: "bg-emerald-500" },
  { label: "Hoàn tất", dot: "bg-teal-500" },
  { label: "Đã huỷ", dot: "bg-zinc-400" },
];

export default function DashboardLoading() {
  return (
    <div className="space-y-6 px-3 sm:px-5 py-3 pb-24">
      {/* 1. High-Density Unified KPI Summary Block */}
      <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 divide-x-0 sm:divide-x divide-zinc-200/60 dark:divide-white/[0.06]">
          {/* Metric 1 */}
          <Link
            href="/bookings"
            className="p-4 flex flex-col justify-between hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Tổng hợp tác
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 opacity-80" />
            </div>
            <div className="mt-3">
              <div className="h-8 w-16 bg-zinc-200/80 dark:bg-white/[0.08] rounded-md animate-pulse" />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Toàn bộ chiến dịch
              </p>
            </div>
          </Link>

          {/* Metric 2 */}
          <Link
            href="/bookings"
            className="p-4 flex flex-col justify-between hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Đang thực hiện
              </span>
              <span className="w-2 h-2 rounded-full bg-sky-500 opacity-80" />
            </div>
            <div className="mt-3">
              <div className="h-8 w-12 bg-sky-200/60 dark:bg-sky-500/20 rounded-md animate-pulse" />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Tiến độ đang chạy
              </p>
            </div>
          </Link>

          {/* Metric 3 */}
          <Link
            href="/bookings"
            className="p-4 flex flex-col justify-between hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Video đã lên
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 opacity-80" />
            </div>
            <div className="mt-3">
              <div className="h-8 w-12 bg-emerald-200/60 dark:bg-emerald-500/20 rounded-md animate-pulse" />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Hoàn tất đăng bài
              </p>
            </div>
          </Link>

          {/* Metric 4 */}
          <Link
            href="/bookings"
            className="p-4 flex flex-col justify-between hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Sắp đến hạn
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 opacity-80" />
            </div>
            <div className="mt-3">
              <div className="h-8 w-10 bg-amber-200/60 dark:bg-amber-500/20 rounded-md animate-pulse" />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Lịch đăng trong tuần
              </p>
            </div>
          </Link>

          {/* Metric 5 */}
          <Link
            href="/tasks"
            className="p-4 flex flex-col justify-between hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Việc chờ xử lý
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-500 opacity-80" />
            </div>
            <div className="mt-3">
              <div className="h-8 w-10 bg-zinc-200/80 dark:bg-white/[0.08] rounded-md animate-pulse" />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Nhiệm vụ vận hành
              </p>
            </div>
          </Link>

          {/* Metric 6 */}
          <Link
            href="/kols"
            className="p-4 flex flex-col justify-between hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Nhà sáng tạo
              </span>
              <span className="w-2 h-2 rounded-full bg-zinc-400 opacity-60" />
            </div>
            <div className="mt-3">
              <div className="h-8 w-14 bg-zinc-200/80 dark:bg-white/[0.08] rounded-md animate-pulse" />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                KOL trong danh bạ
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 2. Attention & Deadlines Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Overdue Bookings Column */}
        <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Hợp tác quá hạn
              </h3>
            </div>
            <Link
              href="/bookings"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-zinc-200/70 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-pulse"
              >
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="h-3.5 w-32 bg-zinc-200/80 dark:bg-white/[0.08] rounded" />
                  <div className="h-3 w-44 bg-zinc-100 dark:bg-white/[0.04] rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-20 bg-rose-100 dark:bg-rose-950/40 rounded" />
                  <div className="h-3 w-16 bg-zinc-100 dark:bg-white/[0.04] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines Column */}
        <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Deadline sắp tới
              </h3>
            </div>
            <Link
              href="/bookings"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-zinc-200/70 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-pulse"
              >
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="h-3.5 w-32 bg-zinc-200/80 dark:bg-white/[0.08] rounded" />
                  <div className="h-3 w-44 bg-zinc-100 dark:bg-white/[0.04] rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-20 bg-amber-100 dark:bg-amber-950/40 rounded" />
                  <div className="h-3 w-16 bg-zinc-100 dark:bg-white/[0.04] rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Booking Status Pipeline */}
      <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Phân bổ tiến độ hợp tác (Pipeline)
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              Quy trình 8 bước từ liên hệ ban đầu đến hoàn tất
            </p>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium inline-flex items-center gap-1.5">
            <span>Tổng cộng:</span>
            <span className="h-4 w-7 bg-zinc-200/80 dark:bg-white/[0.08] rounded animate-pulse inline-block" />
            <span>hợp tác</span>
          </span>
        </div>

        {/* Progress Bar Skeleton */}
        <div className="h-2 w-full bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden animate-pulse" />

        {/* Status Stages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {STATUS_STAGES.map((item) => (
            <div
              key={item.label}
              className="p-2.5 rounded-lg border border-zinc-200/90 dark:border-white/[0.1] bg-white dark:bg-white/[0.02]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="h-6 w-6 bg-zinc-200/70 dark:bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-7 bg-zinc-100 dark:bg-white/[0.04] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Operations & Activity (Tasks + Recent Videos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Tasks */}
        <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Công việc chờ xử lý
              </h3>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition flex items-center gap-1"
            >
              <span>Quản lý</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-zinc-200/70 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3 animate-pulse"
              >
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="h-4 w-24 bg-zinc-200/70 dark:bg-white/[0.06] rounded" />
                  <div className="h-3.5 w-44 bg-zinc-200/80 dark:bg-white/[0.08] rounded" />
                </div>
                <div className="h-4 w-16 bg-zinc-100 dark:bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Videos */}
        <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Video mới đăng
              </h3>
            </div>
            <Link
              href="/bookings"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition flex items-center gap-1"
            >
              <span>Xem booking</span>
              <span>&rarr;</span>
            </Link>
          </div>

          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-zinc-200/70 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3 animate-pulse"
              >
                <div className="min-w-0 space-y-1.5 flex-1">
                  <div className="h-3.5 w-36 bg-zinc-200/80 dark:bg-white/[0.08] rounded" />
                  <div className="h-3 w-28 bg-zinc-100 dark:bg-white/[0.04] rounded" />
                </div>
                <div className="h-6 w-14 bg-zinc-200/70 dark:bg-white/[0.06] rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <DashboardFloatingAction />
    </div>
  );
}
