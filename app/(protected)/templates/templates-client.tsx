"use client";

import { useState, useMemo, useTransition } from "react";
import type {
  Template,
  TemplateCategory,
  CreateTemplateInput,
  UpdateTemplateInput,
} from "@/lib/types/template";
import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CATEGORIES,
} from "@/lib/types/template";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/services/templates";
import CustomSelect, { type SelectOption } from "@/components/ui/custom-select";

interface TemplatesClientProps {
  initialTemplates: Template[];
}

const CATEGORY_STYLES: Record<
  TemplateCategory,
  { bg: string; text: string; border: string; dot: string }
> = {
  invitation: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/60",
    dot: "bg-blue-500",
  },
  confirmation: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
  },
  brief: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/60",
    dot: "bg-purple-500",
  },
  sample_sent: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800/60",
    dot: "bg-amber-500",
  },
  video_reminder: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800/60",
    dot: "bg-rose-500",
  },
  ads_code_request: {
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800/60",
    dot: "bg-sky-500",
  },
  feedback: {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    border: "border-fuchsia-200 dark:border-fuchsia-800/60",
    dot: "bg-fuchsia-500",
  },
  general: {
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-700 dark:text-zinc-300",
    border: "border-zinc-200 dark:border-zinc-700",
    dot: "bg-zinc-500",
  },
};

