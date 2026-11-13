// Client Component専用。カートはlocalStorage（ブラウザにしかないデータ）が起点なので、
// 読み取りもここだけはSCではなくCCがapiClientFetchで直接Laravelを呼ぶ
// （docs/frontend/rendering-strategy.mdのCC例外1に該当）。

import { apiClientFetch } from "@/shared/lib/api-client";
import type { ApiCollection } from "@/shared/types";

import type { CartLineValidation } from "./types";

/**
 * カート明細の再検証（GET /api/cart/validate）。
 * 各variantの現在価格・在庫ステータス・購入可否・数量上限・商品情報を返す。
 */
export async function validateCartLines(variantIds: number[]): Promise<CartLineValidation[]> {
  if (variantIds.length === 0) return [];

  const params = new URLSearchParams();
  for (const id of variantIds) {
    params.append("variant_ids[]", String(id));
  }

  const res = await apiClientFetch(`/api/cart/validate?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`GET /api/cart/validateが${res.status}`);
  }

  const body: ApiCollection<CartLineValidation> = await res.json();

  return body.data;
}
