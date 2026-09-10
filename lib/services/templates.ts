"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Template,
  TemplateCategory,
  CreateTemplateInput,
  UpdateTemplateInput,
} from "@/lib/types/template";
import type { ServiceResult } from "./kols";

const VALID_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "invitation",
  "confirmation",
  "brief",
  "sample_sent",
  "video_reminder",
  "ads_code_request",
  "feedback",
  "general",
];

/**
 * Retrieves all templates belonging to the authenticated user.
 */
export async function getTemplates(filter?: {
  category?: TemplateCategory;
}): Promise<ServiceResult<Template[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    let query = supabase
      .from("templates")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (filter?.category) {
      query = query.eq("category", filter.category);
    }

    const { data, error } = await query;

    if (error) {
      return {
        data: null,
        error: "Không thể tải danh sách văn mẫu: " + error.message,
      };
    }

    return { data: (data || []) as Template[], error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không mong muốn khi tải danh sách văn mẫu",
    };
  }
}

/**
 * Retrieves a single template by its ID.
 */
export async function getTemplateById(
  id: string
): Promise<ServiceResult<Template>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: "Không thể tải thông tin văn mẫu: " + error.message,
      };
    }

    if (!data) {
      return {
        data: null,
        error: "Không tìm thấy văn mẫu hoặc bạn không có quyền truy cập",
      };
    }

    return { data: data as Template, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không mong muốn khi tải văn mẫu",
    };
  }
}

/**
 * Creates a new template for the authenticated user.
 */
export async function createTemplate(
  input: CreateTemplateInput
): Promise<ServiceResult<Template>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    // Input validation
    const title = input.title?.trim();
    if (!title) {
      return { data: null, error: "Tiêu đề văn mẫu không được để trống" };
    }

    if (!input.category || !VALID_TEMPLATE_CATEGORIES.includes(input.category)) {
      return { data: null, error: "Danh mục văn mẫu không hợp lệ" };
    }

    const content = input.content?.trim();
    if (!content) {
      return { data: null, error: "Nội dung văn mẫu không được để trống" };
    }

    const { data, error } = await supabase
      .from("templates")
      .insert({
        user_id: user.id,
        title,
        category: input.category,
        content,
        variables_description: input.variables_description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: "Không thể tạo văn mẫu: " + error.message,
      };
    }

    revalidatePath("/templates");
    return { data: data as Template, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không mong muốn khi tạo văn mẫu",
    };
  }
}

/**
 * Updates an existing template for the authenticated user.
 */
export async function updateTemplate(
  id: string,
  input: UpdateTemplateInput
): Promise<ServiceResult<Template>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    // Verify ownership
    const { data: existing, error: findError } = await supabase
      .from("templates")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (findError || !existing) {
      return {
        data: null,
        error: "Không tìm thấy văn mẫu hoặc bạn không có quyền chỉnh sửa",
      };
    }

    const updatePayload: Record<string, unknown> = {};

    if (input.title !== undefined) {
      const trimmedTitle = input.title.trim();
      if (!trimmedTitle) {
        return { data: null, error: "Tiêu đề văn mẫu không được để trống" };
      }
      updatePayload.title = trimmedTitle;
    }

    if (input.category !== undefined) {
      if (!VALID_TEMPLATE_CATEGORIES.includes(input.category)) {
        return { data: null, error: "Danh mục văn mẫu không hợp lệ" };
      }
      updatePayload.category = input.category;
    }

    if (input.content !== undefined) {
      const trimmedContent = input.content.trim();
      if (!trimmedContent) {
        return { data: null, error: "Nội dung văn mẫu không được để trống" };
      }
      updatePayload.content = trimmedContent;
    }

    if (input.variables_description !== undefined) {
      updatePayload.variables_description =
        input.variables_description?.trim() || null;
    }

    if (Object.keys(updatePayload).length === 0) {
      return { data: null, error: "Không có thông tin nào cần cập nhật" };
    }

    const { data, error } = await supabase
      .from("templates")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: "Không thể cập nhật văn mẫu: " + error.message,
      };
    }

    revalidatePath("/templates");
    return { data: data as Template, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không mong muốn khi cập nhật văn mẫu",
    };
  }
}

/**
 * Deletes a template owned by the authenticated user.
 */
export async function deleteTemplate(
  id: string
): Promise<ServiceResult<{ success: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: "Bạn chưa đăng nhập hoặc phiên đã hết hạn" };
    }

    // Verify ownership first
    const { data: existing, error: findError } = await supabase
      .from("templates")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (findError || !existing) {
      return {
        data: null,
        error: "Không tìm thấy văn mẫu hoặc bạn không có quyền xóa",
      };
    }

    const { error } = await supabase
      .from("templates")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return {
        data: null,
        error: "Không thể xóa văn mẫu: " + error.message,
      };
    }

    revalidatePath("/templates");
    return { data: { success: true }, error: null };
  } catch (err) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi không mong muốn khi xóa văn mẫu",
    };
  }
}
