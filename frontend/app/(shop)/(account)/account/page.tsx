import type { Metadata } from "next";

import { AccountMenu } from "@/features/public/account/components/AccountMenu";
import { requireAuth } from "@/shared/lib/auth";

export const metadata: Metadata = { title: "マイページ" };

/** マイページダッシュボード（Server Component）。メール認証は実装しないので未確認バナーは出さない。 */
export default async function AccountPage() {
  const user = await requireAuth();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-medium tracking-[0.15em] uppercase">Account</h1>
      <p className="mt-4 text-xl text-graphite">ようこそ、{user.name} さん</p>

      <AccountMenu isAdmin={user.role === "admin"} />
    </div>
  );
}
