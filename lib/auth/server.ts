import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "./types";

/**
 * Retrieves the currently authenticated user on the server.
 * Uses auth.getUser() as the trusted source of truth.
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, error: error?.message ?? "Not authenticated" };
    }

    return { user, error: null };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : "Failed to get user",
    };
  }
}

/**
 * Retrieves the currently authenticated user and their profile
 * from public.profiles (linked by auth.users.id -> profiles.id).
 */
export async function getCurrentProfile(): Promise<{
  user: User | null;
  profile: UserProfile | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        user: null,
        profile: null,
        error: userError?.message ?? "Not authenticated",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    return {
      user,
      profile: profile as UserProfile | null,
      error: profileError ? profileError.message : null,
    };
  } catch (err) {
    return {
      user: null,
      profile: null,
      error: err instanceof Error ? err.message : "Failed to get profile",
    };
  }
}

/**
 * Enforces authentication in Server Components or Server Actions.
 * Redirects unauthenticated requests to /login.
 */
export async function requireAuth(): Promise<{
  user: User;
  profile: UserProfile | null;
}> {
  const { user, profile, error } = await getCurrentProfile();

  if (error || !user) {
    redirect("/login");
  }

  return { user, profile };
}

export { signOutAction } from "./actions";
