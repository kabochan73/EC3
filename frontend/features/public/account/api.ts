// Server Component専用。マイページの注文取得（docs/api/public.md 注文）。

import { apiServerFetch, ApiError } from "@/shared/lib/api-server";
import type { ApiCollection, ApiResource } from "@/shared/types";

import type { OrderDetail, OrderListItem } from "./types";

/** GET /api/orders … 本人の注文一覧（新しい順・要約）。 */
export async function getMyOrders(): Promise<OrderListItem[]> {
  const res = await apiServerFetch<ApiCollection<OrderListItem>>("/api/orders");

  return res.data;
}

/** GET /api/orders/{order_number} … 本人の注文詳細。他人・不明はnull（404）。 */
export async function getMyOrder(orderNumber: string): Promise<OrderDetail | null> {
  try {
    const res = await apiServerFetch<ApiResource<OrderDetail>>(
      `/api/orders/${encodeURIComponent(orderNumber)}`,
    );

    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
