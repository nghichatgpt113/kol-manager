"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import type { Product, CreateProductInput } from "@/lib/types/product";
import { createProduct, updateProduct, deleteProduct } from "@/lib/services/products";

interface ProductsClientProps {
  initialProducts: Product[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<CreateProductInput>({
    name: "",
    brand: "",
    sku: "",
    product_url: "",
    affiliate_link: "",
    sample_cost: 0,
    default_commission_rate: 0,
    default_ads_rate: 0,
    description: "",
    notes: "",
    is_active: true,
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Escape key handler for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (confirmDeleteProduct) setConfirmDeleteProduct(null);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmDeleteProduct, isModalOpen]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "inactive" && !p.is_active);

      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.brand && p.brand.toLowerCase().includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [products, statusFilter, searchQuery]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      brand: "",
      sku: "",
      product_url: "",
      affiliate_link: "",
      sample_cost: 0,
      default_commission_rate: 15,
      default_ads_rate: 7,
      description: "",
      notes: "",
      is_active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      brand: p.brand || "",
      sku: p.sku || "",
      product_url: p.product_url || "",
      affiliate_link: p.affiliate_link || "",
      sample_cost: p.sample_cost,
      default_commission_rate: p.default_commission_rate,
      default_ads_rate: p.default_ads_rate,
      description: p.description || "",
      notes: p.notes || "",
      is_active: p.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formData.name.trim();
    if (!name) {
      setFormError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    const sampleCost = Number(formData.sample_cost ?? 0);
    if (isNaN(sampleCost) || sampleCost < 0) {
      setFormError("Chi phí mẫu phải lớn hơn hoặc bằng 0.");
      return;
    }

    const commissionRate = Number(formData.default_commission_rate ?? 0);
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      setFormError("% Hoa hồng phải nằm trong khoảng từ 0% đến 100%.");
      return;
    }

    const adsRate = Number(formData.default_ads_rate ?? 0);
    if (isNaN(adsRate) || adsRate < 0 || adsRate > 100) {
      setFormError("% Ngân sách ads phải nằm trong khoảng từ 0% đến 100%.");
      return;
    }

    startTransition(async () => {
      if (editingProduct) {
        const res = await updateProduct(editingProduct.id, {
          ...formData,
          name,
          sample_cost: sampleCost,
          default_commission_rate: commissionRate,
          default_ads_rate: adsRate,
        });

        if (res.error) {
          setFormError(res.error);
        } else if (res.data) {
          setProducts((prev) =>
            prev.map((item) => (item.id === res.data!.id ? res.data! : item))
          );
          setIsModalOpen(false);
        }
      } else {
        const res = await createProduct({
          ...formData,
          name,
          sample_cost: sampleCost,
          default_commission_rate: commissionRate,
          default_ads_rate: adsRate,
        });

        if (res.error) {
          setFormError(res.error);
        } else if (res.data) {
          setProducts((prev) => [res.data!, ...prev]);
          setIsModalOpen(false);
        }
      }
    });
  };

  const handleDelete = (p: Product) => {
    setConfirmDeleteProduct(null);
    setDeletingId(p.id);
    setActionError(null);

    startTransition(async () => {
      const res = await deleteProduct(p.id);
      if (!res.success) {
        setActionError(res.error || "Không thể xóa sản phẩm.");
      } else {
        setProducts((prev) => prev.filter((item) => item.id !== p.id));
      }
      setDeletingId(null);
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Danh mục Sản phẩm
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Quản lý danh mục sản phẩm tiếp thị, giá vốn hàng mẫu và tỷ lệ hoa hồng/ngân sách quảng cáo mặc định.
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
          Thêm sản phẩm mới
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

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
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
            placeholder="Tìm theo tên sản phẩm, thương hiệu, mã SKU..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              statusFilter === "all"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Tất cả ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              statusFilter === "active"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Đang hoạt động ({products.filter((p) => p.is_active).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              statusFilter === "inactive"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            Đã lưu trữ ({products.filter((p) => !p.is_active).length})
          </button>
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {products.length === 0 ? "Chưa có sản phẩm nào" : "Không tìm thấy sản phẩm phù hợp"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {products.length === 0
              ? "Tạo sản phẩm đầu tiên để liên kết vào các booking hợp tác nhà sáng tạo."
              : "Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc trạng thái."}
          </p>
          {products.length === 0 && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
            >
              Thêm sản phẩm đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-3.5">Sản phẩm</th>
                  <th className="px-6 py-3.5">Mã SKU / Thương hiệu</th>
                  <th className="px-6 py-3.5">Giá vốn mẫu</th>
                  <th className="px-6 py-3.5">Hoa hồng (%)</th>
                  <th className="px-6 py-3.5">Định mức Ads (%)</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          {p.name}
                          {p.product_url && (
                            <a
                              href={p.product_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                              title="Xem link sản phẩm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                        {p.description && (
                          <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{p.description}</p>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <div className="font-mono text-zinc-800 dark:text-zinc-200">{p.sku || "—"}</div>
                      <div className="text-zinc-500">{p.brand || "—"}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(p.sample_cost)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {p.default_commission_rate}%
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {p.default_ads_rate}%
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.is_active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                        }`}
                      >
                        {p.is_active ? "Đang dùng" : "Lưu trữ"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === p.id || isPending}
                          onClick={() => setConfirmDeleteProduct(p)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer disabled:opacity-50"
                        >
                          {deletingId === p.id ? "Đang xóa..." : "Xóa"}
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

      {/* Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default"
          >
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {editingProduct ? "Chỉnh sửa Sản phẩm" : "Thêm Sản phẩm mới"}
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

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Combo Gội Xả CHESY Collagen 1000ml"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Thương hiệu
                  </label>
                  <input
                    type="text"
                    value={formData.brand || ""}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="CHESY"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mã SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku || ""}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="CHESY-COL-1000"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Giá vốn mẫu (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.sample_cost || 0}
                    onChange={(e) => setFormData({ ...formData, sample_cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Hoa hồng (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.default_commission_rate || 0}
                    onChange={(e) => setFormData({ ...formData, default_commission_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Định mức Ads (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.default_ads_rate || 0}
                    onChange={(e) => setFormData({ ...formData, default_ads_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Link trang sản phẩm
                  </label>
                  <input
                    type="url"
                    value={formData.product_url || ""}
                    onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                    placeholder="https://tiktok.com/view/..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Link tiếp thị Affiliate
                  </label>
                  <input
                    type="url"
                    value={formData.affiliate_link || ""}
                    onChange={(e) => setFormData({ ...formData, affiliate_link: e.target.value })}
                    placeholder="https://vt.tiktok.com/..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Điểm bán hàng (USP) / Mô tả tóm tắt
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Các điểm bán hàng cốt lõi gửi cho KOL làm video..."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 cursor-pointer"
                />
                <label htmlFor="is_active" className="text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  Sẵn sàng áp dụng cho booking KOL (Đang hoạt động)
                </label>
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
                  {isPending ? "Đang lưu..." : editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteProduct && (
        <div
          onClick={() => setConfirmDeleteProduct(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl p-6 space-y-4 cursor-default"
          >
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Xác nhận xóa sản phẩm &quot;{confirmDeleteProduct.name}&quot;?
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Bạn có chắc chắn muốn xóa sản phẩm này? Nếu sản phẩm đã từng được gán vào các booking trước đó, hệ thống sẽ tự động gỡ liên kết an toàn.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteProduct)}
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
