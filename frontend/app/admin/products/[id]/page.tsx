import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminCategories } from "@/features/admin/categories/api";
import type { AdminCategory } from "@/features/admin/categories/types";
import { getAdminProduct } from "@/features/admin/products/api";
import { EditProductForm } from "@/features/admin/products/components/EditProductForm";
import type { AdminProduct } from "@/features/admin/products/types";
import { ApiError } from "@/shared/lib/api-server";

export const metadata: Metadata = { title: "Edit Product" };

type PageProps = { params: Promise<{ id: string }> };

/**
 * 商品の編集（Server Component）。基本情報・画像・バリアントの部品を並べる。
 * 各部品は操作の後にrouter.refresh()するので、このページが取り直してpropsが新しくなる。
 */
export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;

  // 商品とカテゴリは互いに関係ないので同時に取る
  let product: AdminProduct;
  let categories: AdminCategory[];
  try {
    [product, categories] = await Promise.all([getAdminProduct(Number(id)), getAdminCategories()]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="p-12">
      <nav className="mb-6 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/admin/products" className="hover:text-ink">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>
      <h1 className="mb-8 text-lg tracking-widest uppercase">Edit Product</h1>

      <EditProductForm product={product} categories={categories} />
    </div>
  );
}
