import type { Category, ProductSummary } from "../types";
import { ProductCard } from "./ProductCard";

type Props = {
  /** getCategories()の結果（position順） */
  categories: Category[];
  /** getProducts()の結果（全公開商品・position順） */
  products: ProductSummary[];
};

/**
 * トップページのカテゴリごとの商品セクション。カテゴリ名の極太見出し＋そのカテゴリの
 * 全公開商品をposition順でグリッド表示する。`/collections`を作らない方針なので
 * 先頭N点に絞らず全件を出し切る。商品0件のカテゴリはセクション自体を出さない
 * （docs/frontend/routing.md）。
 */
export function CategoryGrid({ categories, products }: Props) {
  return (
    <>
      {categories.map((category) => {
        const items = products.filter((product) => product.category.slug === category.slug);
        if (items.length === 0) return null;

        return (
          <section key={category.id} id={category.slug} className="border-t border-ink px-6 py-20">
            <h2 className="mb-10 text-3xl font-medium tracking-[0.15em] uppercase md:text-5xl">
              {category.name}
            </h2>

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
