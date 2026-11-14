// Server Component専用。チェックアウト画面の配送先候補の取得（docs/api/public.md 住所録）。

import { apiServerFetch } from "@/shared/lib/api-server";
import type { ApiCollection } from "@/shared/types";

import type { Address } from "./types";

/** GET /api/addresses … 本人の住所（is_defaultを先頭）。 */
export async function getAddresses(): Promise<Address[]> {
  const res = await apiServerFetch<ApiCollection<Address>>("/api/addresses");

  return res.data;
}
