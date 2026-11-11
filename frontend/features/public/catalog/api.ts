// Server Component専用の取得関数（docs/frontend/cms.md、docs/frontend/rendering-strategy.md）。
// getProducts() / getCategories()はフェーズ4でここに追加する。

import { apiServerFetch } from "@/shared/lib/api-server";
import { tags } from "@/shared/lib/revalidate";
import type { ApiResource } from "@/shared/types";

import type { SiteContent } from "./types";

export async function getContent(): Promise<SiteContent> {
  const res = await apiServerFetch<ApiResource<SiteContent>>("/api/content", {
    next: { tags: [tags.content], revalidate: 3600 },
  });

  return res.data;
}
