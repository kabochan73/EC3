"use client";

import { useRouter } from "next/navigation";

import type { AdminCategory } from "@/features/admin/categories/types";
import { apiClientFetch } from "@/shared/lib/api-client";
import { revalidateTags } from "@/shared/lib/revalidate";
import type { ApiResource } from "@/shared/types";

import type { AdminProduct } from "../types";
import { ProductForm } from "./ProductForm";

type Props = {
  categories: AdminCategory[];
};

/** 新規作成。作れたら編集ページへ（画像・バリアントはそこで足す）。 */
export function NewProductForm({ categories }: Props) {
  const router = useRouter();

  return (
    <ProductForm
      categories={categories}
      submitLabel="Create"
      onSubmit={(payload) =>
        apiClientFetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }
      onSaved={async (res) => {
        const body: ApiResource<AdminProduct> = await res.json();
        await revalidateTags(["categories", "products"]);
        router.push(`/admin/products/${body.data.id}`);
      }}
    />
  );
}
