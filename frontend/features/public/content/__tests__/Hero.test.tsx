import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { Hero } from "../components/Hero";

describe("Hero", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("画像が無ければNO IMAGEプレースホルダーを表示する", () => {
    render(<Hero headline="MINIMAL." tagline="Essentials." images={[]} />);

    expect(screen.getByText("NO IMAGE")).toBeInTheDocument();
    expect(screen.getByText("MINIMAL.")).toBeInTheDocument();
    expect(screen.getByText("Essentials.")).toBeInTheDocument();
  });

  it("画像が1枚だけなら固定表示される（NO IMAGEは出ない）", () => {
    render(
      <Hero
        headline="H"
        tagline="T"
        images={[{ url: "/media/content/hero/1.jpg", alt: "slide 1" }]}
      />,
    );

    expect(screen.queryByText("NO IMAGE")).not.toBeInTheDocument();
    expect(screen.getByAltText("slide 1")).toBeInTheDocument();
  });

  it("画像が複数あると一定間隔で表示中のスライドが切り替わる", () => {
    vi.useFakeTimers();

    render(
      <Hero
        headline="H"
        tagline="T"
        images={[
          { url: "/1.jpg", alt: "slide 1" },
          { url: "/2.jpg", alt: "slide 2" },
        ]}
      />,
    );

    expect(screen.getByAltText("slide 1")).toHaveStyle({ opacity: "1" });
    expect(screen.getByAltText("slide 2")).toHaveStyle({ opacity: "0" });

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByAltText("slide 1")).toHaveStyle({ opacity: "0" });
    expect(screen.getByAltText("slide 2")).toHaveStyle({ opacity: "1" });
  });

  it("altが無い画像は空文字のaltで描画する", () => {
    render(<Hero headline="H" tagline="T" images={[{ url: "/1.jpg", alt: null }]} />);

    expect(screen.getByAltText("")).toBeInTheDocument();
  });
});
