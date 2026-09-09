import type { Kol } from "./kol";
import type { Product } from "./product";
import type { Campaign } from "./campaign";

export type BookingStatus =
  | "contacted"
  | "confirmed"
  | "sample_sent"
  | "sample_delivered"
  | "draft_submitted"
  | "posted"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

export interface BookingStatusHistory {
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Booking {
  id: string;
  user_id: string;
  kol_id: string;
  product_id: string | null;
  campaign_id: string | null;
  code: string | null;
  content_type: string | null;
  booking_fee: number;
  commission_rate: number;
  ads_rate: number;
  status: BookingStatus;

  // Logistics
  sample_product_notes: string | null;
  sample_sent_at: string | null;
  sample_expected_at: string | null;
  sample_delivered_at: string | null;
  sample_tracking_code: string | null;
  sample_carrier: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_address: string | null;

  // Timelines
  video_reminder_at: string | null;
  expected_post_at: string | null;

  // Payment
  payment_status: PaymentStatus;
  paid_amount: number;

  notes: string | null;
  created_at: string;
  updated_at: string;

  // Joined Relational Data
  kol?: Kol;
  product?: Product | null;
  campaign?: Campaign | null;
}

export interface CreateBookingInput {
  kol_id: string;
  product_id?: string | null;
  campaign_id?: string | null;
  code?: string | null;
  content_type?: string | null;
  booking_fee?: number;
  commission_rate?: number;
  ads_rate?: number;
  status?: BookingStatus;

  // Logistics
  sample_product_notes?: string | null;
  sample_sent_at?: string | null;
  sample_expected_at?: string | null;
  sample_delivered_at?: string | null;
  sample_tracking_code?: string | null;
  sample_carrier?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  recipient_address?: string | null;

  // Timelines
  video_reminder_at?: string | null;
  expected_post_at?: string | null;

  // Payment
  payment_status?: PaymentStatus;
  paid_amount?: number;

  notes?: string | null;
}

export type UpdateBookingInput = Partial<CreateBookingInput>;
