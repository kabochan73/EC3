import type { Metadata } from "next";
import Link from "next/link";

import { getMyOrders } from "@/features/public/account/api";
import { OrderList } from "@/features/public/account/components/OrderList";
import { requireAuth } from "@/shared/lib/auth";

export const metadata: Metadata = { title: "注文履歴" };

/** 注文履歴（Server Component）。 */
export default async function OrdersPage() {
  await requireAuth();
  const orders = await getMyOrders();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <nav className="mb-8 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/account" className="hover:text-ink">
          Account
        </Link>
        <span className="mx-2">/</span>
        <span>Orders</span>
      </nav>

      <h1 className="mb-8 text-2xl font-medium tracking-[0.15em] uppercase">Orders</h1>
      <OrderList orders={orders} />
    </div>
  );
}
