// 更新成功後にブラウザが呼ぶ、キャッシュ無効化専用の薄いRoute Handler。
// 認証を中継するBFFではない（docs/frontend/rendering-strategy.md）。

import { revalidateTag } from "next/cache";

import { apiServerFetch } from "@/shared/lib/api-server";

const ALLOWED = new Set(["products", "categories", "content"]);

export async function POST(req: Request): Promise<Response> {
  const me = await apiServerFetch<{ data: { role: string } }>("/api/me").catch(() => null);
  if (me?.data.role !== "admin") return new Response(null, { status: 403 });

  const { tags } = (await req.json()) as { tags: string[] };

  for (const tag of tags) {
    if (!ALLOWED.has(tag) && !tag.startsWith("product:")) continue;

    // Next.js 16はrevalidateTagの型上は第2引数（cacheLifeプロファイル）を必須にしたが、
    // 実際に試すと"max"等のプロファイルを渡すとこのプロジェクトのfetch(next:{tags,revalidate})
    // ベースの通常キャッシュ（プロファイル無し扱い）とプロファイルが一致せず無効化されない。
    // 単一引数呼び出し（非推奨警告が出るだけで動作はNext 15までと同じ）が必要。
    // @ts-expect-error 単一引数呼び出しは非推奨だがfetchベースのタグには必須
    revalidateTag(tag);
  }

  return new Response(null, { status: 204 });
}
