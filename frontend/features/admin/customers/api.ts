// Server Component専用。管理画面の会員は閲覧のみ（docs/api/admin.md）。

import { apiServerFetch } from "@/shared/lib/api-server";
import type { ApiPaginated, ApiResource } from "@/shared/types";

import type { AdminCustomer } from "./types";

export type AdminCustomerListParams = {
  q?: string;
  page?: number;
};

/** GET /api/admin/customers … role=customerを新しい順に20件ずつ。?q=は名前・メールの部分一致 */
export async function getAdminCustomers(
  params: AdminCustomerListParams = {},
): Promise<ApiPaginated<AdminCustomer>> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.page && params.page > 1) query.set("page", String(params.page));

  const suffix = query.size > 0 ? `?${query}` : "";

  return apiServerFetch<ApiPaginated<AdminCustomer>>(`/api/admin/customers${suffix}`);
}

/** GET /api/admin/customers/{id} … 会員1人（存在しないid・管理者のidは404） */
export async function getAdminCustomer(id: number): Promise<AdminCustomer> {
  const res = await apiServerFetch<ApiResource<AdminCustomer>>(`/api/admin/customers/${id}`);

  return res.data;
}
