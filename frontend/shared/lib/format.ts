/** 円の金額を「¥12,000」の形にする */
export function formatYen(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

/**
 * 日時はすべて日本時間で表示する。timeZoneを指定せずにtoLocaleDateStringすると、
 * Server Component（サーバーのコンテナはUTC）で描いたときに9時間ずれる
 * （JST深夜0〜9時の登録が前日として表示される）。
 */
const TIME_ZONE = "Asia/Tokyo";

/** 「2026/11/13」 */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 「2026/11/13 08:30」 */
export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type OrderStatusValue = "pending" | "paid" | "shipped" | "completed" | "cancelled";

const ORDER_STATUS_LABEL: Record<OrderStatusValue, string> = {
  pending: "支払い待ち",
  paid: "支払い済み",
  shipped: "発送済み",
  completed: "完了",
  cancelled: "キャンセル済み",
};

/** 注文ステータスの日本語表示ラベル（docs/frontend/routing.md）。 */
export function formatOrderStatus(status: OrderStatusValue): string {
  return ORDER_STATUS_LABEL[status];
}
