import { getTemplates } from "@/lib/services/templates";
import TemplatesClient from "./templates-client";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templatesRes = await getTemplates();

  if (templatesRes.error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 text-sm">
        <p className="font-semibold">Không thể tải danh sách văn mẫu</p>
        <p className="text-xs mt-1">{templatesRes.error}</p>
      </div>
    );
  }

  return <TemplatesClient initialTemplates={templatesRes.data || []} />;
}
