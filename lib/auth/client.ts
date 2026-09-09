"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { UserProfile, AuthState } from "./types";

/**
 * Client-side React hook to access authentication state, current user,
 * user profile, and sign-out capabilities.
 *
 * Automatically restores session on page refresh and syncs on auth changes.
 */
export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    isLoading: true,
  });

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Error fetching user profile:", error.message);
        return null;
      }

      return data as UserProfile | null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    // Initial session restoration
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (isMounted) {
          setState({
            user: session.user,
            profile,
            session,
            isLoading: false,
          });
        }
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          isLoading: false,
        });
      }
    });

    // Listen for auth state transitions (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (isMounted) {
          setState({
            user: session.user,
            profile,
            session,
            isLoading: false,
          });
        }
      } else {
        setState({
          user: null,
          profile: null,
          session: null,
          isLoading: false,
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  return {
    ...state,
    userId: state.user?.id ?? null,
    signOut,
  };
}
