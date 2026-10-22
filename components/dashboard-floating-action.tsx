"use client";

import { useRouter } from "next/navigation";
import FloatingActionBar from "@/components/ui/floating-action-bar";

export default function DashboardFloatingAction() {
  const router = useRouter();

  return (
    <FloatingActionBar
      primaryAction={{
        label: "Tạo hợp tác",
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
        ),
        onClick: () => router.push("/bookings"),
        shortcut: "c",
      }}
    />
  );
}
