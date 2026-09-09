export interface Product {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  product_url: string | null;
  affiliate_link: string | null;
  sample_cost: number;
  default_commission_rate: number;
  default_ads_rate: number;
  description: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  brand?: string | null;
  sku?: string | null;
  product_url?: string | null;
  affiliate_link?: string | null;
  sample_cost?: number;
  default_commission_rate?: number;
  default_ads_rate?: number;
  description?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}
