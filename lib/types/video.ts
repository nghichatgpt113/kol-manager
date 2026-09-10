export interface Video {
  id: string;
  booking_id: string;
  video_url: string | null;
  video_id: string | null;
  title: string | null;
  air_url: string | null;
  ads_code: string | null;
  ads_code_expires_at: string | null;
  posted_at: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateVideoInput {
  booking_id: string;
  video_url?: string | null;
  video_id?: string | null;
  title?: string | null;
  air_url?: string | null;
  ads_code?: string | null;
  ads_code_expires_at?: string | null;
  posted_at?: string | null;
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  notes?: string | null;
}

export type UpdateVideoInput = Partial<Omit<CreateVideoInput, "booking_id">>;
