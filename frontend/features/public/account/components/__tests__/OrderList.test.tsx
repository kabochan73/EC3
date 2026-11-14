import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { OrderList } from "../OrderList";
import type { OrderListItem } from "../../types";

function makeOrder(overrides: Partial<OrderListItem> = {}): OrderListItem {
  return {
    order_number: "EC-20261114-0001",
    status: "pending",
    total: 12800,
    item_count: 2,
    placed_at: "2026-11-14T03:00:00Z",
    ...overrides,
  };
}

describe("OrderList", () => {
  it("注文が無ければメッセージを表示する", () => {
    render(<OrderList orders={[]} />);

    expect(screen.getByText("まだ注文はありません。")).toBeInTheDocument();
  });

  it("注文番号・日付・点数・合計・ステータスを表示し、詳細へリンクする", () => {
    render(<OrderList orders={[makeOrder()]} />);

    expect(screen.getByText("EC-20261114-0001")).toBeInTheDocument();
    expect(screen.getByText("2点", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("¥12,800")).toBeInTheDocument();
    expect(screen.getByText("支払い待ち")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/account/orders/EC-20261114-0001");
  });
});
