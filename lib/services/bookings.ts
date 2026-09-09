"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Booking,
  CreateBookingInput,
  UpdateBookingInput,
  BookingStatus,
  PaymentStatus,
  BookingStatusHistory,
} from "@/lib/types/booking";
import type { ServiceResult } from "./kols";

const VALID_STATUSES: BookingStatus[] = [
  "contacted",
  "confirmed",
  "sample_sent",
  "sample_delivered",
  "draft_submitted",
  "posted",
  "completed",
  "cancelled",
];

const VALID_PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "partially_paid", "paid"];

const BOOKING_SELECT_QUERY = `
  *,
  kol:kols (
    id, user_id, username, platform, channel_url, display_name, contact_phone, contact_zalo, contact_email, address, followers_count, niche
  ),
  product:products (
    id, user_id, name, brand, sku, product_url, affiliate_link, sample_cost, default_commission_rate, default_ads_rate
  ),
  campaign:campaigns (
    id, user_id, name, month, year, budget, status
  )
`;

/**
 * Generates a default formatted booking code: BK-YYYYMM-XXXX
 */
function generateBookingCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `BK-${year}${month}-${randomSuffix}`;
}

/**
 * Retrieves all bookings belonging to the authenticated user.
 */
export async function getBookings(filters?: {
  campaign_id?: string;
  kol_id?: string;
  status?: BookingStatus;
}): Promise<ServiceResult<Booking[]>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("bookings")
      .select(BOOKING_SELECT_QUERY)
      .order("created_at", { ascending: false });

    if (filters?.campaign_id) {
      query = query.eq("campaign_id", filters.campaign_id);
    }
    if (filters?.kol_id) {
      query = query.eq("kol_id", filters.kol_id);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as unknown as Booking[]) ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load bookings",
    };
  }
}

/**
 * Retrieves a single booking by ID with all relations.
 */
export async function getBookingById(id: string): Promise<ServiceResult<Booking>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_SELECT_QUERY)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: "Booking not found" };
    }

    return { data: data as unknown as Booking, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load booking",
    };
  }
}

/**
 * Retrieves the audit status change history for a booking.
 */
export async function getBookingStatusHistory(
  bookingId: string
): Promise<ServiceResult<BookingStatusHistory[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("booking_status_history")
      .select(`
        id,
        booking_id,
        from_status,
        to_status,
        changed_by,
        note,
        created_at,
        profiles:changed_by (
          full_name,
          avatar_url
        )
      `)
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as unknown as BookingStatusHistory[]) ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load status history",
    };
  }
}

/**
 * Creates a new booking for the authenticated user.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<ServiceResult<Booking>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized" };
    }

    if (!input.kol_id) {
      return { data: null, error: "KOL selection is required." };
    }

    const bookingFee = Number(input.booking_fee ?? 0);
    if (isNaN(bookingFee) || bookingFee < 0) {
      return { data: null, error: "Booking fee must be non-negative." };
    }

    const commissionRate = Number(input.commission_rate ?? 0);
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return { data: null, error: "Commission rate must be between 0% and 100%." };
    }

    const adsRate = Number(input.ads_rate ?? 0);
    if (isNaN(adsRate) || adsRate < 0 || adsRate > 100) {
      return { data: null, error: "Ads rate must be between 0% and 100%." };
    }

    const paidAmount = Number(input.paid_amount ?? 0);
    if (isNaN(paidAmount) || paidAmount < 0) {
      return { data: null, error: "Paid amount must be non-negative." };
    }

    const status: BookingStatus =
      input.status && VALID_STATUSES.includes(input.status)
        ? input.status
        : "contacted";

    const paymentStatus: PaymentStatus =
      input.payment_status && VALID_PAYMENT_STATUSES.includes(input.payment_status)
        ? input.payment_status
        : "unpaid";

    const code = input.code?.trim() || generateBookingCode();

    const insertPayload = {
      user_id: user.id,
      kol_id: input.kol_id,
      product_id: input.product_id || null,
      campaign_id: input.campaign_id || null,
      code,
      content_type: input.content_type?.trim() || null,
      booking_fee: bookingFee,
      commission_rate: commissionRate,
      ads_rate: adsRate,
      status,
      // Sample logistics
      sample_product_notes: input.sample_product_notes?.trim() || null,
      sample_sent_at: input.sample_sent_at || null,
      sample_expected_at: input.sample_expected_at || null,
      sample_delivered_at: input.sample_delivered_at || null,
      sample_tracking_code: input.sample_tracking_code?.trim() || null,
      sample_carrier: input.sample_carrier?.trim() || null,
      recipient_name: input.recipient_name?.trim() || null,
      recipient_phone: input.recipient_phone?.trim() || null,
      recipient_address: input.recipient_address?.trim() || null,
      // Timelines
      video_reminder_at: input.video_reminder_at || null,
      expected_post_at: input.expected_post_at || null,
      // Payment
      payment_status: paymentStatus,
      paid_amount: paidAmount,
      notes: input.notes?.trim() || null,
    };

    const { data: inserted, error } = await supabase
      .from("bookings")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard");

    return getBookingById(inserted.id);
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create booking",
    };
  }
}

/**
 * Updates an existing booking.
 */
