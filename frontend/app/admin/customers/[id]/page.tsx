import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminCustomer } from "@/features/admin/customers/api";
import { ApiError } from "@/shared/lib/api-server";
import { formatDate } from "@/shared/lib/format";

export const metadata: Metadata = { title: "Customer" };

type PageProps = { params: Promise<{ id: string }> };

/**
 * 会員詳細（Server Component・閲覧のみ）。存在しないid・管理者のidは404。
 * 注文履歴はフェーズ7で注文（Order）を実装してから追加する（docs/04-implementation-roadmap.md）。
 */
export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { id } = await params;

  let customer;
  try {
    customer = await getAdminCustomer(Number(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  return (
    <div className="p-12">
      <nav className="mb-6 text-[11px] tracking-widest text-graphite uppercase">
        <Link href="/admin/customers" className="hover:text-ink">
          Customers
        </Link>
        <span className="mx-2">/</span>
        <span>{customer.name}</span>
      </nav>

      <h1 className="text-lg tracking-widest uppercase">{customer.name}</h1>
      <dl className="mt-3 space-y-1 text-sm text-graphite">
        <div className="flex gap-3">
          <dt>Email</dt>
          <dd className="text-ink">{customer.email}</dd>
        </div>
        <div className="flex gap-3">
          <dt>Registered</dt>
          <dd className="text-ink">{formatDate(customer.joined_at)}</dd>
        </div>
        <div className="flex gap-3">
          <dt>Orders</dt>
          <dd className="text-ink">{customer.orders_count}</dd>
        </div>
      </dl>
    </div>
  );
}
