import { getProducts } from "@/lib/services/products";
import ProductsClient from "./products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { data: products, error } = await getProducts();

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900 text-sm">
        <p className="font-semibold">Không thể tải danh sách sản phẩm</p>
        <p className="text-xs mt-1">{error}</p>
      </div>
    );
  }

  return <ProductsClient initialProducts={products ?? []} />;
}
