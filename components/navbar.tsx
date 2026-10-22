"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import type { UserProfile } from "@/lib/auth/types";
import type { User } from "@supabase/supabase-js";
import ThemeToggle from "@/components/ui/theme-toggle";

interface NavbarProps {
  user: User;
  profile: UserProfile | null;
}

const NAV_ITEMS = [
  { label: "Tổng quan", href: "/dashboard" },
  { label: "KOLs", href: "/kols" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Chiến dịch", href: "/campaigns" },
  { label: "Hợp tác", href: "/bookings" },
  { label: "Công việc", href: "/tasks" },
  { label: "Văn mẫu", href: "/templates" },
];

export default function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Clear pending state immediately when pathname changes (React 19 render-time adjustment)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setPendingHref(null);
  }

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setPendingHref(href);
    }
  };

  const displayName = profile?.full_name || user.email?.split("@")[0] || "User";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-white/[0.08] bg-white/85 dark:bg-[#0b0c12]/85 backdrop-blur-xl transition-colors">
      {/* Top Loading Progress Bar - Refined Accent Line */}
      {pendingHref && (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-50 overflow-hidden bg-indigo-500/20">
          <div className="h-full w-2/3 bg-indigo-600 dark:bg-indigo-400 rounded-r-full transition-all duration-300 ease-out" />
        </div>
      )}

      <div className="w-full px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            onClick={() => handleNavClick("/dashboard")}
            className="group flex items-center gap-2.5 font-bold tracking-tight text-zinc-900 dark:text-zinc-100 cursor-pointer"
          >
            {/* Geometric Vector Mark */}
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 text-white flex items-center justify-center shadow-xs shadow-indigo-500/25 group-hover:scale-[1.03] transition-transform">
              <svg
                className="w-4 h-4 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">
                KOL Manager
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase leading-none mt-1">
                Workspace
              </span>
            </div>
          </Link>

          {/* Navigation Links - Segmented Pill Bar */}
          <nav className="hidden md:flex items-center gap-0.5 p-1 rounded-xl bg-zinc-100/70 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06]">
            {NAV_ITEMS.map((item) => {
              const isCurrent =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const isTargeted = pendingHref === item.href;
              const isActive = pendingHref ? isTargeted : isCurrent;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-white dark:bg-white/[0.1] text-zinc-950 dark:text-zinc-50 font-semibold shadow-2xs dark:shadow-none"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-white/50 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {item.label}
                    {isTargeted && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-90" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />

          <div className="hidden sm:flex items-center gap-2.5 pl-2.5 border-l border-zinc-200/60 dark:border-white/[0.08]">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center justify-center border border-zinc-200/60 dark:border-white/[0.08]">
              {userInitials}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {displayName}
              </span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 leading-tight font-mono">
                {user.email}
              </span>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-white/[0.06] border border-transparent hover:border-zinc-200 dark:hover:border-white/[0.08] transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Thoát</span>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Nav Links */}
      <div className="md:hidden border-t border-zinc-200/60 dark:border-white/[0.06] px-4 py-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const isCurrent =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const isTargeted = pendingHref === item.href;
          const isActive = pendingHref ? isTargeted : isCurrent;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              }`}
            >
              <span className="flex items-center gap-1">
                {item.label}
                {isTargeted && (
                  <span className="w-1 h-1 rounded-full bg-white dark:bg-zinc-900" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
