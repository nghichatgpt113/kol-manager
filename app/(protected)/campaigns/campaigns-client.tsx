"use client";

import { useState, useTransition, useMemo } from "react";
import type { Campaign, CreateCampaignInput, CampaignStatus } from "@/lib/types/campaign";
import { createCampaign, updateCampaign, deleteCampaign } from "@/lib/services/campaigns";

interface CampaignsClientProps {
  initialCampaigns: Campaign[];
}

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  planning: {
    label: "Planning",
    bg: "bg-amber-500/10 border-amber-500/20",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  active: {
    label: "Active",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  paused: {
    label: "Paused",
    bg: "bg-zinc-500/10 border-zinc-500/20",
    text: "text-zinc-600 dark:text-zinc-400",
    dot: "bg-zinc-400",
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-500/10 border-blue-500/20",
    text: "text-blue-700 dark:text-blue-400",
    dot: "bg-blue-500",
  },
};

export default function CampaignsClient({ initialCampaigns }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateCampaignInput>({
    name: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    budget: 0,
    start_date: "",
    end_date: "",
    status: "active",
    notes: "",
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteCampaign, setConfirmDeleteCampaign] = useState<Campaign | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Metrics
  const metrics = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === "active").length;
    const totalBudget = campaigns.reduce((acc, c) => acc + (Number(c.budget) || 0), 0);
    const completed = campaigns.filter((c) => c.status === "completed").length;
    return { total, active, totalBudget, completed };
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((camp) => {
      const matchesStatus = statusFilter === "all" || camp.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        camp.name.toLowerCase().includes(q) ||
        (camp.notes && camp.notes.toLowerCase().includes(q)) ||
        (camp.month && camp.year && `${camp.month}/${camp.year}`.includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [campaigns, statusFilter, searchQuery]);

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditingCampaign(null);
    const now = new Date();
    setFormData({
      name: "",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      budget: 0,
      start_date: "",
      end_date: "",
      status: "active",
      notes: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (camp: Campaign) => {
    setEditingCampaign(camp);
    setFormData({
      name: camp.name,
      month: camp.month,
      year: camp.year,
      budget: camp.budget,
      start_date: camp.start_date || "",
      end_date: camp.end_date || "",
      status: camp.status,
      notes: camp.notes || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Handle submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError("Campaign name is required.");
      return;
    }

    if (formData.month !== undefined && formData.month !== null && formData.month !== ("" as unknown)) {
      const m = Number(formData.month);
      if (isNaN(m) || m < 1 || m > 12) {
        setFormError("Month must be between 1 and 12.");
        return;
      }
    }

    if (formData.year !== undefined && formData.year !== null && formData.year !== ("" as unknown)) {
      const y = Number(formData.year);
      if (isNaN(y) || y < 2020) {
        setFormError("Year must be 2020 or later.");
        return;
      }
    }

    if (formData.budget !== undefined) {
      const b = Number(formData.budget);
      if (isNaN(b) || b < 0) {
        setFormError("Budget must be a non-negative number.");
        return;
      }
    }

    startTransition(async () => {
      if (editingCampaign) {
        const res = await updateCampaign(editingCampaign.id, formData);
        if (res.error) {
          setFormError(res.error);
        } else if (res.data) {
          setCampaigns((prev) =>
            prev.map((c) => (c.id === editingCampaign.id ? res.data! : c))
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await createCampaign(formData);
        if (res.error) {
          setFormError(res.error);
        } else if (res.data) {
          setCampaigns((prev) => [res.data!, ...prev]);
          setIsModalOpen(false);
        }
      }
    });
  };

  // Handle Delete
  const handleDeleteConfirm = () => {
    if (!confirmDeleteCampaign) return;
    setActionError(null);
    setDeletingId(confirmDeleteCampaign.id);

    startTransition(async () => {
      const res = await deleteCampaign(confirmDeleteCampaign.id);
      setDeletingId(null);
      if (res.error) {
        setActionError(res.error);
        setConfirmDeleteCampaign(null);
      } else {
        setCampaigns((prev) => prev.filter((c) => c.id !== confirmDeleteCampaign.id));
        setConfirmDeleteCampaign(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Campaigns
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage monthly marketing campaigns, budgets, and schedules.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 font-medium text-sm transition-all shadow-sm active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Campaign
        </button>
      </div>

      {/* Global Action Error */}
      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm flex items-start justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-red-700 dark:text-red-400 hover:opacity-75 font-semibold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Total Campaigns
          </span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {metrics.total}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Active Now
          </span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {metrics.active}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Total Budget
          </span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {metrics.totalBudget.toLocaleString("vi-VN")} ₫
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Completed
          </span>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {metrics.completed}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search campaigns by name, period..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {(["all", "active", "planning", "paused", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all whitespace-nowrap ${
                statusFilter === status
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                  : "hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        {filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              No campaigns found
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              {campaigns.length === 0
                ? "Get started by adding your first marketing campaign to manage budgets and timeline."
                : "No campaigns match your search or filter criteria."}
            </p>
            {campaigns.length === 0 && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-all"
              >
                Add Your First Campaign
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/75 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Campaign Name</th>
                  <th className="py-3.5 px-4">Period / Dates</th>
                  <th className="py-3.5 px-4">Budget</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredCampaigns.map((camp) => {
                  const cfg = STATUS_CONFIG[camp.status];
                  return (
                    <tr
                      key={camp.id}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {camp.name}
                        </div>
                        {camp.notes && (
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 max-w-xs">
                            {camp.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-zinc-900 dark:text-zinc-100 font-medium">
                          {camp.month && camp.year
                            ? `T${camp.month} / ${camp.year}`
                            : camp.year
                            ? `${camp.year}`
                            : "—"}
                        </div>
                        {(camp.start_date || camp.end_date) && (
                          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {camp.start_date || "?"} → {camp.end_date || "?"}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">
                        {Number(camp.budget).toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handleOpenEdit(camp)}
                            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                            title="Edit campaign"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCampaign(camp)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete campaign"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
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
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {editingCampaign ? "Edit Campaign" : "New Campaign"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {editingCampaign
                    ? "Update campaign details and budget"
                    : "Create a new campaign period for tracking bookings"}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-medium">
                  {formError}
                </div>
              )}

              {/* Campaign Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mega Sale 9.9 Autumn"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              {/* Month and Year */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Month (1 - 12)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    placeholder="9"
                    value={formData.month ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        month: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Year (≥ 2020)
                  </label>
                  <input
                    type="number"
                    min={2020}
                    placeholder="2026"
                    value={formData.year ?? ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
              </div>

              {/* Budget and Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Budget (VND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    placeholder="0"
                    value={formData.budget ?? 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        budget: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as CampaignStatus,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date || ""}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ""}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Goals, target KPIs, special requirements..."
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 disabled:opacity-50 transition-all shadow-sm"
                >
                  {isPending ? "Saving..." : editingCampaign ? "Save Changes" : "Create Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Delete Campaign?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {confirmDeleteCampaign.name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteCampaign(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors shadow-sm"
              >
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
