import { getTasks } from "@/lib/services/tasks";
import { getBookings } from "@/lib/services/bookings";
import TasksClient from "./tasks-client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tasksRes, bookingsRes] = await Promise.all([
    getTasks(),
    getBookings(),
  ]);

  if (tasksRes.error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 text-sm">
        <p className="font-semibold">Không thể tải danh sách công việc</p>
        <p className="text-xs mt-1">{tasksRes.error}</p>
      </div>
    );
  }

  return (
    <TasksClient
      initialTasks={tasksRes.data ?? []}
      bookings={bookingsRes.data ?? []}
    />
  );
}
