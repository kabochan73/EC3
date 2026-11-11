// Server Component専用。Cookie転送＋Originヘッダ付与でLaravelを呼ぶ
// （docs/frontend/rendering-strategy.md）。
//
// Node.jsのfetchはOriginヘッダを自動付与しないため、明示的にFRONTEND_ORIGINを
// 設定する（EnsureFrontendRequestsAreStateful::fromFrontend()がfalseになり
// Sanctumのステートフル判定が効かなくなるのを防ぐ。docs/backend/auth.md）。
//
// 公開データ（商品・カテゴリ・CMS）の取得はCookie・Originとも不要だが、
// 付けても害はないので同じ関数をそのまま使う。

import { cookies } from "next/headers";

const API = process.env.API_URL!;
const ORIGIN = process.env.FRONTEND_ORIGIN!;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API error: ${status}`);
    this.name = "ApiError";
  }
}

export async function apiServerFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const jar = await cookies();
  // next.revalidate指定時（ISRタグ付き取得）はcacheを付けない。Next.jsはcache:
  // 'no-store'とnext.revalidateを同時に渡すと両方を黙って破棄しdynamicに落ちる
  // （node_modules/next/dist/server/lib/patch-fetch.jsのisConflictingRevalidate）。
  // 個人化データ（next未指定）は従来通りno-storeをデフォルトにする。
  const usesIsr = (init as { next?: { revalidate?: unknown } }).next?.revalidate !== undefined;
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Accept: "application/json",
      Cookie: jar.toString(),
      Origin: ORIGIN,
    },
    cache: usesIsr ? init.cache : (init.cache ?? "no-store"),
  });

  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => null));
  }

  return res.json();
}
