import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { AmountSummary } from "../AmountSummary";

describe("AmountSummary", () => {
  it("小計・送料・合計を表示する", () => {
    render(<AmountSummary subtotal={12000} shipping={800} total={12800} />);

    expect(screen.getByText("¥12,000")).toBeInTheDocument();
    expect(screen.getByText("¥800")).toBeInTheDocument();
    expect(screen.getByText("¥12,800")).toBeInTheDocument();
  });

  it("送料0円のときはFreeと表示する", () => {
    render(<AmountSummary subtotal={20000} shipping={0} total={20000} />);

    expect(screen.getByText("Free")).toBeInTheDocument();
  });
});