export async function updateBooking(
  id: string,
  input: UpdateBookingInput
): Promise<ServiceResult<Booking>> {
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

    if (input.kol_id !== undefined) {
      if (!input.kol_id) {
        return { data: null, error: "KOL selection cannot be empty." };
      }
      updatePayload.kol_id = input.kol_id;
    }

    if (input.product_id !== undefined) {
      updatePayload.product_id = input.product_id || null;
    }

    if (input.campaign_id !== undefined) {
      updatePayload.campaign_id = input.campaign_id || null;
    }

    if (input.code !== undefined) {
      updatePayload.code = input.code?.trim() || null;
    }

    if (input.content_type !== undefined) {
      updatePayload.content_type = input.content_type?.trim() || null;
    }

    if (input.booking_fee !== undefined) {
      const fee = Number(input.booking_fee);
      if (isNaN(fee) || fee < 0) {
        return { data: null, error: "Booking fee must be non-negative." };
      }
      updatePayload.booking_fee = fee;
    }

    if (input.commission_rate !== undefined) {
      const cr = Number(input.commission_rate);
      if (isNaN(cr) || cr < 0 || cr > 100) {
        return { data: null, error: "Commission rate must be between 0% and 100%." };
      }
      updatePayload.commission_rate = cr;
    }

    if (input.ads_rate !== undefined) {
      const ar = Number(input.ads_rate);
      if (isNaN(ar) || ar < 0 || ar > 100) {
        return { data: null, error: "Ads rate must be between 0% and 100%." };
      }
      updatePayload.ads_rate = ar;
    }

    if (input.status !== undefined) {
      if (!VALID_STATUSES.includes(input.status)) {
        return { data: null, error: "Invalid booking status." };
      }
      updatePayload.status = input.status;
    }

    if (input.sample_product_notes !== undefined) {
      updatePayload.sample_product_notes = input.sample_product_notes?.trim() || null;
    }
    if (input.sample_sent_at !== undefined) {
      updatePayload.sample_sent_at = input.sample_sent_at || null;
    }
    if (input.sample_expected_at !== undefined) {
      updatePayload.sample_expected_at = input.sample_expected_at || null;
    }
    if (input.sample_delivered_at !== undefined) {
      updatePayload.sample_delivered_at = input.sample_delivered_at || null;
    }
    if (input.sample_tracking_code !== undefined) {
      updatePayload.sample_tracking_code = input.sample_tracking_code?.trim() || null;
    }
    if (input.sample_carrier !== undefined) {
      updatePayload.sample_carrier = input.sample_carrier?.trim() || null;
    }
    if (input.recipient_name !== undefined) {
      updatePayload.recipient_name = input.recipient_name?.trim() || null;
    }
    if (input.recipient_phone !== undefined) {
      updatePayload.recipient_phone = input.recipient_phone?.trim() || null;
    }
    if (input.recipient_address !== undefined) {
      updatePayload.recipient_address = input.recipient_address?.trim() || null;
    }

    if (input.video_reminder_at !== undefined) {
      updatePayload.video_reminder_at = input.video_reminder_at || null;
    }
    if (input.expected_post_at !== undefined) {
      updatePayload.expected_post_at = input.expected_post_at || null;
    }

    if (input.payment_status !== undefined) {
      if (!VALID_PAYMENT_STATUSES.includes(input.payment_status)) {
        return { data: null, error: "Invalid payment status." };
      }
      updatePayload.payment_status = input.payment_status;
    }

    if (input.paid_amount !== undefined) {
      const pa = Number(input.paid_amount);
      if (isNaN(pa) || pa < 0) {
        return { data: null, error: "Paid amount must be non-negative." };
      }
      updatePayload.paid_amount = pa;
    }

    if (input.notes !== undefined) {
      updatePayload.notes = input.notes?.trim() || null;
    }

    const { error } = await supabase
      .from("bookings")
      .update(updatePayload)
      .eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard");

    return getBookingById(id);
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update booking",
    };
  }
}

/**
 * Quickly updates status of a booking (e.g. from Kanban or stepper).
 */
export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<ServiceResult<Booking>> {
  if (!VALID_STATUSES.includes(status)) {
    return { data: null, error: "Invalid status" };
  }
  return updateBooking(id, { status });
}

/**
 * Deletes a booking by ID.
 */
export async function deleteBooking(id: string): Promise<ServiceResult<boolean>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("bookings").delete().eq("id", id);

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/bookings");
    revalidatePath("/dashboard");

    return { data: true, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to delete booking",
    };
  }
}
