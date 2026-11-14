import { formatYen } from "@/shared/lib/format";

type Props = {
  subtotal: number;
  shipping: number;
  total: number;
};

/**
 * 小計・送料・合計の表。カート・チェックアウト・マイページの注文詳細・管理画面の注文詳細で使う。
 * 計算はしない（呼び出し側が計算済みの値を渡す）。
 */
export function AmountSummary({ subtotal, shipping, total }: Props) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex justify-between">
        <dt className="text-[11px] tracking-widest text-graphite uppercase">Subtotal</dt>
        <dd>{formatYen(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-[11px] tracking-widest text-graphite uppercase">Shipping</dt>
        <dd>{shipping === 0 ? "Free" : formatYen(shipping)}</dd>
      </div>
      <div className="flex justify-between border-t border-ink pt-3 text-base">
        <dt className="text-[11px] tracking-widest text-graphite uppercase">Total</dt>
        <dd>{formatYen(total)}</dd>
      </div>
    </dl>
  );
}
