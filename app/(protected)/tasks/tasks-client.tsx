"use client";

import { useState, useMemo, useTransition } from "react";
import type { Task, TaskType } from "@/lib/types/task";
import {
  TASK_TYPE_LABELS,
  TASK_STATUS_LABELS,
  isTaskOverdue,
} from "@/lib/types/task";
import type { Booking } from "@/lib/types/booking";
import {
  createTask,
  updateTask,
  completeTask,
  cancelTask,
  deleteTask,
} from "@/lib/services/tasks";
import CustomSelect, { type SelectOption } from "@/components/ui/custom-select";

interface TasksClientProps {
  initialTasks: Task[];
  bookings: Booking[];
}

const TYPE_BADGE_STYLES: Record<TaskType, { bg: string; text: string; border: string }> = {
  sample_delivery_check: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/60",
  },
  draft_review: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/60",
  },
  video_reminder: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
  },
  get_air_link: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/60",
  },
  get_ads_code: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800/60",
  },
  payment: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
  },
  general: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-200 dark:border-zinc-700",
  },
};

function formatDateTime(isoString: string): string {
  if (!isoString) return "Chưa đặt";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function TasksClient({
  initialTasks,
  bookings,
}: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "pending" | "completed" | "cancelled" | "overdue"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [confirmCancelTask, setConfirmCancelTask] = useState<Task | null>(null);
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<Task | null>(null);

  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<TaskType>("general");
  const [formBookingId, setFormBookingId] = useState("");
  const [formDueDate, setFormDueDate] = useState("");
  const [formDueTime, setFormDueTime] = useState("18:00");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let overdue = 0;

    tasks.forEach((t) => {
      if (t.status === "completed") {
        completed++;
      } else if (t.status === "pending") {
        pending++;
        if (isTaskOverdue(t)) {
          overdue++;
        }
      }
    });

    return {
      total: tasks.length,
      pending,
      completed,
      overdue,
    };
  }, [tasks]);

  // Filtered and searched tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Status / Overdue Filter
      if (activeFilter === "overdue") {
        if (!isTaskOverdue(task)) return false;
      } else if (activeFilter !== "all") {
        if (task.status !== activeFilter) return false;
      }

      // 2. Search Filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();

      const matchTitle = task.title.toLowerCase().includes(term);
      const matchNotes = task.notes?.toLowerCase().includes(term) ?? false;
      const matchBookingCode =
        task.booking?.code?.toLowerCase().includes(term) ?? false;
      const matchKolUsername =
        task.booking?.kol?.username?.toLowerCase().includes(term) ?? false;
      const matchKolName =
        task.booking?.kol?.display_name?.toLowerCase().includes(term) ?? false;
      const matchProduct =
        task.booking?.product?.name?.toLowerCase().includes(term) ?? false;

      return (
        matchTitle ||
        matchNotes ||
        matchBookingCode ||
        matchKolUsername ||
        matchKolName ||
        matchProduct
      );
    });
  }, [tasks, activeFilter, searchTerm]);

  // Booking options for dropdown
  const bookingOptions: SelectOption[] = useMemo(() => {
    const list: SelectOption[] = [
      {
        value: "",
        label: "Không liên kết hợp tác",
        subLabel: "Công việc độc lập không thuộc Booking nào",
      },
    ];

    bookings.forEach((b) => {
      const kolInfo = b.kol
        ? `${b.kol.display_name || b.kol.username} (@${b.kol.username})`
        : "Chưa rõ KOL";
      list.push({
        value: b.id,
        label: `${b.code || "Hợp tác"} - ${kolInfo}`,
        subLabel: `Sản phẩm: ${b.product?.name || "Chưa có"}${
          b.expected_post_at ? ` • Deadline: ${b.expected_post_at}` : ""
        }`,
      });
    });

    return list;
  }, [bookings]);

  // Selected booking preview in modal
  const selectedBookingPreview = useMemo(() => {
    if (!formBookingId) return null;
    return bookings.find((b) => b.id === formBookingId) || null;
  }, [formBookingId, bookings]);

  // Type options for dropdown
  const typeOptions: SelectOption[] = useMemo(() => {
    return (Object.keys(TASK_TYPE_LABELS) as TaskType[]).map((typeKey) => ({
      value: typeKey,
      label: TASK_TYPE_LABELS[typeKey],
    }));
  }, []);

  // Modal Open Handlers
  const handleOpenCreate = () => {
    setFormTitle("");
    setFormType("general");
    setFormBookingId("");
    // Default deadline to tomorrow 18:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    setFormDueDate(`${yyyy}-${mm}-${dd}`);
    setFormDueTime("18:00");
    setFormNotes("");
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormType(task.type);
    setFormBookingId(task.booking_id || "");

    const dateObj = new Date(task.due_at);
    if (!isNaN(dateObj.getTime())) {
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const hh = String(dateObj.getHours()).padStart(2, "0");
      const min = String(dateObj.getMinutes()).padStart(2, "0");
      setFormDueDate(`${yyyy}-${mm}-${dd}`);
      setFormDueTime(`${hh}:${min}`);
    } else {
      setFormDueDate("");
      setFormDueTime("18:00");
    }

    setFormNotes(task.notes || "");
    setFormError(null);
  };

  // Form Submit Handler (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Vui lòng nhập tên công việc");
      return;
    }
    if (!formDueDate) {
      setFormError("Vui lòng chọn ngày hết hạn (Deadline)");
      return;
    }

    // Combine date and time into ISO string
    const combinedIso = new Date(
      `${formDueDate}T${formDueTime || "18:00"}:00`
    ).toISOString();

    setFormError(null);

    startTransition(async () => {
      if (editingTask) {
        // Update task
        const res = await updateTask(editingTask.id, {
          title: formTitle.trim(),
          type: formType,
          booking_id: formBookingId || null,
          due_at: combinedIso,
          notes: formNotes.trim() || null,
        });

        if (res.error || !res.data) {
          setFormError(res.error || "Không thể cập nhật công việc");
          return;
        }

        // Attach full booking context if selected
        const updated = {
          ...res.data,
          booking: selectedBookingPreview
            ? {
                id: selectedBookingPreview.id,
                code: selectedBookingPreview.code,
                expected_post_at: selectedBookingPreview.expected_post_at,
                kol: selectedBookingPreview.kol
                  ? {
                      username: selectedBookingPreview.kol.username,
                      display_name: selectedBookingPreview.kol.display_name,
                    }
                  : null,
                product: selectedBookingPreview.product
                  ? { name: selectedBookingPreview.product.name }
                  : null,
              }
            : null,
        };

        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? updated : t))
        );
        setEditingTask(null);
        showToast("Cập nhật công việc thành công!");
      } else {
        // Create task
        const res = await createTask({
          title: formTitle.trim(),
          type: formType,
          booking_id: formBookingId || null,
          due_at: combinedIso,
          notes: formNotes.trim() || null,
        });

        if (res.error || !res.data) {
          setFormError(res.error || "Không thể tạo công việc");
          return;
        }

        const created = {
          ...res.data,
          booking: selectedBookingPreview
            ? {
                id: selectedBookingPreview.id,
                code: selectedBookingPreview.code,
                expected_post_at: selectedBookingPreview.expected_post_at,
                kol: selectedBookingPreview.kol
                  ? {
                      username: selectedBookingPreview.kol.username,
                      display_name: selectedBookingPreview.kol.display_name,
                    }
                  : null,
                product: selectedBookingPreview.product
                  ? { name: selectedBookingPreview.product.name }
                  : null,
              }
            : null,
        };

        setTasks((prev) => [created, ...prev]);
        setIsCreateOpen(false);
        showToast("Đã tạo công việc mới thành công!");
      }
    });
  };

  // 1-Click Complete Action
  const handleComplete = async (task: Task) => {
    startTransition(async () => {
      const res = await completeTask(task.id);
      if (res.error || !res.data) {
        showToast(res.error || "Không thể hoàn thành công việc", "error");
        return;
      }
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: "completed",
                completed_at: res.data?.completed_at || new Date().toISOString(),
              }
            : t
        )
      );
      showToast("Đã hoàn thành công việc");
    });
  };

  // Cancel Confirmation Action
  const handleConfirmCancel = async () => {
    if (!confirmCancelTask) return;
    const targetId = confirmCancelTask.id;
    startTransition(async () => {
      const res = await cancelTask(targetId);
      if (res.error || !res.data) {
        showToast(res.error || "Không thể hủy công việc", "error");
        return;
      }
      setTasks((prev) =>
        prev.map((t) =>
          t.id === targetId
            ? { ...t, status: "cancelled", completed_at: null }
            : t
        )
      );
      setConfirmCancelTask(null);
      showToast("Đã hủy công việc");
    });
  };

  // Delete Confirmation Action
  const handleConfirmDelete = async () => {
    if (!confirmDeleteTask) return;
    const targetId = confirmDeleteTask.id;
    startTransition(async () => {
      const res = await deleteTask(targetId);
      if (res.error) {
        showToast(res.error || "Không thể xóa công việc", "error");
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== targetId));
      setConfirmDeleteTask(null);
      showToast("Đã xóa công việc");
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-zinc-900 text-white border-zinc-800 dark:bg-white dark:text-zinc-900 dark:border-zinc-200"
              : "bg-red-600 text-white border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <svg className="w-4 h-4 text-emerald-400 dark:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Công việc
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Theo dõi các công việc và deadline cần xử lý
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2.5 text-sm font-semibold shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Tạo công việc</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Tổng công việc
            </span>
            <span className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {metrics.total}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              Chờ xử lý
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {metrics.pending}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Đã hoàn thành
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.completed}
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              Quá hạn
            </span>
            <span className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {metrics.overdue}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(
            [
              { id: "all", label: "Tất cả", count: metrics.total },
              { id: "pending", label: "Chờ xử lý", count: metrics.pending },
              { id: "completed", label: "Đã hoàn thành", count: metrics.completed },
              { id: "overdue", label: "Quá hạn", count: metrics.overdue },
              {
                id: "cancelled",
                label: "Đã hủy",
                count: tasks.filter((t) => t.status === "cancelled").length,
              },
            ] as const
          ).map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, mã booking, KOL..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/20"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Task List / Table */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Không tìm thấy công việc nào
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {searchTerm
              ? "Không có công việc nào khớp với từ khóa tìm kiếm của bạn."
              : activeFilter === "overdue"
              ? "Tuyệt vời! Không có công việc nào bị quá hạn."
              : "Danh sách công việc đang trống. Hãy bấm Tạo công việc để bắt đầu theo dõi deadline."}
          </p>
          {!searchTerm && activeFilter === "all" && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-xs font-semibold shadow-xs hover:bg-zinc-800 cursor-pointer"
            >
              + Tạo công việc đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Công việc</th>
                  <th className="py-3.5 px-4">Loại</th>
                  <th className="py-3.5 px-4">Hợp tác</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredTasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  const typeStyle = TYPE_BADGE_STYLES[task.type] || TYPE_BADGE_STYLES.general;

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      {/* Title & Notes */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                          {task.title}
                        </div>
                        {task.notes && (
                          <div className="mt-0.5 text-zinc-500 dark:text-zinc-400 text-xs line-clamp-1 max-w-xs">
                            {task.notes}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                        >
                          {TASK_TYPE_LABELS[task.type] || task.type}
                        </span>
                      </td>

                      {/* Booking / KOL Context */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {task.booking ? (
                          <div className="space-y-0.5">
                            <div className="font-mono text-zinc-900 dark:text-zinc-100 font-medium">
                              {task.booking.code || "Booking"}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {task.booking.kol
                                ? `@${task.booking.kol.username}`
                                : "Chưa có KOL"}
                              {task.booking.product ? ` • ${task.booking.product.name}` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">
                            Không liên kết
                          </span>
                        )}
                      </td>

                      {/* Deadline & Overdue */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100">
                            {formatDateTime(task.due_at)}
                          </div>
                          {overdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                              Quá hạn
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {task.status === "completed" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {TASK_STATUS_LABELS.completed}
                          </span>
                        ) : task.status === "cancelled" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                            {TASK_STATUS_LABELS.cancelled}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {TASK_STATUS_LABELS.pending}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {task.status === "pending" && (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleComplete(task)}
                                title="Hoàn thành công việc"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-xs font-medium transition cursor-pointer"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Hoàn thành</span>
                              </button>

                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setConfirmCancelTask(task)}
                                title="Hủy công việc"
                                className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleOpenEdit(task)}
                            title="Chỉnh sửa công việc"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setConfirmDeleteTask(task)}
                            title="Xóa công việc"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(isCreateOpen || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                {editingTask ? "Chỉnh sửa công việc" : "Tạo công việc"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingTask(null);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Công việc <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Giục KOL gửi draft video vòng 1..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/20"
                />
              </div>

              {/* Task Type */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Loại công việc
                </label>
                <CustomSelect
                  value={formType}
                  onChange={(val) => setFormType(val as TaskType)}
                  options={typeOptions}
                  placeholder="Chọn loại công việc..."
                />
              </div>

              {/* Booking Context Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Hợp tác liên quan (Không bắt buộc)
                </label>
                <CustomSelect
                  value={formBookingId}
                  onChange={(val) => setFormBookingId(val)}
                  options={bookingOptions}
                  placeholder="Chọn hợp tác để liên kết..."
                />

                {/* Booking Context Preview Box */}
                {selectedBookingPreview && (
                  <div className="mt-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {selectedBookingPreview.code || "Hợp tác"}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-medium">
                        @{selectedBookingPreview.kol?.username}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Sản phẩm:{" "}
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                        {selectedBookingPreview.product?.name || "Chưa chọn"}
                      </span>
                    </div>
                    {selectedBookingPreview.expected_post_at && (
                      <div className="text-[11px] text-zinc-500">
                        Hạn chót đăng video:{" "}
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {selectedBookingPreview.expected_post_at}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Deadline (Date + Time) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ngày hạn chót (Deadline) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Giờ
                  </label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/20"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Chi tiết yêu cầu hoặc lưu ý nội bộ..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/20 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isPending
                    ? "Đang lưu..."
                    : editingTask
                    ? "Lưu thay đổi"
                    : "Tạo công việc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {confirmCancelTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Xác nhận hủy công việc?
              </h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Bạn có chắc muốn hủy công việc{" "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                  &quot;{confirmCancelTask.title}&quot;
                </span>
                ? Công việc này sẽ được chuyển sang trạng thái đã hủy.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Đang hủy..." : "Hủy công việc"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDeleteTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Xóa công việc
              </h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Bạn có chắc muốn xóa công việc này?
              </p>
              <div className="mt-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {confirmDeleteTask.title}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Đang xóa..." : "Xóa công việc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
