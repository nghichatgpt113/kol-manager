import { getCampaigns } from "@/lib/services/campaigns";
import CampaignsClient from "./campaigns-client";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const { data: campaigns, error } = await getCampaigns();

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 text-sm">
        <p className="font-semibold">Failed to load campaigns</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  return <CampaignsClient initialCampaigns={campaigns ?? []} />;
}
