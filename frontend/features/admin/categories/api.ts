// Server Component専用。管理画面の一覧取得（docs/api/admin.md GET /api/admin/categories）。
// 作成・更新・削除・並べ替えはCategoryManager（Client Component）がapiClientFetchで直接行う。

import { apiServerFetch } from "@/shared/lib/api-server";
import type { ApiCollection } from "@/shared/types";

import type { AdminCategory } from "./types";

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const res = await apiServerFetch<ApiCollection<AdminCategory>>("/api/admin/categories");

  return res.data;
}
