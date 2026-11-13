"use client";

import Link from "next/link";

import { summarizeCart } from "../cart-summary";
import { useCartValidation } from "../hooks/useCartValidation";
import { useCartHydrated, useCartStore } from "../stores/cart";
import { CartLine } from "./CartLine";
import { CartSummary } from "./CartSummary";

/**
 * カートの中身（Client Component）。カートはlocalStorageにあるので、ここから下は全部ブラウザで動く。
 * page.tsx（SC）はこれを置くだけ。
 */
export function CartView() {
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const { getValidation } = useCartValidation(items);

  // 復元前はitemsが必ず空なので、ここで「空のカート」を出すと一瞬だけ誤った表示になる
  if (!hydrated) {
    return <p className="py-24 text-center text-xs tracking-widest text-graphite uppercase">Loading…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-xs tracking-widest text-graphite uppercase">Your cart is empty</p>
        <Link
          href="/"
          className="mt-8 border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-opacity hover:opacity-60"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const totals = summarizeCart(items, getValidation);

  return (
    <div className="grid gap-12 md:grid-cols-[1fr_20rem] md:items-start">
      <div className="border-t border-ink">
        {items.map((item) => (
          <CartLine key={item.variantId} item={item} validation={getValidation(item)} />
        ))}
      </div>

      <div className="md:sticky md:top-20">
        <CartSummary totals={totals} />
      </div>
    </div>
  );
}
