import { getCurrentProfile } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, error } = await getCurrentProfile();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <Navbar user={user} profile={profile} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

