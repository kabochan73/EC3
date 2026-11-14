import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getMyOrder } from "@/features/public/account/api";
import { AmountSummary } from "@/shared/components/order/AmountSummary";
import { OrderStatusBadge } from "@/shared/components/order/OrderStatusBadge";
import { ShippingAddress } from "@/shared/components/order/ShippingAddress";
import { formatDateTime, formatYen } from "@/shared/lib/format";
import { requireAuth } from "@/shared/lib/auth";

type PageProps = { params: Promise<{ number: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { number } = await params;

  return { title: `注文詳細 ${number}` };
}

/**
 * 注文詳細（Server Component）。他人の注文・存在しない番号はnotFound()。
 * (account)配下にはloading.tsxを置かない（置くとnotFound()でも200になるため）。
 */
export default async function OrderDetailPage({ params }: PageProps) {
  const { number } = await params;
  await requireAuth();
  const order = await getMyOrder(number);

  if (!order) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <nav className="mb-8 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/account/orders" className="hover:text-ink">
          Orders
        </Link>
        <span className="mx-2">/</span>
        <span>{order.order_number}</span>
      </nav>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium tracking-[0.15em] uppercase">{order.order_number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-[11px] tracking-widest text-graphite uppercase">
        {formatDateTime(order.placed_at)}
      </p>

      {order.status === "pending" && (
        <Link
          href={`/checkout/payment?order=${order.order_number}`}
          className="mt-6 inline-block bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80"
        >
          Complete Payment
        </Link>
      )}

      <section className="mt-12 border-t border-ink">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-mist py-4 text-sm">
            <div>
              <p>{item.product_name}</p>
              <p className="mt-1 text-[11px] tracking-widest text-graphite uppercase">
                {item.size}
                {item.color ? ` / ${item.color}` : ""} × {item.quantity}
              </p>
            </div>
            <p>{formatYen(item.line_total)}</p>
          </div>
        ))}
      </section>

      <div className="mt-6">
        <AmountSummary subtotal={order.subtotal} shipping={order.shipping_fee} total={order.total} />
      </div>

      <section className="mt-12 border-t border-ink pt-6">
        <h2 className="mb-3 text-[11px] tracking-widest text-graphite uppercase">Shipping Address</h2>
        <ShippingAddress address={order.shipping_address} />
      </section>
    </div>
  );
}
