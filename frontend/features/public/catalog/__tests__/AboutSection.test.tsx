import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { AboutSection } from "../components/AboutSection";

describe("AboutSection", () => {
  it("ブロックが0件ならセクションごと出さない", () => {
    const { container } = render(<AboutSection blocks={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("各ブロックのlabel・heading・bodyを表示する", () => {
    render(
      <AboutSection
        blocks={[
          { label: "Since 2026", heading: "Our Story", body: "本文です", image_url: null },
        ]}
      />,
    );

    expect(screen.getByText("Since 2026")).toBeInTheDocument();
    expect(screen.getByText("Our Story")).toBeInTheDocument();
    expect(screen.getByText("本文です")).toBeInTheDocument();
  });

  it("image_urlが無いブロックはNO IMAGEプレースホルダーを表示する", () => {
    render(
      <AboutSection
        blocks={[{ label: "L", heading: "H", body: "B", image_url: null }]}
      />,
    );

    expect(screen.getByText("NO IMAGE")).toBeInTheDocument();
  });

  it("image_urlがあるブロックは画像を表示する", () => {
    const { container } = render(
      <AboutSection
        blocks={[{ label: "L", heading: "H", body: "B", image_url: "/media/about/1.jpg" }]}
      />,
    );

    expect(screen.queryByText("NO IMAGE")).not.toBeInTheDocument();
    // altが空（装飾目的）のためrole="img"では拾えない。querySelectorで確認する
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", "/media/about/1.jpg");
  });
});
