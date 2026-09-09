"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Campaign, CreateCampaignInput, UpdateCampaignInput, CampaignStatus } from "@/lib/types/campaign";
import type { ServiceResult } from "./kols";

const VALID_STATUSES: CampaignStatus[] = ["planning", "active", "completed", "paused"];

/**
 * Retrieves all campaigns belonging to the authenticated user.
 */
export async function getCampaigns(): Promise<ServiceResult<Campaign[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as Campaign[]) ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load campaigns",
    };
  }
}

/**
 * Retrieves a single campaign by ID.
 */
export async function getCampaignById(id: string): Promise<ServiceResult<Campaign>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: "Campaign not found" };
    }

    return { data: data as Campaign, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load campaign",
    };
  }
}

/**
 * Creates a new campaign for the authenticated user.
 */
export async function createCampaign(input: CreateCampaignInput): Promise<ServiceResult<Campaign>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized" };
    }

    const name = input.name?.trim();
    if (!name) {
      return { data: null, error: "Campaign name is required." };
    }

    let month: number | null = null;
    if (input.month !== undefined && input.month !== null && input.month !== ("" as unknown)) {
      month = Number(input.month);
      if (isNaN(month) || month < 1 || month > 12) {
        return { data: null, error: "Month must be between 1 and 12." };
      }
    }

    let year: number | null = null;
    if (input.year !== undefined && input.year !== null && input.year !== ("" as unknown)) {
      year = Number(input.year);
      if (isNaN(year) || year < 2020) {
        return { data: null, error: "Year must be 2020 or later." };
      }
    }

    const budget = Number(input.budget ?? 0);
    if (isNaN(budget) || budget < 0) {
      return { data: null, error: "Budget must be >= 0." };
    }

    const status: CampaignStatus = input.status ?? "active";
    if (!VALID_STATUSES.includes(status)) {
      return {
        data: null,
        error: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
      };
    }

    const payload = {
      user_id: user.id,
      name,
      month,
      year,
      budget,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      status,
      notes: input.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from("campaigns")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/campaigns");
    return { data: data as Campaign, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create campaign",
    };
  }
}

/**
 * Updates an existing campaign.
 */
export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput
): Promise<ServiceResult<Campaign>> {
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

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) return { data: null, error: "Campaign name cannot be empty." };
      updatePayload.name = name;
    }

    if (input.month !== undefined) {
      if (input.month === null || (input.month as unknown) === "") {
        updatePayload.month = null;
      } else {
        const m = Number(input.month);
        if (isNaN(m) || m < 1 || m > 12) {
          return { data: null, error: "Month must be between 1 and 12." };
        }
        updatePayload.month = m;
      }
    }

    if (input.year !== undefined) {
      if (input.year === null || (input.year as unknown) === "") {
        updatePayload.year = null;
      } else {
        const y = Number(input.year);
        if (isNaN(y) || y < 2020) {
          return { data: null, error: "Year must be 2020 or later." };
        }
        updatePayload.year = y;
      }
    }

    if (input.budget !== undefined) {
      const b = Number(input.budget);
      if (isNaN(b) || b < 0) return { data: null, error: "Budget must be >= 0." };
      updatePayload.budget = b;
    }

    if (input.start_date !== undefined) updatePayload.start_date = input.start_date || null;
    if (input.end_date !== undefined) updatePayload.end_date = input.end_date || null;

    if (input.status !== undefined) {
      if (!VALID_STATUSES.includes(input.status)) {
        return { data: null, error: `Invalid status: ${input.status}` };
      }
      updatePayload.status = input.status;
    }

    if (input.notes !== undefined) updatePayload.notes = input.notes?.trim() || null;

    const { data, error } = await supabase
      .from("campaigns")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/campaigns");
    return { data: data as Campaign, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update campaign",
    };
  }
}

/**
 * Deletes a campaign.
 */
export async function deleteCampaign(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("campaigns").delete().eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return {
          success: false,
          error: "Cannot delete this campaign because it is referenced by existing bookings. Remove or reassign the bookings first.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/campaigns");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete campaign",
    };
  }
}
