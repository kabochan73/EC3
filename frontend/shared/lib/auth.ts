// requireAuth / requireAdmin（Server Component専用。apiServerFetchで/api/meを呼ぶ）
// （docs/frontend/folder-structure.md、docs/frontend/rendering-strategy.md）。

import { redirect } from "next/navigation";

import { apiServerFetch, ApiError } from "./api-server";
import type { ApiResource } from "@/shared/types";

type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
  role: "customer" | "admin";
};

/** 未ログインなら/loginへリダイレクトする。ログイン済みならユーザー情報を返す。 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  try {
    const res = await apiServerFetch<ApiResource<AuthenticatedUser>>("/api/me");
    return res.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    throw error;
  }
}

/** admin以外（未ログイン含む）は/へリダイレクトする。 */
export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    redirect("/");
  }

  return user;
}
