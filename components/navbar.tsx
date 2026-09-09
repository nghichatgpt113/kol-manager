"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOutAction } from "@/lib/auth/actions";
import type { UserProfile } from "@/lib/auth/types";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User;
  profile: UserProfile | null;
}

const NAV_ITEMS = [
  { label: "Tổng quan", href: "/dashboard" },
  { label: "Booking", href: "/bookings" },
  { label: "KOLs", href: "/kols" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Chiến dịch", href: "/campaigns" },
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      {/* Top Loading Progress Bar */}
      {pendingHref && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 overflow-hidden bg-indigo-500/10">
          <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            onClick={() => handleNavClick("/dashboard")}
            className="flex items-center gap-2.5 font-bold text-zinc-900 dark:text-zinc-50 tracking-tight cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-black text-sm shadow-xs">
              K
            </div>
            <span className="text-base font-semibold">KOL Manager</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
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
                  className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold shadow-2xs"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {item.label}
                    {isTargeted && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Sign out */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              {profile?.full_name || user.email?.split("@")[0]}
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
              {user.email}
            </span>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex items-center px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Nav Links */}
      <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800/80 px-4 py-2 flex items-center gap-1 overflow-x-auto">
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
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <span className="flex items-center gap-1">
                {item.label}
                {isTargeted && (
                  <span className="w-1 h-1 rounded-full bg-white dark:bg-zinc-900 animate-ping" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
