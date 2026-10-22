"use client";

import { useState, useMemo } from "react";
import type { Booking } from "@/lib/types/booking";
import { formatVND } from "./types";

interface BookingsRoiDashboardProps {
  bookings: Booking[];
}

export default function BookingsRoiDashboard({
  bookings,
}: BookingsRoiDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    let totalFee = 0;
    let totalPaid = 0;
    let unpaidBookingsCount = 0;
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalVideos = 0;
    let onTimeBookings = 0;
    let completedOrPostedCount = 0;
    let overdueCount = 0;
    let urgentCount = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (const b of bookings) {
      const fee = Number(b.booking_fee) || 0;
      const paid = Number(b.paid_amount) || 0;
      totalFee += fee;
      totalPaid += paid;

      if (b.payment_status !== "paid" && fee > paid) {
        unpaidBookingsCount++;
      }

      // Check videos
      if (b.videos && Array.isArray(b.videos)) {
        for (const v of b.videos) {
          totalVideos++;
          totalViews += Number(v.views_count) || 0;
          totalLikes += Number(v.likes_count) || 0;
          totalComments += Number(v.comments_count) || 0;
        }
      }

      // Check SLA / Deadlines
      if (["posted", "completed"].includes(b.status)) {
        completedOrPostedCount++;
        // If posted on or before expected_post_at (or if no expected date)
        onTimeBookings++;
      }

      if (b.expected_post_at && !["posted", "completed", "cancelled"].includes(b.status)) {
        const target = new Date(b.expected_post_at);
        target.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          overdueCount++;
        } else if (diffDays <= 2) {
          urgentCount++;
        }
      }
    }

    const unpaidBalance = Math.max(0, totalFee - totalPaid);
    const paidPercentage = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 100;
    const cpv = totalViews > 0 ? Math.round(totalFee / totalViews) : 0;
    const onTimeRate =
      completedOrPostedCount > 0
        ? Math.round((onTimeBookings / completedOrPostedCount) * 100)
        : totalBookings > 0
        ? 100
        : 0;

    return {
      totalBookings,
      totalFee,
      totalPaid,
      unpaidBalance,
      paidPercentage,
      unpaidBookingsCount,
      totalVideos,
      totalViews,
      totalLikes,
      totalComments,
      cpv,
      onTimeRate,
      overdueCount,
      urgentCount,
    };
  }, [bookings]);

  return (
    <div className="rounded-xl bg-white dark:bg-[#111218] border border-zinc-200/80 dark:border-white/[0.08] shadow-xs overflow-hidden transition-all">
      {/* Header bar with toggle */}
      <div className="px-4 py-2.5 bg-zinc-50/60 dark:bg-white/[0.02] border-b border-zinc-200/70 dark:border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Chỉ số tài chính & ROI Booking
          </h2>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium hidden sm:inline">
            (Đồng bộ theo bộ lọc)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!isExpanded && (
            <div className="hidden sm:flex items-center gap-3 text-xs tabular-nums font-mono">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                Ngân sách: {formatVND(stats.totalFee)}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Views: {new Intl.NumberFormat("vi-VN").format(stats.totalViews)}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                CPV: {stats.cpv > 0 ? `${stats.cpv} đ` : "—"}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition cursor-pointer px-2 py-0.5 rounded-md hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
          >
            <span>{isExpanded ? "Thu gọn" : "Mở rộng"}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Grid Content */}
      {isExpanded && (
        <div className="p-3.5 grid grid-cols-2 lg:grid-cols-5 gap-3 animate-in fade-in duration-150">
          {/* 1. Total Fee & Paid */}
          <div className="p-3 rounded-lg bg-zinc-50/60 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Ngân sách Booking
              </span>
              <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-1.5">
              <span className="text-base sm:text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50 block truncate">
                {formatVND(stats.totalFee)}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-white/[0.08] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(100, stats.paidPercentage)}%` }}
                  />
                </div>
                <span className="text-[10px] text-zinc-500 tabular-nums font-semibold">
                  {stats.paidPercentage}%
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 tabular-nums block mt-1">
                Đã chi: {formatVND(stats.totalPaid)}
              </span>
            </div>
          </div>

          {/* 2. Unpaid Balance / Outstanding */}
          <div className="p-3 rounded-lg bg-zinc-50/60 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Công nợ còn lại
              </span>
              <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-1.5">
              <span
                className={`text-base sm:text-lg font-bold tabular-nums block truncate ${
                  stats.unpaidBalance > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatVND(stats.unpaidBalance)}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-1.5">
                {stats.unpaidBookingsCount > 0
                  ? `${stats.unpaidBookingsCount} booking cần tất toán`
                  : "✓ Đã thanh toán đủ"}
              </span>
            </div>
          </div>

          {/* 3. Views & Engagements */}
          <div className="p-3 rounded-lg bg-zinc-50/60 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Tổng Lượt xem
              </span>
              <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="mt-1.5">
              <span className="text-base sm:text-lg font-bold tabular-nums text-indigo-600 dark:text-indigo-400 block truncate">
                {new Intl.NumberFormat("vi-VN").format(stats.totalViews)}
              </span>
              <span className="text-[10px] text-zinc-400 tabular-nums block mt-1.5">
                Từ {stats.totalVideos} video | {new Intl.NumberFormat("vi-VN").format(stats.totalLikes + stats.totalComments)} tương tác
              </span>
            </div>
          </div>

          {/* 4. CPV Efficiency */}
          <div className="p-3 rounded-lg bg-zinc-50/60 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Hiệu quả CPV
              </span>
              <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="mt-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {stats.cpv > 0 ? `${stats.cpv} đ` : "—"}
                </span>
                {stats.cpv > 0 && stats.cpv < 250 && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                    Tối ưu
                  </span>
                )}
              </div>
              <span className="text-[10px] text-zinc-400 tabular-nums block mt-1.5">
                {stats.cpv > 0
                  ? `~${Math.round(stats.cpv * 1000).toLocaleString()} đ / 1k views`
                  : "Chờ dữ liệu video"}
              </span>
            </div>
          </div>

          {/* 5. SLA & Deadlines */}
          <div className="p-3 rounded-lg bg-zinc-50/60 dark:bg-white/[0.02] border border-zinc-200/60 dark:border-white/[0.06] col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Tiến độ & Hạn chót
              </span>
              <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div>
                <span className="text-base sm:text-lg font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {stats.totalBookings}
                </span>
                <span className="text-[11px] text-zinc-400 ml-1">hợp đồng</span>
              </div>
              <div className="flex items-center gap-1">
                {stats.overdueCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 tabular-nums">
                    {stats.overdueCount} trễ
                  </span>
                )}
                {stats.urgentCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 tabular-nums">
                    {stats.urgentCount} gấp
                  </span>
                )}
              </div>
            </div>
            <span className="text-[10px] text-zinc-400 block mt-1.5">
              Đúng hẹn: <strong className="text-zinc-700 dark:text-zinc-300 tabular-nums">{stats.onTimeRate}%</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
