export type KolPlatform =
  | "tiktok"
  | "facebook"
  | "instagram"
  | "youtube"
  | "shopee"
  | "other";

export interface Kol {
  id: string;
  user_id: string;
  username: string;
  platform: KolPlatform;
  channel_url: string | null;
  display_name: string | null;
  contact_phone: string | null;
  contact_zalo: string | null;
  contact_email: string | null;
  address: string | null;
  followers_count: number;
  niche: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateKolInput {
  username: string;
  platform?: KolPlatform;
  channel_url?: string | null;
  display_name?: string | null;
  contact_phone?: string | null;
  contact_zalo?: string | null;
  contact_email?: string | null;
  address?: string | null;
  followers_count?: number;
  niche?: string | null;
  notes?: string | null;
}

export type UpdateKolInput = Partial<CreateKolInput>;
