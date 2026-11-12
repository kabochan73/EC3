// Server Component専用。管理画面の一覧・詳細取得（docs/api/admin.md）。
// 作成・更新・削除はProductForm等（Client Component）がapiClientFetchで直接行う。

import { apiServerFetch } from "@/shared/lib/api-server";
import type { ApiPaginated, ApiResource } from "@/shared/types";

import type { AdminProduct, AdminProductListItem } from "./types";

export type AdminProductListParams = {
  q?: string;
  category?: string;
  page?: number;
};

/** GET /api/admin/products … 未公開も含む。検索・カテゴリ絞り込み・20件ずつ（空の値は送らない） */
export async function getAdminProducts(
  params: AdminProductListParams = {},
): Promise<ApiPaginated<AdminProductListItem>> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.page && params.page > 1) query.set("page", String(params.page));

  const suffix = query.size > 0 ? `?${query}` : "";

  return apiServerFetch<ApiPaginated<AdminProductListItem>>(`/api/admin/products${suffix}`);
}

/** GET /api/admin/products/{id} … 編集用（images/variants込み） */
export async function getAdminProduct(id: number): Promise<AdminProduct> {
  const res = await apiServerFetch<ApiResource<AdminProduct>>(`/api/admin/products/${id}`);

  return res.data;
}
