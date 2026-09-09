"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";
import type { UserProfile } from "@/lib/auth/types";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User;
  profile: UserProfile | null;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "KOLs", href: "/kols" },
  { label: "Products", href: "/products" },
  { label: "Campaigns", href: "/campaigns" },
];

export default function Navbar({ user, profile }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-black text-sm shadow-xs">
              K
            </div>
            <span className="text-base font-semibold">KOL Manager</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {item.label}
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
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Nav Links */}
      <div className="md:hidden border-t border-zinc-100 dark:border-zinc-800/80 px-4 py-2 flex items-center gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
