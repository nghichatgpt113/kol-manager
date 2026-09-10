"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Video, CreateVideoInput, UpdateVideoInput } from "@/lib/types/video";
import type { ServiceResult } from "./kols";

function isValidHttpUrl(stringVal: string): boolean {
  try {
    const url = new URL(stringVal);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Retrieves all videos for a given booking ID, filtered by user ownership via RLS.
 */
export async function getVideosByBookingId(
  bookingId: string
): Promise<ServiceResult<Video[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as unknown as Video[]) ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load videos",
    };
  }
}

/**
 * Retrieves a single video by ID.
 */
export async function getVideoById(id: string): Promise<ServiceResult<Video>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: "Video không tồn tại hoặc bạn không có quyền truy cập." };
    }

    return { data: data as unknown as Video, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load video",
    };
  }
}

/**
 * Creates a new video for a booking, verifying booking ownership strictly.
 */
export async function createVideo(
  input: CreateVideoInput
): Promise<ServiceResult<Video>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized" };
    }

    if (!input.booking_id) {
      return { data: null, error: "Thiếu mã định danh booking." };
    }

    // Application-layer ownership check: Verify booking belongs to authenticated user
    const { data: booking, error: bookingCheckError } = await supabase
      .from("bookings")
      .select("id, user_id")
      .eq("id", input.booking_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (bookingCheckError || !booking) {
      return {
        data: null,
        error: "Không tìm thấy booking hoặc bạn không có quyền thêm video cho booking này.",
      };
    }

    const videoUrl = input.video_url?.trim() || null;
    const airUrl = input.air_url?.trim() || null;
    const adsCode = input.ads_code?.trim() || null;
    const title = input.title?.trim() || null;

    if (!videoUrl && !airUrl && !adsCode && !title) {
      return {
        data: null,
        error: "Vui lòng cung cấp ít nhất một thông tin: Link video, Link Air, Mã Ads hoặc Tiêu đề.",
      };
    }

    if (videoUrl && !isValidHttpUrl(videoUrl)) {
      return {
        data: null,
        error: "Đường dẫn Link video không hợp lệ (cần bắt đầu bằng http:// hoặc https://).",
      };
    }

    if (airUrl && !isValidHttpUrl(airUrl)) {
      return {
        data: null,
        error: "Đường dẫn Link Air không hợp lệ (cần bắt đầu bằng http:// hoặc https://).",
      };
    }

    const payload = {
      booking_id: input.booking_id,
      video_url: videoUrl,
      video_id: input.video_id?.trim() || null,
      title,
      air_url: airUrl,
      ads_code: adsCode,
      ads_code_expires_at: input.ads_code_expires_at || null,
      posted_at: input.posted_at || null,
      views_count: Math.max(0, Number(input.views_count ?? 0)),
      likes_count: Math.max(0, Number(input.likes_count ?? 0)),
      comments_count: Math.max(0, Number(input.comments_count ?? 0)),
      notes: input.notes?.trim() || null,
    };

    const { data, error } = await supabase
      .from("videos")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/bookings");
    return { data: data as unknown as Video, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Không thể tạo video.",
    };
  }
}

/**
 * Updates an existing video, validating ownership via the parent booking.
 */
export async function updateVideo(
  id: string,
  input: UpdateVideoInput
): Promise<ServiceResult<Video>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Unauthorized" };
    }

    // Verify video exists and belongs to a booking owned by user
    const { data: existingVideo, error: checkError } = await supabase
      .from("videos")
      .select("id, booking_id, bookings!inner(id, user_id)")
      .eq("id", id)
      .maybeSingle();

    if (checkError || !existingVideo) {
      return {
        data: null,
        error: "Không tìm thấy video hoặc bạn không có quyền chỉnh sửa video này.",
      };
    }

    const updatePayload: Record<string, unknown> = {};

    if (input.video_url !== undefined) {
      const trimmed = input.video_url?.trim() || null;
      if (trimmed && !isValidHttpUrl(trimmed)) {
        return {
          data: null,
          error: "Đường dẫn Link video không hợp lệ (cần bắt đầu bằng http:// hoặc https://).",
        };
      }
      updatePayload.video_url = trimmed;
    }

    if (input.air_url !== undefined) {
      const trimmed = input.air_url?.trim() || null;
      if (trimmed && !isValidHttpUrl(trimmed)) {
        return {
          data: null,
          error: "Đường dẫn Link Air không hợp lệ (cần bắt đầu bằng http:// hoặc https://).",
        };
      }
      updatePayload.air_url = trimmed;
    }

    if (input.video_id !== undefined) {
      updatePayload.video_id = input.video_id?.trim() || null;
    }
    if (input.title !== undefined) {
      updatePayload.title = input.title?.trim() || null;
    }
    if (input.ads_code !== undefined) {
      updatePayload.ads_code = input.ads_code?.trim() || null;
    }
    if (input.ads_code_expires_at !== undefined) {
      updatePayload.ads_code_expires_at = input.ads_code_expires_at || null;
    }
    if (input.posted_at !== undefined) {
      updatePayload.posted_at = input.posted_at || null;
    }
    if (input.views_count !== undefined) {
      updatePayload.views_count = Math.max(0, Number(input.views_count));
    }
    if (input.likes_count !== undefined) {
      updatePayload.likes_count = Math.max(0, Number(input.likes_count));
    }
    if (input.comments_count !== undefined) {
      updatePayload.comments_count = Math.max(0, Number(input.comments_count));
    }
    if (input.notes !== undefined) {
      updatePayload.notes = input.notes?.trim() || null;
    }

    const { data, error } = await supabase
      .from("videos")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/bookings");
    return { data: data as unknown as Video, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Không thể cập nhật video.",
    };
  }
}

/**
 * Deletes a video, validating ownership via the parent booking.
 */
export async function deleteVideo(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify video exists and belongs to a booking owned by user
    const { data: existingVideo, error: checkError } = await supabase
      .from("videos")
      .select("id, booking_id, bookings!inner(id, user_id)")
      .eq("id", id)
      .maybeSingle();

    if (checkError || !existingVideo) {
      return {
        success: false,
        error: "Không tìm thấy video hoặc bạn không có quyền xóa video này.",
      };
    }

    const { error } = await supabase.from("videos").delete().eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/bookings");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Không thể xóa video.",
    };
  }
}
