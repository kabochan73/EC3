"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { apiClientFetch } from "@/shared/lib/api-client";
import type { ApiResource } from "@/shared/types";

type SessionUser = { id: number; name: string; email: string; role: "customer" | "admin" };

/**
 * ヘッダーのACCOUNTリンク。ログイン状態をGET /api/meで確認し、遷移先とラベルを出し分ける
 * （未ログイン: /login "Login"、ログイン中: /account "Account"）。
 *
 * Header（Server Component）でcookies()を読むとページ全体が動的レンダリングになり
 * ISRが効かなくなるため、あえてクライアント側で判定する。マウント直後は一瞬
 * 未ログイン扱いになるが許容。ログイン/ログアウトが["session"]をinvalidateするので
 * そのタイミングで貼り直される。
 */
export function AccountLink() {
  const { data } = useQuery({
    queryKey: ["session"],
    queryFn: async (): Promise<ApiResource<SessionUser> | null> => {
      const res = await apiClientFetch("/api/me");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <Link href={data ? "/account" : "/login"} className="transition-opacity hover:opacity-60">
      {data ? "Account" : "Login"}
    </Link>
  );
}
