import type { Metadata } from "next";
import Link from "next/link";

import { getAdminCategories } from "@/features/admin/categories/api";
import { NewProductForm } from "@/features/admin/products/components/NewProductForm";

export const metadata: Metadata = { title: "New Product" };

/** 商品の新規作成（Server Component。カテゴリの選択肢を取ってフォームに渡す）。 */
export default async function NewProductPage() {
  const categories = await getAdminCategories();

  return (
    <div className="p-12">
      <nav className="mb-6 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/admin/products" className="hover:text-ink">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span>New</span>
      </nav>
      <h1 className="mb-8 text-lg tracking-widest uppercase">New Product</h1>
      <NewProductForm categories={categories} />
    </div>
  );
}
