import { getBookings } from "@/lib/services/bookings";
import { getCampaigns } from "@/lib/services/campaigns";
import BookingsClient from "./bookings-client";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  // Only fetch primary bookings data and campaigns for the filter toolbar
  // KOLs and Products for the modal dropdowns are loaded in background on the client
  const [bookingsRes, campaignsRes] = await Promise.all([
    getBookings(),
    getCampaigns(),
  ]);

  if (bookingsRes.error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 text-sm">
        <p className="font-semibold">Không thể tải danh sách booking</p>
        <p className="text-xs mt-1">{bookingsRes.error}</p>
      </div>
    );
  }

  return (
    <BookingsClient
      initialBookings={bookingsRes.data ?? []}
      campaigns={campaignsRes.data ?? []}
    />
  );
}
