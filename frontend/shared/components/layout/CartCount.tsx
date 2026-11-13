"use client";

import Link from "next/link";

import { useCartItemCount } from "@/features/public/cart/stores/cart";

/**
 * ヘッダーのCART (n)リンク。zustandストアの数量合計を表示する。
 * 復元前（SSR・hydration直後）は0。CartHydrationが復元するとこの値も更新される。
 */
export function CartCount() {
  const count = useCartItemCount();

  return (
    <Link href="/cart" className="transition-opacity hover:opacity-60">
      Cart ({count})
    </Link>
  );
}
