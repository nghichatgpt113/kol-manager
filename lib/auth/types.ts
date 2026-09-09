import type { User, Session } from "@supabase/supabase-js";

/**
 * Represents a user profile stored in public.profiles,
 * extending the auth.users record.
 */
export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication and profile state for application components.
 */
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
}
