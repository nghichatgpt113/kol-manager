"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import type { Kol, CreateKolInput, KolPlatform } from "@/lib/types/kol";
import { createKol, updateKol, deleteKol } from "@/lib/services/kols";
import CustomSelect from "@/components/ui/custom-select";
import ComboboxInput from "@/components/ui/combobox-input";
import PlatformIcon from "@/components/icons/platform-icon";
import NicheBadge from "@/components/kols/niche-badge";

interface KolsClientProps {
  initialKols: Kol[];
}

const PLATFORMS: { label: string; value: KolPlatform }[] = [
  { label: "TikTok", value: "tiktok" },
  { label: "Facebook", value: "facebook" },
  { label: "Instagram", value: "instagram" },
  { label: "YouTube", value: "youtube" },
  { label: "Shopee", value: "shopee" },
  { label: "Khác", value: "other" },
];

export default function KolsClient({ initialKols }: KolsClientProps) {
  const [kols, setKols] = useState<Kol[]>(initialKols);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKol, setEditingKol] = useState<Kol | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateKolInput>({
    username: "",
    platform: "tiktok",
    display_name: "",
    channel_url: "",
    followers_count: 0,
    niche: "",
    contact_phone: "",
    contact_zalo: "",
    contact_email: "",
    address: "",
    notes: "",
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteKol, setConfirmDeleteKol] = useState<Kol | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Escape key handler for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDeleteKol) setConfirmDeleteKol(null);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDeleteKol, isModalOpen]);

  // Filtered KOLs
  const filteredKols = useMemo(() => {
    return kols.filter((item) => {
      const matchesPlatform =
        selectedPlatform === "all" || item.platform === selectedPlatform;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.username.toLowerCase().includes(query) ||
        (item.display_name && item.display_name.toLowerCase().includes(query)) ||
        (item.niche && item.niche.toLowerCase().includes(query)) ||
        (item.contact_phone && item.contact_phone.includes(query));
      return matchesPlatform && matchesSearch;
    });
  }, [kols, selectedPlatform, searchQuery]);

  const openCreateModal = () => {
    setEditingKol(null);
    setFormData({
      username: "",
      platform: "tiktok",
      display_name: "",
      channel_url: "",
      followers_count: 0,
      niche: "",
      contact_phone: "",
      contact_zalo: "",
      contact_email: "",
      address: "",
      notes: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (kol: Kol) => {
    setEditingKol(kol);
    setFormData({
      username: kol.username,
      platform: kol.platform,
      display_name: kol.display_name || "",
      channel_url: kol.channel_url || "",
      followers_count: kol.followers_count || 0,
      niche: kol.niche || "",
      contact_phone: kol.contact_phone || "",
      contact_zalo: kol.contact_zalo || "",
      contact_email: kol.contact_email || "",
      address: kol.address || "",
      notes: kol.notes || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const username = formData.username.trim();
    if (!username) {
      setFormError("Vui lòng nhập Username của KOL.");
      return;
    }

    const followersCount = Number(formData.followers_count ?? 0);
    if (isNaN(followersCount) || followersCount < 0) {
      setFormError("Số lượng người theo dõi không được là số âm.");
      return;
    }

    startTransition(async () => {
      if (editingKol) {
        // Update
        const res = await updateKol(editingKol.id, {
          ...formData,
          username,
          followers_count: followersCount,
        });

        if (res.error) {
          setFormError(res.error);
        } else if (res.data) {
          setKols((prev) =>
            prev.map((k) => (k.id === res.data!.id ? res.data! : k))
          );
          setIsModalOpen(false);
        }
      } else {
        // Create
        const res = await createKol({
          ...formData,
          username,
          followers_count: followersCount,
        });

        if (res.error) {
          setFormError(res.error);
        } else if (res.data) {
          setKols((prev) => [res.data!, ...prev]);
          setIsModalOpen(false);
        }
      }
    });
  };

  const handleDelete = (kol: Kol) => {
    setConfirmDeleteKol(null);
    setDeletingId(kol.id);
    setActionError(null);

    startTransition(async () => {
      const res = await deleteKol(kol.id);
      if (!res.success) {
        setActionError(res.error || "Không thể xóa KOL.");
      } else {
        setKols((prev) => prev.filter((k) => k.id !== kol.id));
      }
      setDeletingId(null);
    });
  };

  const formatFollowers = (count: number) => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  const getPlatformBadge = (platform: KolPlatform) => {
    switch (platform) {
      case "tiktok":
        return "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700";
      case "facebook":
        return "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60";
      case "instagram":
        return "bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-200 dark:border-pink-900/60";
      case "youtube":
        return "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/60";
      case "shopee":
        return "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700";
    }
  };

  const getActiveTabStyle = (platform: string) => {
    switch (platform) {
      case "facebook":
        return "bg-blue-50 text-blue-700 border-blue-200/90 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/80 ring-1 ring-blue-500/20";
      case "instagram":
        return "bg-pink-50 text-pink-700 border-pink-200/90 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800/80 ring-1 ring-pink-500/20";
      case "youtube":
        return "bg-red-50 text-red-700 border-red-200/90 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800/80 ring-1 ring-red-500/20";
      case "shopee":
        return "bg-orange-50 text-orange-700 border-orange-200/90 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800/80 ring-1 ring-orange-500/20";
      case "tiktok":
        return "bg-zinc-100 text-zinc-900 border-zinc-300/90 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 ring-1 ring-zinc-400/25";
      case "all":
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200/90 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/80 ring-1 ring-indigo-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Danh bạ KOL / KOC
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Quản lý hồ sơ nhà sáng tạo, kênh mạng xã hội, thông tin liên hệ và số lượng người theo dõi.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm KOL mới
        </button>
      </div>

      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-semibold underline ml-4 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo username, tên hiển thị, ngành hàng, SĐT..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedPlatform("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap border shadow-2xs ${
              selectedPlatform === "all"
                ? getActiveTabStyle("all")
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent shadow-none"
            }`}
          >
            Tất cả ({kols.length})
          </button>
          {PLATFORMS.map((p) => {
            const count = kols.filter((k) => k.platform === p.value).length;
            const isSelected = selectedPlatform === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setSelectedPlatform(p.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap border shadow-2xs ${
                  isSelected
                    ? getActiveTabStyle(p.value)
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent shadow-none"
                }`}
              >
                <PlatformIcon platform={p.value} size="xs" />
                <span>{p.label}</span>
                <span className={`text-[11px] ${isSelected ? "font-bold opacity-80" : "opacity-60"}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KOL List / Table */}
      {filteredKols.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {kols.length === 0 ? "Chưa có KOL nào" : "Không tìm thấy KOL phù hợp"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {kols.length === 0
              ? "Bắt đầu xây dựng danh bạ bằng cách thêm KOL hoặc KOC đầu tiên của bạn."
              : "Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc nền tảng để tìm kết quả."}
          </p>
          {kols.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
            >
              Thêm KOL đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Nhà sáng tạo</th>
                  <th className="px-6 py-3.5">Nền tảng</th>
                  <th className="px-6 py-3.5">Người theo dõi</th>
                  <th className="px-6 py-3.5">Ngành hàng</th>
                  <th className="px-6 py-3.5">Liên hệ</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredKols.map((kol) => (
                  <tr key={kol.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          {kol.display_name || kol.username}
                          {kol.channel_url && (
                            <a
                              href={kol.channel_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                              title="Xem kênh"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 font-mono">@{kol.username}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider ${getPlatformBadge(
                          kol.platform
                        )}`}
                      >
                        <PlatformIcon platform={kol.platform} size="xs" />
                        <span className="capitalize">{kol.platform}</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatFollowers(kol.followers_count)}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <NicheBadge niche={kol.niche} />
                    </td>

                    <td className="px-6 py-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
                      {kol.contact_phone && <div>📞 {kol.contact_phone}</div>}
                      {kol.contact_zalo && <div>💬 Zalo: {kol.contact_zalo}</div>}
                      {kol.contact_email && <div>✉️ {kol.contact_email}</div>}
                      {!kol.contact_phone && !kol.contact_zalo && !kol.contact_email && (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(kol)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === kol.id || isPending}
                          onClick={() => setConfirmDeleteKol(kol)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer disabled:opacity-50"
                        >
                          {deletingId === kol.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
          >
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingKol ? "Chỉnh sửa KOL" : "Thêm KOL mới"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tài khoản / Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="lananh_beauty (không có @)"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Nền tảng <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={formData.platform}
                    onChange={(val) => setFormData({ ...formData, platform: val as KolPlatform })}
                    options={PLATFORMS.map((p) => ({
                      value: p.value,
                      label: p.label,
                      icon: <PlatformIcon platform={p.value} size="sm" />,
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tên hiển thị / Biệt danh
                  </label>
                  <input
                    type="text"
                    value={formData.display_name || ""}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Lan Anh"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                {/* Followers Count */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Số lượng người theo dõi
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.followers_count || 0}
                    onChange={(e) => setFormData({ ...formData, followers_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Channel URL */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Liên kết kênh / Trang cá nhân
                  </label>
                  <input
                    type="url"
                    value={formData.channel_url || ""}
                    onChange={(e) => setFormData({ ...formData, channel_url: e.target.value })}
                    placeholder="https://tiktok.com/@..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                {/* Niche */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ngành hàng / Lĩnh vực
                  </label>
                  <ComboboxInput
                    value={formData.niche || ""}
                    onChange={(val) => setFormData({ ...formData, niche: val })}
                    placeholder="Chọn ngành hàng hoặc tự gõ..."
                  />
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone || ""}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="0988..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Zalo
                  </label>
                  <input
                    type="text"
                    value={formData.contact_zalo || ""}
                    onChange={(e) => setFormData({ ...formData, contact_zalo: e.target.value })}
                    placeholder="Số Zalo hoặc link"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email || ""}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="contact@..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Địa chỉ nhận hàng mặc định
                </label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Ghi chú nội bộ
                </label>
                <textarea
                  rows={2}
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Phong cách làm việc, lưu ý giá cả, thỏa thuận..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Đang lưu..." : editingKol ? "Lưu thay đổi" : "Tạo KOL"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteKol && (
        <div
          onClick={() => setConfirmDeleteKol(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 space-y-4 cursor-default"
          >
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Xác nhận xóa KOL @{confirmDeleteKol.username}?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Bạn có chắc chắn muốn xóa nhà sáng tạo này? Thao tác này không thể hoàn tác. Nếu KOL đang có booking hợp tác, cơ sở dữ liệu sẽ bảo vệ và chặn xóa ngoài ý muốn.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteKol(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteKol)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition shadow-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
