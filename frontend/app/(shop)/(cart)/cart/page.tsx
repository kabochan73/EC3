import type { Metadata } from "next";

import { CartView } from "@/features/public/cart/components/CartView";

export const metadata: Metadata = { title: "Cart" };

/** カートページ（Server Component）。中身はlocalStorageにあるのでCartView（CC）に任せ、ここは見出しとmetadataだけ。 */
export default function CartPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-medium tracking-[0.15em] uppercase">Cart</h1>
      <CartView />
    </div>
  );
}
