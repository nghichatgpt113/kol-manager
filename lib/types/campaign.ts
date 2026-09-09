export type CampaignStatus = "planning" | "active" | "completed" | "paused";

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  month: number | null;
  year: number | null;
  budget: number;
  start_date: string | null;
  end_date: string | null;
  status: CampaignStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  name: string;
  month?: number | null;
  year?: number | null;
  budget?: number;
  start_date?: string | null;
  end_date?: string | null;
  status?: CampaignStatus;
  notes?: string | null;
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {}
