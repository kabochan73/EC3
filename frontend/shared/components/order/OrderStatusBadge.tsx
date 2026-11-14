import { formatOrderStatus } from "@/shared/lib/format";

type Status = "pending" | "paid" | "shipped" | "completed" | "cancelled";

/** 注文ステータスのラベル（日本語）。マイページ・管理画面の注文一覧・詳細で共通して使う。 */
export function OrderStatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-block border px-2 py-1 text-[10px] tracking-widest uppercase ${
        status === "cancelled" ? "border-graphite text-graphite" : "border-ink text-ink"
      }`}
    >
      {formatOrderStatus(status)}
    </span>
  );
}
