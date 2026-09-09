import { getCurrentProfile, signOutAction } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile, error } = await getCurrentProfile();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 mb-4 shadow-sm">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            KOL Manager
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
          {/* User Auth Info */}
          <div className="space-y-4">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Connected to Supabase
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Email Account
              </p>
              <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 break-all mt-0.5">
                {user.email}
              </p>
            </div>

            {/* Profile Record from public.profiles */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200/70 dark:border-zinc-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Database Profile (public.profiles)
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono">
                  auth.users.id &rarr; profiles.id
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Full Name: </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {profile?.full_name ?? "Not set"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Profile ID: </span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {profile?.id ? `${profile.id.slice(0, 8)}...` : "Missing"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 transition duration-150 cursor-pointer"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
