"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Kol, CreateKolInput, UpdateKolInput } from "@/lib/types/kol";

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Retrieves all KOLs belonging to the authenticated user.
 * RLS enforces (auth.uid() = user_id).
 */
export async function getKols(): Promise<ServiceResult<Kol[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("kols")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as Kol[]) ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load KOLs",
    };
  }
}

/**
 * Retrieves a single KOL by ID.
 */
export async function getKolById(id: string): Promise<ServiceResult<Kol>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("kols")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: "KOL not found" };
    }

    return { data: data as Kol, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load KOL",
    };
  }
}

/**
 * Creates a new KOL for the authenticated user.
 * Invariant: user_id is always resolved from auth.getUser() on the server.
 */
export async function createKol(input: CreateKolInput): Promise<ServiceResult<Kol>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized: Please log in first." };
    }

    const username = input.username?.trim();
    if (!username) {
      return { data: null, error: "Username is required." };
    }

    const followersCount = Number(input.followers_count ?? 0);
    if (isNaN(followersCount) || followersCount < 0) {
      return { data: null, error: "Followers count must be a non-negative number." };
    }

    const payload = {
      user_id: user.id,
      username,
      platform: input.platform ?? "tiktok",
      channel_url: input.channel_url?.trim() || null,
      display_name: input.display_name?.trim() || null,
      contact_phone: input.contact_phone?.trim() || null,
      contact_zalo: input.contact_zalo?.trim() || null,
      contact_email: input.contact_email?.trim() || null,
      address: input.address?.trim() || null,
      followers_count: followersCount,
      niche: input.niche?.trim() || null,
      notes: input.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from("kols")
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          data: null,
          error: `A KOL with username "${username}" already exists on ${input.platform ?? "tiktok"}.`,
        };
      }
      return { data: null, error: error.message };
    }

    revalidatePath("/kols");
    return { data: data as Kol, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create KOL",
    };
  }
}

/**
 * Updates an existing KOL.
 */
export async function updateKol(
  id: string,
  input: UpdateKolInput
): Promise<ServiceResult<Kol>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized" };
    }

    const updatePayload: Record<string, unknown> = {};

    if (input.username !== undefined) {
      const username = input.username.trim();
      if (!username) return { data: null, error: "Username cannot be empty." };
      updatePayload.username = username;
    }

    if (input.platform !== undefined) updatePayload.platform = input.platform;
    if (input.channel_url !== undefined) updatePayload.channel_url = input.channel_url?.trim() || null;
    if (input.display_name !== undefined) updatePayload.display_name = input.display_name?.trim() || null;
    if (input.contact_phone !== undefined) updatePayload.contact_phone = input.contact_phone?.trim() || null;
    if (input.contact_zalo !== undefined) updatePayload.contact_zalo = input.contact_zalo?.trim() || null;
    if (input.contact_email !== undefined) updatePayload.contact_email = input.contact_email?.trim() || null;
    if (input.address !== undefined) updatePayload.address = input.address?.trim() || null;

    if (input.followers_count !== undefined) {
      const fc = Number(input.followers_count);
      if (isNaN(fc) || fc < 0) {
        return { data: null, error: "Followers count must be >= 0." };
      }
      updatePayload.followers_count = fc;
    }

    if (input.niche !== undefined) updatePayload.niche = input.niche?.trim() || null;
    if (input.notes !== undefined) updatePayload.notes = input.notes?.trim() || null;

    const { data, error } = await supabase
      .from("kols")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return {
          data: null,
          error: "A KOL with this platform and username already exists.",
        };
      }
      return { data: null, error: error.message };
    }

    revalidatePath("/kols");
    return { data: data as Kol, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update KOL",
    };
  }
}

/**
 * Deletes a KOL.
 * Gracefully reports error if referenced by bookings.
 */
export async function deleteKol(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("kols").delete().eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return {
          success: false,
          error: "Cannot delete this KOL because they have active bookings. Remove or reassign the bookings first.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/kols");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete KOL",
    };
  }
}
