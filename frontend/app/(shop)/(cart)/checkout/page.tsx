import type { Metadata } from "next";

import { getAddresses } from "@/features/public/checkout/api";
import { CheckoutClient } from "@/features/public/checkout/components/CheckoutClient";
import { requireAuth } from "@/shared/lib/auth";

export const metadata: Metadata = { title: "Checkout" };

/** チェックアウト（Server Component）。要ログイン（proxy.tsでCookie有無を先にガード）。 */
export default async function CheckoutPage() {
  await requireAuth();
  const addresses = await getAddresses();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-medium tracking-[0.15em] uppercase">Checkout</h1>
      <CheckoutClient addresses={addresses} />
    </div>
  );
}
