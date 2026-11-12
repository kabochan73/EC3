"use client";

import { useState } from "react";

import type { ProductVariant } from "../types";

type Props = {
  colors: string[];
  variants: ProductVariant[];
};

/**
 * 色スウォッチ・サイズセレクタ・ADD TO CART（docs/frontend/routing.md）。
 * 選択中の色・サイズを共有するのでまとめてClient Component。
 * 公開APIは生の在庫数を返さないので、選択可否はvariant.selectableで判定する。
 *
 * 色選択で切り替わるのは「その色に属するvariantのサイズ在庫」のみ。
 * 商品画像は色を持たない（商品単位）ので画像は切り替えない。
 *
 * カート追加（zustand store）はフェーズ6（docs/04-implementation-roadmap.md）で配線する。
 * 現時点ではボタンの活性/非活性のみ正しく振る舞う。
 */
export function VariantSelector({ colors, variants }: Props) {
  const hasColors = colors.length > 0;
  const [selectedColor, setSelectedColor] = useState<string | null>(hasColors ? colors[0] : null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const availableVariants = variants.filter((variant) => variant.color === selectedColor);
  const selectedVariant =
    availableVariants.find((variant) => variant.size === selectedSize) ?? null;
  const canAddToCart = selectedVariant !== null && selectedVariant.selectable;

  function handleColorChange(color: string) {
    setSelectedColor(color);
    setSelectedSize(null); // 色を変えたらサイズ選択をリセット
  }

  return (
    <div>
      {hasColors && (
        <div className="mb-6">
          <p className="mb-2 text-[11px] tracking-widest text-graphite uppercase">Color</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handleColorChange(color)}
                className={`border px-3 py-1.5 text-xs tracking-widest uppercase transition-colors ${
                  selectedColor === color
                    ? "border-ink bg-ink text-paper"
                    : "border-ink text-ink hover:bg-mist"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="mb-2 text-[11px] tracking-widest text-graphite uppercase">Size</p>
        <div className="flex flex-wrap gap-2">
          {availableVariants.map((variant) => {
            const soldOut = variant.stock_status === "sold_out";
            const lowStock = variant.stock_status === "low_stock";
            const active = selectedSize === variant.size;

            return (
              <button
                key={variant.id}
                type="button"
                disabled={soldOut}
                onClick={() => setSelectedSize(variant.size)}
                className={`border px-3 py-1.5 text-xs tracking-widest uppercase transition-colors ${
                  soldOut
                    ? "cursor-not-allowed border-graphite text-graphite line-through"
                    : active
                      ? "border-ink bg-ink text-paper"
                      : "border-ink text-ink hover:bg-mist"
                }`}
              >
                {variant.size}
                {lowStock && !active && (
                  <span className="ml-1 text-[9px] normal-case text-graphite">(low stock)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={!canAddToCart}
        className="w-full bg-ink py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
      >
        Add to Cart
      </button>
    </div>
  );
}