function formatDateTime(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function TemplatesClient({
  initialTemplates,
}: TemplatesClientProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] =
    useState<Template | null>(null);

  // Copied indicator per template ID
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [, startTransition] = useTransition();

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3000);
  };

  const handleCopyContent = async (template: Template) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(template.content);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = template.content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedId(template.id);
      showToast("Đã sao chép văn mẫu");
      setTimeout(() => {
        setCopiedId((curr) => (curr === template.id ? null : curr));
      }, 2000);
    } catch {
      showToast("Không thể sao chép văn mẫu vào clipboard", "error");
    }
  };

  // Filter and search
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const titleMatch = t.title.toLowerCase().includes(term);
        const contentMatch = t.content.toLowerCase().includes(term);
        const categoryLabel = (
          TEMPLATE_CATEGORY_LABELS[t.category] || ""
        ).toLowerCase();
        const categoryMatch = categoryLabel.includes(term);
        const varMatch = (t.variables_description || "")
          .toLowerCase()
          .includes(term);

        return titleMatch || contentMatch || categoryMatch || varMatch;
      }
      return true;
    });
  }, [templates, activeCategory, searchTerm]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    TEMPLATE_CATEGORIES.forEach((cat) => {
      counts[cat.value] = 0;
    });
    templates.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [templates]);

  // Form states for Create
  const [createForm, setCreateForm] = useState<CreateTemplateInput>({
    title: "",
    category: "invitation",
    content: "",
    variables_description: "",
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states for Edit
  const [editForm, setEditForm] = useState<UpdateTemplateInput>({
    title: "",
    category: "invitation",
    content: "",
    variables_description: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Category options for custom select
  const categorySelectOptions: SelectOption[] = useMemo(() => {
    return TEMPLATE_CATEGORIES.map((cat) => ({
      value: cat.value,
      label: cat.label,
    }));
  }, []);

  const handleOpenEdit = (t: Template) => {
    setEditingTemplate(t);
    setEditForm({
      title: t.title,
      category: t.category,
      content: t.content,
      variables_description: t.variables_description || "",
    });
    setEditError(null);
    if (previewTemplate?.id === t.id) {
      setPreviewTemplate(null);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      setCreateError("Vui lòng nhập tiêu đề văn mẫu");
      return;
    }
    if (!createForm.content.trim()) {
      setCreateError("Vui lòng nhập nội dung văn mẫu");
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    const res = await createTemplate(createForm);

    setCreateSubmitting(false);

    if (res.error || !res.data) {
      setCreateError(res.error || "Không thể tạo văn mẫu");
      return;
    }

    const newTemplate = res.data;
    startTransition(() => {
      setTemplates((prev) => [newTemplate, ...prev]);
    });

    setIsCreateOpen(false);
    setCreateForm({
      title: "",
      category: "invitation",
      content: "",
      variables_description: "",
    });
    showToast("Đã tạo văn mẫu thành công");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    if (editForm.title !== undefined && !editForm.title.trim()) {
      setEditError("Vui lòng nhập tiêu đề văn mẫu");
      return;
    }
    if (editForm.content !== undefined && !editForm.content.trim()) {
      setEditError("Vui lòng nhập nội dung văn mẫu");
      return;
    }

    setEditSubmitting(true);
    setEditError(null);

    const res = await updateTemplate(editingTemplate.id, editForm);

    setEditSubmitting(false);

    if (res.error || !res.data) {
      setEditError(res.error || "Không thể cập nhật văn mẫu");
      return;
    }

    const updated = res.data;
    startTransition(() => {
      setTemplates((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    });

    setEditingTemplate(null);
    showToast("Đã cập nhật văn mẫu");
  };

  const handleDeleteSubmit = async () => {
    if (!confirmDeleteTemplate) return;

    setDeleteSubmitting(true);
    const res = await deleteTemplate(confirmDeleteTemplate.id);
    setDeleteSubmitting(false);

    if (res.error) {
      showToast(res.error, "error");
      return;
    }

    const deletedId = confirmDeleteTemplate.id;
    startTransition(() => {
      setTemplates((prev) => prev.filter((t) => t.id !== deletedId));
    });

    setConfirmDeleteTemplate(null);
    if (previewTemplate?.id === deletedId) {
      setPreviewTemplate(null);
    }
    showToast("Đã xóa văn mẫu");
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5 ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
              : "bg-red-600 text-white border-red-500 shadow-red-500/20"
          }`}
        >
          {toastMessage.type === "success" ? (
            <svg
              className="w-5 h-5 text-white flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-white flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Văn mẫu
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Quản lý các nội dung mẫu thường dùng khi làm việc với KOL
          </p>
        </div>
        <button
          onClick={() => {
            setCreateForm({
              title: "",
              category: "invitation",
              content: "",
              variables_description: "",
            });
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          + Tạo văn mẫu
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative max-w-md">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
            placeholder="Tìm kiếm văn mẫu theo tiêu đề, nội dung, danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-medium cursor-pointer"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeCategory === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            }`}
          >
            Tất cả ({categoryCounts.all ?? 0})
          </button>
          {TEMPLATE_CATEGORIES.map((cat) => {
            const count = categoryCounts[cat.value] || 0;
            const isSelected = activeCategory === cat.value;
            const style = CATEGORY_STYLES[cat.value];
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Cards Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {searchTerm || activeCategory !== "all"
              ? "Không tìm thấy văn mẫu phù hợp"
              : "Chưa có văn mẫu"}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchTerm || activeCategory !== "all"
              ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác."
              : "Tạo văn mẫu để nhanh chóng sử dụng lại các nội dung thường dùng."}
          </p>
          {!searchTerm && activeCategory === "all" && (
            <button
              onClick={() => {
                setCreateForm({
                  title: "",
                  category: "invitation",
                  content: "",
                  variables_description: "",
                });
                setCreateError(null);
                setIsCreateOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all cursor-pointer"
            >
              + Tạo văn mẫu
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const catStyle = CATEGORY_STYLES[template.category];
            const isCopied = copiedId === template.id;

            return (
              <div
                key={template.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow transition-all"
              >
                {/* Top: Category Badge & Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`}
                    />
                    {TEMPLATE_CATEGORY_LABELS[template.category] ||
                      template.category}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(template)}
                      title="Chỉnh sửa văn mẫu"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                      onClick={() => setConfirmDeleteTemplate(template)}
                      title="Xóa văn mẫu"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                </div>

                {/* Middle: Title & Content Preview */}
                <div
                  onClick={() => setPreviewTemplate(template)}
                  className="flex-1 cursor-pointer"
                >
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
                    {template.title}
                  </h3>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 mb-3 text-xs text-zinc-600 dark:text-zinc-300 font-mono line-clamp-4 whitespace-pre-wrap">
                    {template.content}
                  </div>
                  {template.variables_description && (
                    <div className="mb-3 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <svg
                        className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <span className="line-clamp-1">
                        Biến: {template.variables_description}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom: Updated Date & Primary Action */}
                <div className="pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-400">
                    Cập nhật: {formatDateTime(template.updated_at)}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      onClick={() => handleCopyContent(template)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isCopied
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/60"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Đã sao chép
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                          Sao chép
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Xem Văn Mẫu (Preview Modal) */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      CATEGORY_STYLES[previewTemplate.category].bg
                    } ${CATEGORY_STYLES[previewTemplate.category].text} ${
                      CATEGORY_STYLES[previewTemplate.category].border
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        CATEGORY_STYLES[previewTemplate.category].dot
                      }`}
                    />
                    {TEMPLATE_CATEGORY_LABELS[previewTemplate.category] ||
                      previewTemplate.category}
                  </span>
                  <span className="text-xs text-zinc-400">
                    Cập nhật: {formatDateTime(previewTemplate.updated_at)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {previewTemplate.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  Nội dung văn mẫu
                </label>
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-mono leading-relaxed select-text">
                  {previewTemplate.content}
                </div>
              </div>

              {previewTemplate.variables_description && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    Biến sử dụng
                  </label>
                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 whitespace-pre-wrap">
                    {previewTemplate.variables_description}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(previewTemplate)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Chỉnh sửa
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => handleCopyContent(previewTemplate)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    copiedId === previewTemplate.id
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20"
                  }`}
                >
                  {copiedId === previewTemplate.id ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                        />
                      </svg>
                      Sao chép nội dung
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tạo Văn Mẫu (Create Modal) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Tạo văn mẫu
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="flex-1 overflow-y-auto p-5 space-y-4"
            >
              {createError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
                  {createError}
                </div>
              )}

              {/* Tiêu đề */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tin nhắn mời hợp tác KOL"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Danh mục */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={categorySelectOptions}
                  value={createForm.category}
                  onChange={(val) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      category: val as TemplateCategory,
                    }))
                  }
                  placeholder="Chọn danh mục..."
                />
              </div>

              {/* Nội dung */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Chào {{kol_name}},&#10;Bên mình muốn mời bạn hợp tác cho sản phẩm {{product_name}}..."
                  value={createForm.content}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  Có thể sử dụng các placeholder như: &#123;&#123;kol_name&#125;&#125;, &#123;&#123;product_name&#125;&#125;, &#123;&#123;expected_post_date&#125;&#125;...
                </p>
              </div>

              {/* Mô tả biến */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Mô tả biến (Không bắt buộc)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: {{kol_name}}: Tên KOL, {{product_name}}: Tên sản phẩm"
                  value={createForm.variables_description || ""}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      variables_description: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  {createSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo văn mẫu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Chỉnh Sửa Văn Mẫu (Edit Modal) */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                Chỉnh sửa văn mẫu
              </h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="flex-1 overflow-y-auto p-5 space-y-4"
            >
              {editError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 text-xs border border-red-200 dark:border-red-900">
                  {editError}
                </div>
              )}

              {/* Tiêu đề */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Danh mục */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  options={categorySelectOptions}
                  value={editForm.category || "invitation"}
                  onChange={(val) =>
                    setEditForm((prev) => ({
                      ...prev,
                      category: val as TemplateCategory,
                    }))
                  }
                  placeholder="Chọn danh mục..."
                />
              </div>

              {/* Nội dung */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Nội dung <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  value={editForm.content || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                />
              </div>

              {/* Mô tả biến */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Mô tả biến
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: {{kol_name}}: Tên KOL"
                  value={editForm.variables_description || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      variables_description: e.target.value,
                    }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  {editSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xác Nhận Xóa Văn Mẫu */}
      {confirmDeleteTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Xác nhận xóa văn mẫu
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1.5">
              Bạn có chắc muốn xóa văn mẫu này?
            </p>
            <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2">
              {confirmDeleteTemplate.title}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteTemplate(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteSubmit}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                {deleteSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa văn mẫu"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
