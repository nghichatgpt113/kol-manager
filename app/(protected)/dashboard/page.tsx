import { getDashboardData } from "@/lib/services/dashboard";
import Link from "next/link";
import DashboardFloatingAction from "@/components/dashboard-floating-action";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const dashboardRes = await getDashboardData();

  if (dashboardRes.error || !dashboardRes.data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300">
        <h2 className="text-sm font-bold">Không thể tải dữ liệu Tổng quan</h2>
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
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
  } = dashboardRes.data;

  return (
    <div className="space-y-6 px-3 sm:px-5 py-3 pb-24">
      {/* Unified KPI Summary Block */}
      <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 divide-x-0 sm:divide-x divide-zinc-200/60 dark:divide-white/[0.06]">
          {/* Metric 1: Total Bookings */}
          <Link
            href="/bookings"
            className="group p-4 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Tổng hợp tác
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 opacity-80" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 tabular-nums">
                {metrics.totalBookings.toLocaleString("vi-VN")}
              </span>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Toàn bộ chiến dịch
              </p>
            </div>
          </Link>

          {/* Metric 2: Active Bookings */}
          <Link
            href="/bookings"
            className="group p-4 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Đang thực hiện
              </span>
              <span className="w-2 h-2 rounded-full bg-sky-500 opacity-80" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-sky-600 dark:text-sky-400 tabular-nums">
                {metrics.activeBookings.toLocaleString("vi-VN")}
              </span>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Tiến độ đang chạy
              </p>
            </div>
          </Link>

          {/* Metric 3: Posted Videos */}
          <Link
            href="/bookings"
            className="group p-4 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Video đã lên
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 opacity-80" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                {metrics.postedVideos.toLocaleString("vi-VN")}
              </span>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Hoàn tất đăng bài
              </p>
            </div>
          </Link>

          {/* Metric 4: Upcoming Deadlines */}
          <Link
            href="/bookings"
            className="group p-4 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Sắp đến hạn
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500 opacity-80" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
                {metrics.upcomingDeadlines.toLocaleString("vi-VN")}
              </span>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Lịch đăng trong tuần
              </p>
            </div>
          </Link>

          {/* Metric 5: Pending Tasks */}
          <Link
            href="/tasks"
            className="group p-4 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Việc chờ xử lý
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-500 opacity-80" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 tabular-nums">
                {metrics.pendingTasks.toLocaleString("vi-VN")}
              </span>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                Nhiệm vụ vận hành
              </p>
            </div>
          </Link>

          {/* Metric 6: Total KOLs */}
          <Link
            href="/kols"
            className="group p-4 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Nhà sáng tạo
              </span>
              <span className="w-2 h-2 rounded-full bg-zinc-400 opacity-60" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 tabular-nums">
                {metrics.totalKols.toLocaleString("vi-VN")}
              </span>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                KOL trong danh bạ
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Attention & Deadlines Grid (Overdue vs Upcoming) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Overdue Bookings */}
        <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Hợp tác quá hạn
              </h3>
              {metrics.overdueBookings > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 tabular-nums">
                  {metrics.overdueBookings}
                </span>
              )}
            </div>

            <Link
              href="/bookings"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {overdueBookings.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Không có hợp tác nào quá hạn.
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Tất cả các booking đều đảm bảo tiến độ đăng video.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-lg border border-zinc-200/70 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-zinc-300 dark:hover:border-white/15 transition"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {b.kol?.display_name || b.kol?.username || "Chưa xác định"}
                      </span>
                      {b.kol?.username && (
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                          @{b.kol.username}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="truncate max-w-[180px]">
                        {b.product?.name || "Sản phẩm chưa gán"}
                      </span>
                      {b.code && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-zinc-400">{b.code}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-white/[0.06]">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 tabular-nums">
                      Quá {b.daysOverdue} ngày
                    </span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                      Hạn: {b.formattedExpectedPostAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Deadline sắp tới
              </h3>
              {metrics.upcomingDeadlines > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 tabular-nums">
                  {metrics.upcomingDeadlines}
                </span>
              )}
            </div>

            <Link
              href="/bookings"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Không có deadline nào trong những ngày tới.
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Các lịch đăng bài mới sẽ hiển thị tại đây khi được lên lịch.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingBookings.map((b) => {
                const badgeStyle =
                  b.urgencyLevel === "today"
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-900/50"
                    : b.urgencyLevel === "tomorrow"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-900/50"
                    : "bg-zinc-100 dark:bg-white/[0.06] text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-white/[0.08]";

                return (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg border border-zinc-200/70 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-zinc-300 dark:hover:border-white/15 transition"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                          {b.kol?.display_name || b.kol?.username || "Chưa xác định"}
                        </span>
                        {b.kol?.username && (
                          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                            @{b.kol.username}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="truncate max-w-[180px]">
                          {b.product?.name || "Sản phẩm chưa gán"}
                        </span>
                        {b.code && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-zinc-400">{b.code}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-white/[0.06]">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border tabular-nums ${badgeStyle}`}>
                        {b.urgencyText}
                      </span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                        {b.formattedExpectedPostAt}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Booking Status Pipeline */}
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
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Tổng cộng: <strong className="text-zinc-900 dark:text-zinc-100 tabular-nums">{metrics.totalBookings}</strong> hợp tác
          </span>
        </div>

        {/* Slim Progress Bar */}
        <div className="h-2 w-full bg-zinc-100 dark:bg-white/[0.06] rounded-full overflow-hidden flex">
          {statusDistribution.map((item) => {
            if (item.count === 0) return null;
            return (
              <div
                key={item.status}
                className={`${item.bgClass} transition-all duration-300`}
                style={{ width: `${item.percentage}%` }}
                title={`${item.label}: ${item.count} (${item.percentage}%)`}
              />
            );
          })}
        </div>

        {/* Status Stages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1">
          {statusDistribution.map((item) => (
            <div
              key={item.status}
              className={`p-2.5 rounded-lg border transition-colors ${
                item.count > 0
                  ? "border-zinc-200/90 dark:border-white/[0.1] bg-white dark:bg-white/[0.02]"
                  : "border-zinc-100 dark:border-white/[0.04] bg-zinc-50/40 dark:bg-transparent opacity-60"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${item.dotClass}`} />
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-base font-bold tabular-nums ${item.count > 0 ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-400"}`}>
                  {item.count}
                </span>
                <span className="text-[10px] text-zinc-400 tabular-nums">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Operations & Activity (Tasks + Recent Videos) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending Tasks */}
        <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Công việc chờ xử lý
              </h3>
              {metrics.pendingTasks > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 tabular-nums">
                  {metrics.pendingTasks}
                </span>
              )}
            </div>

            <Link
              href="/tasks"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition flex items-center gap-1"
            >
              <span>Quản lý</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {pendingTasks.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Không có công việc đang chờ xử lý.
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Tất cả các đầu việc vận hành đều đã được hoàn tất.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-zinc-200/70 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-white/15 transition"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-400 border border-zinc-200/70 dark:border-white/[0.08]">
                        {t.typeLabel}
                      </span>
                      {t.isOverdue && (
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          Quá hạn
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {t.title}
                    </h4>
                    {t.booking && (
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                        Booking: <span className="font-mono text-zinc-600 dark:text-zinc-300">{t.booking.code || "Booking"}</span>
                        {t.booking.kol ? ` (@${t.booking.kol.username})` : ""}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Hạn</span>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                      {t.formattedDueAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Videos */}
        <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Video mới đăng
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 tabular-nums">
                {metrics.postedVideos} video
              </span>
            </div>

            <Link
              href="/bookings"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition flex items-center gap-1"
            >
              <span>Xem booking</span>
              <span>&rarr;</span>
            </Link>
          </div>

          {recentVideos.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Chưa có video nào hoàn thành đăng tải.
              </p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                Khi KOL đăng video và cập nhật link, video sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentVideos.map((v) => (
                <div
                  key={v.id}
                  className="p-3 rounded-lg border border-zinc-200/70 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-white/15 transition"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {v.booking?.kol?.display_name || v.booking?.kol?.username || "KOL"}
                      </span>
                      {v.booking?.kol?.username && (
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                          @{v.booking.kol.username}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="truncate max-w-[180px]">
                        {v.booking?.product?.name || "Sản phẩm"}
                      </span>
                      {v.booking?.code && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-zinc-400">{v.booking.code}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Đăng ngày</span>
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                        {v.formattedPostedAt}
                      </span>
                    </div>

                    {v.video_url && (
                      <a
                        href={v.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:opacity-90 transition shadow-2xs"
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

      {/* Floating Action Bar */}
      <DashboardFloatingAction />
    </div>
  );
}
