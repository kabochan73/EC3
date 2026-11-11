// ISRのタグ名を一元管理する（docs/frontend/rendering-strategy.md）。

export const tags = {
  products: "products",
  product: (slug: string) => `product:${slug}`,
  categories: "categories",
  content: "content",
} as const;
