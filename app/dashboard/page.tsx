import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  async function handleLogout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-md space-y-6">
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
          <div className="space-y-1">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Signed in as:
            </p>
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100 break-all">
              {user.email}
            </p>
          </div>

          <form action={handleLogout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-white dark:text-zinc-900 shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100 transition duration-150 cursor-pointer"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
