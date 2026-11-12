import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Gallery } from "../components/Gallery";

describe("Gallery", () => {
  it("画像が0枚ならNO IMAGEプレースホルダーを表示する", () => {
    render(<Gallery images={[]} name="Tシャツ" />);

    expect(screen.getByText("NO IMAGE")).toBeInTheDocument();
  });

  it("画像をposition順に並べて表示する", () => {
    render(
      <Gallery
        images={[
          { id: 2, url: "/2.jpg", alt: "背面", position: 1 },
          { id: 1, url: "/1.jpg", alt: "正面", position: 0 },
        ]}
        name="Tシャツ"
      />,
    );

    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("alt", "正面");
    expect(images[1]).toHaveAttribute("alt", "背面");
  });

  it("altが無い画像は商品名をフォールバックにする", () => {
    render(<Gallery images={[{ id: 1, url: "/1.jpg", alt: null, position: 0 }]} name="Tシャツ" />);

    expect(screen.getByAltText("Tシャツ")).toBeInTheDocument();
  });
});
