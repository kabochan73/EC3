// Server Component専用の取得関数（docs/frontend/cms.md、docs/frontend/rendering-strategy.md）。

import { ApiError, apiServerFetch } from "@/shared/lib/api-server";
import { tags } from "@/shared/lib/revalidate";
import type { ApiCollection, ApiResource } from "@/shared/types";

import type { Category, ProductDetail, ProductSummary } from "./types";

/** 未公開・存在しないslugはnull（呼び出し側がnotFound()する）。 */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await apiServerFetch<ApiResource<ProductDetail>>(`/api/products/${slug}`, {
      next: { tags: [tags.product(slug), tags.products], revalidate: 600 },
    });

    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  const res = await apiServerFetch<ApiCollection<Category>>("/api/categories", {
    next: { tags: [tags.categories], revalidate: 3600 },
  });

  return res.data;
}

type GetProductsOptions = {
  category?: string;
  isNew?: boolean;
  limit?: number;
};

export async function getProducts(options: GetProductsOptions = {}): Promise<ProductSummary[]> {
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.isNew) params.set("new", "true");
  if (options.limit) params.set("limit", String(options.limit));

  const query = params.toString();
  const res = await apiServerFetch<ApiCollection<ProductSummary>>(
    `/api/products${query ? `?${query}` : ""}`,
    { next: { tags: [tags.products], revalidate: 600 } },
  );

  return res.data;
}
