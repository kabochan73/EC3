import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { Lookbook } from "../components/Lookbook";

describe("Lookbook", () => {
  it("画像が0枚でもNO IMAGEプレースホルダーを1枚表示する", () => {
    render(<Lookbook images={[]} />);

    expect(screen.getByText("NO IMAGE")).toBeInTheDocument();
  });

  it("画像を横並びで表示する", () => {
    render(
      <Lookbook
        images={[
          { url: "/1.jpg", alt: "look 1" },
          { url: "/2.jpg", alt: "look 2" },
        ]}
      />,
    );

    expect(screen.getByAltText("look 1")).toBeInTheDocument();
    expect(screen.getByAltText("look 2")).toBeInTheDocument();
    expect(screen.queryByText("NO IMAGE")).not.toBeInTheDocument();
  });

  it("altが無い画像は空文字のaltで描画する", () => {
    render(<Lookbook images={[{ url: "/1.jpg", alt: null }]} />);

    expect(screen.getByAltText("")).toBeInTheDocument();
  });
});
