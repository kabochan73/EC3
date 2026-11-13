import Link from "next/link";

import { formatYen } from "@/shared/lib/format";

import type { CartTotals } from "../cart-summary";

/** 小計・送料・合計とCHECKOUTボタン。計算はしない（summarizeCartの結果を表示するだけ）。 */
export function CartSummary({ totals }: { totals: CartTotals }) {
  return (
    <div className="border border-ink p-6">
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-[11px] tracking-widest text-graphite uppercase">Subtotal</dt>
          <dd>{formatYen(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[11px] tracking-widest text-graphite uppercase">Shipping</dt>
          <dd>{totals.shipping === 0 ? "Free" : formatYen(totals.shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-ink pt-3 text-base">
          <dt className="text-[11px] tracking-widest text-graphite uppercase">Total</dt>
          <dd>{formatYen(totals.total)}</dd>
        </div>
      </dl>

      {totals.blocked ? (
        <p className="mt-6 block w-full bg-mist py-3 text-center text-xs tracking-widest text-graphite uppercase">
          購入できない明細があります
        </p>
      ) : (
        <Link
          href="/checkout"
          className="mt-6 block w-full bg-ink py-3 text-center text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80"
        >
          Checkout
        </Link>
      )}

      {totals.untilFreeShipping > 0 && (
        <p className="mt-3 text-[11px] tracking-widest text-graphite uppercase">
          あと{formatYen(totals.untilFreeShipping)}で送料無料
        </p>
      )}
    </div>
  );
}
