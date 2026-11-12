import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { BrandConcept } from "../components/BrandConcept";

describe("BrandConcept", () => {
  it("改行区切りの本文を段落ごとに表示する", () => {
    render(<BrandConcept body={"Quality over quantity.\nDesigned to last."} />);

    expect(screen.getByText("Quality over quantity.")).toBeInTheDocument();
    expect(screen.getByText("Designed to last.")).toBeInTheDocument();
  });

  it("本文が空ならセクションごと出さない", () => {
    const { container } = render(<BrandConcept body="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
