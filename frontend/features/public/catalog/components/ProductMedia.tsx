import Image from "next/image";

import type { ProductImage } from "../types";

type Props = {
  images: ProductImage[];
  /** カード用にtrueでホバー時2枚目（position=1）に差し替える。詳細ページのギャラリーでは使わない */
  hoverSwap?: boolean;
  /** 商品名（altが無い画像のフォールバック） */
  name: string;
  sizes?: string;
};

/** 商品画像の表示。画像が1枚も無ければ「NO IMAGE」のグレーボックス（docs/frontend/design-reference.md）。 */
export function ProductMedia({ images, hoverSwap = false, name, sizes }: Props) {
  const primary = images.find((image) => image.position === 0) ?? images[0];
  const hover = hoverSwap ? images.find((image) => image.position === 1) : undefined;

  if (!primary) {
    return (
      <div className="flex aspect-3/4 w-full items-center justify-center bg-mist">
        <span className="text-xs tracking-widest text-graphite uppercase">NO IMAGE</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-3/4 w-full overflow-hidden bg-mist">
      <Image
        src={primary.url}
        alt={primary.alt ?? name}
        fill
        sizes={sizes}
        className={
          hover
            ? "object-cover transition-opacity duration-300 group-hover:opacity-0"
            : "object-cover"
        }
      />
      {hover && (
        <Image
          src={hover.url}
          alt={hover.alt ?? name}
          fill
          sizes={sizes}
          className="object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
    </div>
  );
}
