export type TemplateCategory =
  | "invitation"
  | "confirmation"
  | "brief"
  | "sample_sent"
  | "video_reminder"
  | "ads_code_request"
  | "feedback"
  | "general";

export interface Template {
  id: string;
  user_id: string;
  title: string;
  category: TemplateCategory;
  content: string;
  variables_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  title: string;
  category: TemplateCategory;
  content: string;
  variables_description?: string | null;
}

export interface UpdateTemplateInput {
  title?: string;
  category?: TemplateCategory;
  content?: string;
  variables_description?: string | null;
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  invitation: "Mời hợp tác",
  confirmation: "Xác nhận hợp tác",
  brief: "Gửi brief / Yêu cầu",
  sample_sent: "Thông báo gửi sample",
  video_reminder: "Nhắc đăng video",
  ads_code_request: "Xin mã Ads Code",
  feedback: "Góp ý / Chỉnh sửa",
  general: "Khác",
};

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "invitation", label: "Mời hợp tác" },
  { value: "confirmation", label: "Xác nhận hợp tác" },
  { value: "brief", label: "Gửi brief / Yêu cầu" },
  { value: "sample_sent", label: "Thông báo gửi sample" },
  { value: "video_reminder", label: "Nhắc đăng video" },
  { value: "ads_code_request", label: "Xin mã Ads Code" },
  { value: "feedback", label: "Góp ý / Chỉnh sửa" },
  { value: "general", label: "Khác" },
];
