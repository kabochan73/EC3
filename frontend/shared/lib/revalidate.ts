// ISRのタグ名を一元管理する（docs/frontend/rendering-strategy.md）。

export const tags = {
  products: "products",
  product: (slug: string) => `product:${slug}`,
  categories: "categories",
  content: "content",
} as const;

/**
 * 管理画面のClient Componentが書き込み成功後に呼ぶ。POST /api/revalidateで対象タグを無効化する
 * （docs/frontend/rendering-strategy.md）。apiClientFetchはここでは使わない（CSRF不要・レスポンス
 * を使わないため）。
 */
export async function revalidateTags(tagsToInvalidate: string[]): Promise<void> {
  await fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags: tagsToInvalidate }),
  });
}
