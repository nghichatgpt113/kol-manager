"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Product, CreateProductInput, UpdateProductInput } from "@/lib/types/product";
import type { ServiceResult } from "./kols";

/**
 * Retrieves all products belonging to the authenticated user.
 */
export async function getProducts(): Promise<ServiceResult<Product[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as Product[]) ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load products",
    };
  }
}

/**
 * Retrieves a single product by ID.
 */
export async function getProductById(id: string): Promise<ServiceResult<Product>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: "Product not found" };
    }

    return { data: data as Product, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to load product",
    };
  }
}

/**
 * Creates a new product for the authenticated user.
 */
export async function createProduct(input: CreateProductInput): Promise<ServiceResult<Product>> {
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
      return { data: null, error: "Product name is required." };
    }

    const sampleCost = Number(input.sample_cost ?? 0);
    if (isNaN(sampleCost) || sampleCost < 0) {
      return { data: null, error: "Sample cost must be >= 0." };
    }

    const commissionRate = Number(input.default_commission_rate ?? 0);
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return { data: null, error: "Default commission rate must be between 0% and 100%." };
    }

    const adsRate = Number(input.default_ads_rate ?? 0);
    if (isNaN(adsRate) || adsRate < 0 || adsRate > 100) {
      return { data: null, error: "Default ads rate must be between 0% and 100%." };
    }

    const payload = {
      user_id: user.id,
      name,
      brand: input.brand?.trim() || null,
      sku: input.sku?.trim() || null,
      product_url: input.product_url?.trim() || null,
      affiliate_link: input.affiliate_link?.trim() || null,
      sample_cost: sampleCost,
      default_commission_rate: commissionRate,
      default_ads_rate: adsRate,
      description: input.description?.trim() || null,
      notes: input.notes?.trim() || null,
      is_active: input.is_active ?? true,
    };

    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/products");
    return { data: data as Product, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to create product",
    };
  }
}

/**
 * Updates an existing product.
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<ServiceResult<Product>> {
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
      if (!name) return { data: null, error: "Product name cannot be empty." };
      updatePayload.name = name;
    }

    if (input.brand !== undefined) updatePayload.brand = input.brand?.trim() || null;
    if (input.sku !== undefined) updatePayload.sku = input.sku?.trim() || null;
    if (input.product_url !== undefined) updatePayload.product_url = input.product_url?.trim() || null;
    if (input.affiliate_link !== undefined) updatePayload.affiliate_link = input.affiliate_link?.trim() || null;

    if (input.sample_cost !== undefined) {
      const sc = Number(input.sample_cost);
      if (isNaN(sc) || sc < 0) return { data: null, error: "Sample cost must be >= 0." };
      updatePayload.sample_cost = sc;
    }

    if (input.default_commission_rate !== undefined) {
      const cr = Number(input.default_commission_rate);
      if (isNaN(cr) || cr < 0 || cr > 100) {
        return { data: null, error: "Commission rate must be between 0% and 100%." };
      }
      updatePayload.default_commission_rate = cr;
    }

    if (input.default_ads_rate !== undefined) {
      const ar = Number(input.default_ads_rate);
      if (isNaN(ar) || ar < 0 || ar > 100) {
        return { data: null, error: "Ads rate must be between 0% and 100%." };
      }
      updatePayload.default_ads_rate = ar;
    }

    if (input.description !== undefined) updatePayload.description = input.description?.trim() || null;
    if (input.notes !== undefined) updatePayload.notes = input.notes?.trim() || null;
    if (input.is_active !== undefined) updatePayload.is_active = input.is_active;

    const { data, error } = await supabase
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/products");
    return { data: data as Product, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Failed to update product",
    };
  }
}

/**
 * Deletes a product.
 */
export async function deleteProduct(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return {
          success: false,
          error: "Cannot delete this product because it is referenced by existing bookings. Remove or reassign the bookings first.",
        };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/products");
    return { success: true, error: null };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete product",
    };
  }
}
