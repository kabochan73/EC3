import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProductMedia } from "../components/ProductMedia";

describe("ProductMedia", () => {
  it("画像が0枚ならNO IMAGEプレースホルダーを表示する", () => {
    render(<ProductMedia images={[]} name="Tシャツ" />);

    expect(screen.getByText("NO IMAGE")).toBeInTheDocument();
  });

  it("position=0の画像を表示する", () => {
    render(
      <ProductMedia
        images={[
          { id: 2, url: "/1.jpg", alt: "正面", position: 0 },
          { id: 3, url: "/2.jpg", alt: "背面", position: 1 },
        ]}
        name="Tシャツ"
      />,
    );

    expect(screen.getByAltText("正面")).toBeInTheDocument();
  });

  it("hoverSwap無しではposition=1の画像を描画しない", () => {
    render(
      <ProductMedia
        images={[
          { id: 2, url: "/1.jpg", alt: "正面", position: 0 },
          { id: 3, url: "/2.jpg", alt: "背面", position: 1 },
        ]}
        name="Tシャツ"
      />,
    );

    expect(screen.queryByAltText("背面")).not.toBeInTheDocument();
  });

  it("hoverSwap有りではposition=1の画像も描画する", () => {
    render(
      <ProductMedia
        images={[
          { id: 2, url: "/1.jpg", alt: "正面", position: 0 },
          { id: 3, url: "/2.jpg", alt: "背面", position: 1 },
        ]}
        name="Tシャツ"
        hoverSwap
      />,
    );

    expect(screen.getByAltText("正面")).toBeInTheDocument();
    expect(screen.getByAltText("背面")).toBeInTheDocument();
  });

  it("altが無い画像は商品名をフォールバックにする", () => {
    render(<ProductMedia images={[{ id: 1, url: "/1.jpg", alt: null, position: 0 }]} name="Tシャツ" />);

    expect(screen.getByAltText("Tシャツ")).toBeInTheDocument();
  });
});
