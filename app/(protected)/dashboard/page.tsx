import { getCurrentProfile } from "@/lib/auth/server";
import { getDashboardData } from "@/lib/services/dashboard";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [{ user, profile, error: authError }, dashboardRes] = await Promise.all([
    getCurrentProfile(),
    getDashboardData(),
  ]);

  if (authError || !user) {
    redirect("/login");
  }

  if (dashboardRes.error || !dashboardRes.data) {
    return (
      <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200">
        <h2 className="text-lg font-bold">Không thể tải dữ liệu Tổng quan</h2>
        <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
          {dashboardRes.error || "Đã xảy ra lỗi khi kết nối tới cơ sở dữ liệu."}
        </p>
      </div>
    );
  }

  const {
    metrics,
    statusDistribution,
    overdueBookings,
    upcomingBookings,
    pendingTasks,
    recentVideos,
    currentDateFormatted,
  } = dashboardRes.data;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Tổng quan
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              {currentDateFormatted}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Theo dõi tình hình hợp tác KOL và các công việc cần xử lý.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-right hidden sm:block">
            <span className="text-zinc-500 block">Đang đăng nhập:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {profile?.full_name || user.email}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Supabase Live
          </span>
        </div>
      </div>

      {/* 2. Quick Actions */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mr-1">
          Thao tác nhanh:
        </span>
        <Link
          href="/kols"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition shadow-2xs cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Thêm KOL
        </Link>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-purple-500 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition shadow-2xs cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo hợp tác
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-teal-500 dark:hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition shadow-2xs cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Thêm sản phẩm
        </Link>
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-amber-500 dark:hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition shadow-2xs cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Tạo công việc
        </Link>
        <Link
          href="/templates"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 hover:border-pink-500 dark:hover:border-pink-500 hover:text-pink-600 dark:hover:text-pink-400 transition shadow-2xs cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Thêm văn mẫu
        </Link>
      </div>

      {/* 3. Section A — Summary Metrics (6 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1: Total KOLs */}
        <Link
          href="/kols"
          className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              KOL
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              {metrics.totalKols.toLocaleString("vi-VN")}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Nhà sáng tạo</p>
          </div>
        </Link>

        {/* Metric 2: Total Bookings */}
        <Link
          href="/bookings"
          className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 transition shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Hợp tác
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              {metrics.totalBookings.toLocaleString("vi-VN")}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Tổng hợp tác</p>
          </div>
        </Link>

        {/* Metric 3: Active Bookings */}
        <Link
          href="/bookings"
          className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 transition shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Đang thực hiện
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
              {metrics.activeBookings.toLocaleString("vi-VN")}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Hợp tác đang chạy</p>
          </div>
        </Link>

        {/* Metric 4: Posted Videos */}
        <Link
          href="/bookings"
          className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Video đã đăng
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {metrics.postedVideos.toLocaleString("vi-VN")}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Video đã lên sóng</p>
          </div>
        </Link>

        {/* Metric 5: Upcoming Deadlines */}
        <Link
          href="/bookings"
          className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-600 transition shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Sắp đến hạn
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {metrics.upcomingDeadlines.toLocaleString("vi-VN")}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Hạn đăng sắp tới</p>
          </div>
        </Link>

        {/* Metric 6: Pending Tasks */}
        <Link
          href="/tasks"
          className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-rose-400 dark:hover:border-rose-600 transition shadow-2xs hover:shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Việc chờ xử lý
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
              {metrics.pendingTasks.toLocaleString("vi-VN")}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Công việc đang chờ</p>
          </div>
        </Link>
      </div>

      {/* 4. Attention & Deadlines Grid (Overdue + Upcoming) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section D — Overdue Bookings */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Hợp tác cần chú ý (Quá hạn)
                  {metrics.overdueBookings > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                      {metrics.overdueBookings}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-500">
                  Hợp tác chưa hoàn tất đã quá ngày dự kiến đăng video
                </p>
              </div>
            </div>

            <Link
              href="/bookings"
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {overdueBookings.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Không có hợp tác nào đang quá hạn.
              </p>
              <p className="text-xs text-zinc-400">
                Tất cả các booking đều đảm bảo tiến độ hoặc đã đăng video đúng hạn.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {overdueBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-rose-200 dark:hover:border-rose-800"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {b.kol?.display_name || b.kol?.username || "Chưa xác định"}
                      </span>
                      {b.kol?.username && (
                        <span className="text-[11px] text-zinc-500 font-mono">
                          @{b.kol.username}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                        {b.statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="truncate max-w-[220px]">
                        {b.product?.name || "Sản phẩm chưa gán"}
                      </span>
                      {b.code && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-zinc-400">
                            {b.code}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-rose-200/50">
                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200">
                      Quá hạn {b.daysOverdue} ngày
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Hạn: {b.formattedExpectedPostAt}
                    </span>
                  </div>
                </div>
              ))}

              {metrics.overdueBookings > overdueBookings.length && (
                <div className="pt-2 text-center">
                  <Link
                    href="/bookings"
                    className="text-xs text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 font-medium"
                  >
                    Xem thêm {metrics.overdueBookings - overdueBookings.length} hợp tác quá hạn khác &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section C — Upcoming Deadlines */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Deadline sắp tới
                  {metrics.upcomingDeadlines > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      {metrics.upcomingDeadlines}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-500">
                  Các hợp tác đang chờ đăng video sắp tới hạn
                </p>
              </div>
            </div>

            <Link
              href="/bookings"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Không có deadline nào sắp tới.
              </p>
              <p className="text-xs text-zinc-400">
                Hiện tại không có lịch đăng video nào trong những ngày tới.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingBookings.map((b) => {
                const urgencyBadgeClass =
                  b.urgencyLevel === "today"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 font-bold"
                    : b.urgencyLevel === "tomorrow"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold"
                    : b.urgencyLevel === "approaching"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 font-semibold"
                    : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-medium";

                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-zinc-300 dark:hover:border-zinc-700"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {b.kol?.display_name || b.kol?.username || "Chưa xác định"}
                        </span>
                        {b.kol?.username && (
                          <span className="text-[11px] text-zinc-500 font-mono">
                            @{b.kol.username}
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                          {b.statusLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="truncate max-w-[220px]">
                          {b.product?.name || "Sản phẩm chưa gán"}
                        </span>
                        {b.code && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-zinc-400">
                              {b.code}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-700">
                      <span className={`px-2 py-0.5 rounded-md text-xs ${urgencyBadgeClass}`}>
                        {b.urgencyText}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Ngày: {b.formattedExpectedPostAt}
                      </span>
                    </div>
                  </div>
                );
              })}

              {metrics.upcomingDeadlines > upcomingBookings.length && (
                <div className="pt-2 text-center">
                  <Link
                    href="/bookings"
                    className="text-xs text-zinc-500 hover:text-amber-600 dark:hover:text-amber-400 font-medium"
                  >
                    Xem thêm {metrics.upcomingDeadlines - upcomingBookings.length} deadline sắp tới khác &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Section B — Booking Status Distribution */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Phân bổ trạng thái hợp tác
            </h3>
            <p className="text-xs text-zinc-500">
              Tổng quan tiến độ 8 bước từ liên hệ ban đầu đến hoàn tất
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            Tổng cộng:{" "}
            <span className="text-zinc-900 dark:text-zinc-100 font-bold">
              {metrics.totalBookings} hợp tác
            </span>
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
          {statusDistribution.map((item) => {
            if (item.count === 0) return null;
            return (
              <div
                key={item.status}
                className={`${item.bgClass} transition-all duration-500 relative group`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.label}: ${item.count} (${item.percentage}%)`}
              />
            );
          })}
        </div>

        {/* Status Distribution Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-1">
          {statusDistribution.map((item) => (
            <div
              key={item.status}
              className={`p-3 rounded-xl border transition-all ${
                item.count > 0
                  ? item.borderClass
                  : "border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/40 opacity-70"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-2 h-2 rounded-full ${item.dotClass}`} />
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-lg font-black ${item.count > 0 ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"}`}>
                  {item.count}
                </span>
                <span className="text-[10px] font-medium text-zinc-400">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Operations & Activity Grid (Tasks + Recent Videos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section E — Pending Tasks */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Công việc chờ xử lý
                  {metrics.pendingTasks > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                      {metrics.pendingTasks}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-zinc-500">
                  Đầu việc vận hành cần thực hiện đúng hạn
                </p>
              </div>
            </div>

            <Link
              href="/tasks"
              className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1"
            >
              <span>Quản lý việc</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Không có công việc đang chờ xử lý.
              </p>
              <p className="text-xs text-zinc-400">
                Tất cả các đầu việc đã được giải quyết hoặc chưa có việc mới được tạo.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {t.typeLabel}
                      </span>
                      {t.isOverdue && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          Quá hạn
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {t.title}
                    </h4>
                    {t.booking && (
                      <p className="text-[11px] text-zinc-500 truncate">
                        Hợp tác:{" "}
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                          {t.booking.code || "Booking"}
                        </span>
                        {t.booking.kol ? ` (@${t.booking.kol.username})` : ""}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-medium text-zinc-500 block">
                      Hạn:
                    </span>
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {t.formattedDueAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section F — Recent Videos */}
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Video gần đây
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    {metrics.postedVideos} đã đăng
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Các video mới nhất vừa hoàn thành đăng tải
                </p>
              </div>
            </div>

            <Link
              href="/bookings"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Xem booking</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {recentVideos.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Chưa có video nào được đăng.
              </p>
              <p className="text-xs text-zinc-400">
                Các video đăng tải sẽ xuất hiện tại đây khi KOL hoàn tất đăng bài.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentVideos.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-zinc-300 dark:hover:border-zinc-700"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {v.booking?.kol?.display_name || v.booking?.kol?.username || "KOL"}
                      </span>
                      {v.booking?.kol?.username && (
                        <span className="text-[11px] text-zinc-500 font-mono">
                          @{v.booking.kol.username}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        Đã đăng
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="truncate max-w-[200px]">
                        {v.booking?.product?.name || "Sản phẩm"}
                      </span>
                      {v.booking?.code && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-zinc-400">
                            {v.booking.code}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-700">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-zinc-500 block">
                        Ngày đăng:
                      </span>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        {v.formattedPostedAt}
                      </span>
                    </div>

                    {v.video_url && (
                      <a
                        href={v.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition shadow-2xs"
                      >
                        <span>Xem</span>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
