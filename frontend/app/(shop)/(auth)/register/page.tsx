import type { Metadata } from "next";

import { RegisterForm } from "@/features/public/auth/components/RegisterForm";

export const metadata: Metadata = { title: "会員登録" };

type PageProps = { searchParams: Promise<{ redirect?: string }> };

/** 会員登録（Server Component）。?redirect=はここで読んでpropsで渡す（docs/frontend/routing.md）。 */
export default async function RegisterPage({ searchParams }: PageProps) {
  const { redirect } = await searchParams;

  return <RegisterForm redirectTo={redirect ?? null} />;
}
