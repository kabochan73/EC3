import Link from "next/link";

import { formatYen } from "@/shared/lib/format";

import type { ProductSummary } from "../types";
import { ProductMedia } from "./ProductMedia";

const STOCK_LABEL: Partial<Record<ProductSummary["stock_status"], string>> = {
  sold_out: "SOLD OUT",
  low_stock: "LOW STOCK",
  // in_stockは何も表示しない（docs/frontend/routing.md）
};

type Props = {
  product: ProductSummary;
};

/**
 * 商品カード。トップのカテゴリセクション・商品詳細の関連商品で共通。
 * 画像ホバー切替（position 0→1）はProductMediaのgroup-hover（JS不要）。
 */
export function ProductCard({ product }: Props) {
  const stockLabel = STOCK_LABEL[product.stock_status];

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative">
        <ProductMedia
          images={product.images}
          hoverSwap
          name={product.name}
          sizes="(min-width: 768px) 25vw, 50vw"
        />

        {/* 左上バッジ: NEWと在庫バッジは同時に出うる */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {product.is_new && (
            <span className="bg-ink px-2 py-1 text-[10px] tracking-widest text-paper uppercase">
              New
            </span>
          )}
          {stockLabel && (
            <span className="border border-ink bg-paper px-2 py-1 text-[10px] tracking-widest text-ink uppercase">
              {stockLabel}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-[11px] tracking-widest text-graphite uppercase">
        {product.category.name}
      </p>
      <p className="mt-1 line-clamp-2 text-sm">{product.name}</p>
      <p className="mt-1 text-sm">{formatYen(product.price)}</p>
    </Link>
  );
}
