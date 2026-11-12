import type { Metadata } from "next";
import Link from "next/link";

import { getAdminCategories } from "@/features/admin/categories/api";
import { getAdminProducts } from "@/features/admin/products/api";
import { Pagination } from "@/shared/components/ui/Pagination";
import { formatYen } from "@/shared/lib/format";

export const metadata: Metadata = { title: "Products" };

type PageProps = {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
};

/**
 * 商品一覧（Server Component）。検索・カテゴリ絞り込み・ページ送りはすべてURLのクエリで表し、
 * `<form method="get">`とLinkだけで動かす（状態を持たないのでClient Componentはいらない）。
 */
export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { q, category, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);

  const [result, categories] = await Promise.all([
    getAdminProducts({ q, category, page: currentPage }),
    getAdminCategories(),
  ]);

  function hrefFor(target: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (target > 1) params.set("page", String(target));
    return params.size > 0 ? `/admin/products?${params}` : "/admin/products";
  }

  return (
    <div className="p-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg tracking-widest uppercase">Products</h1>
        <Link
          href="/admin/products/new"
          className="border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          New Product
        </Link>
      </div>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="q" className="block text-[11px] tracking-widest text-graphite uppercase">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Product name"
            className="mt-2 w-56 border-b border-ink bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label htmlFor="category" className="block text-[11px] tracking-widest text-graphite uppercase">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={category ?? ""}
            className="mt-2 w-40 border-b border-ink bg-transparent py-2 text-sm outline-none"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="border border-ink px-6 py-2 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Filter
        </button>
      </form>

      {result.data.length === 0 ? (
        <p className="text-sm text-graphite">No products found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink text-left text-[11px] tracking-widest text-graphite uppercase">
                <th className="py-2 pr-4 font-normal">Name</th>
                <th className="py-2 pr-4 font-normal">Category</th>
                <th className="py-2 pr-4 font-normal">Price</th>
                <th className="py-2 pr-4 font-normal">Stock</th>
                <th className="py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((product) => (
                <tr key={product.id} className="border-b border-mist">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/products/${product.id}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-graphite">{product.category.name}</td>
                  <td className="py-3 pr-4 whitespace-nowrap">{formatYen(product.price)}</td>
                  <td className="py-3 pr-4 whitespace-nowrap text-graphite">
                    {product.total_stock}（{product.variant_count} variants）
                  </td>
                  <td className="py-3 text-xs tracking-widest uppercase">
                    {product.is_published ? "Published" : "Draft"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={result.meta.current_page} lastPage={result.meta.last_page} hrefFor={hrefFor} />
    </div>
  );
}
