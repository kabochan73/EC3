"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { AdminCategory } from "@/features/admin/categories/types";
import { apiClientFetch } from "@/shared/lib/api-client";
import { revalidateTags } from "@/shared/lib/revalidate";

import type { AdminProduct } from "../types";
import { ProductForm } from "./ProductForm";

type Props = {
  product: AdminProduct;
  categories: AdminCategory[];
};

/** 商品の基本情報の編集 + 商品の削除。保存したらrouter.refresh()で描き直す。 */
export function EditProductForm({ product, categories }: Props) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`「${product.name}」を削除しますか？この操作は取り消せません。`)) return;
    setError(null);
    const res = await apiClientFetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "削除に失敗しました。");
      return;
    }
    await revalidateTags(["categories", "products", `product:${product.slug}`]);
    router.push("/admin/products");
  }

  return (
    <div>
      {notice && <p className="mb-6 text-xs text-graphite">{notice}</p>}
      <ProductForm
        categories={categories}
        product={product}
        submitLabel="Save"
        onSubmit={(payload) => {
          setNotice(null);
          return apiClientFetch(`/api/admin/products/${product.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }}
        onSaved={async (res) => {
          const body: { data: AdminProduct } = await res.json();
          // slugを変えた場合は変更前のタグも無効化する（docs/frontend/rendering-strategy.md）
          const tags = new Set(["categories", "products", `product:${product.slug}`, `product:${body.data.slug}`]);
          await revalidateTags([...tags]);
          setNotice("保存しました。");
          router.refresh();
        }}
      />

      {error && <p className="mt-6 text-xs text-graphite">{error}</p>}
      <button
        type="button"
        onClick={handleDelete}
        className="mt-6 text-xs tracking-widest text-graphite uppercase underline underline-offset-2 hover:text-ink"
      >
        Delete Product
      </button>
    </div>
  );
}
