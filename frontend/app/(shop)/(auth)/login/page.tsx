import type { Metadata } from "next";

import { LoginForm } from "@/features/public/auth/components/LoginForm";

export const metadata: Metadata = { title: "ログイン" };

type PageProps = { searchParams: Promise<{ redirect?: string }> };

/** ログイン（Server Component）。?redirect=はここで読んでpropsで渡す（docs/frontend/routing.md）。 */
export default async function LoginPage({ searchParams }: PageProps) {
  const { redirect } = await searchParams;

  return <LoginForm redirectTo={redirect ?? null} />;
}
