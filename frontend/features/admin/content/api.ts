// Server Component専用。管理画面の編集フォーム用データ取得
// （docs/api/admin.md GET /api/admin/content）。

import { apiServerFetch } from "@/shared/lib/api-server";
import type { SiteContent } from "@/features/public/content/types";
import type { ApiResource } from "@/shared/types";

export async function getAdminContent(): Promise<SiteContent> {
  const res = await apiServerFetch<ApiResource<SiteContent>>("/api/admin/content");

  return res.data;
}
