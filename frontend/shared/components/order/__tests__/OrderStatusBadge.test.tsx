import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { OrderStatusBadge } from "../OrderStatusBadge";

describe("OrderStatusBadge", () => {
  it("日本語ラベルを表示する", () => {
    render(<OrderStatusBadge status="paid" />);

    expect(screen.getByText("支払い済み")).toBeInTheDocument();
  });

  it("cancelledだけグレー表示になる", () => {
    const { rerender } = render(<OrderStatusBadge status="cancelled" />);
    expect(screen.getByText("キャンセル済み")).toHaveClass("text-graphite");

    rerender(<OrderStatusBadge status="paid" />);
    expect(screen.getByText("支払い済み")).toHaveClass("text-ink");
  });
});
