import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { summarizeCart } from "@/features/public/cart/cart-summary";
import type { CartItem, CartLineValidation } from "@/features/public/cart/types";

import { OrderReview } from "../OrderReview";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 1,
    productSlug: "boxy-tee",
    productName: "ボクシーTシャツ",
    size: "M",
    color: "黒",
    unitPrice: 5000,
    quantity: 2,
    imageUrl: null,
    ...overrides,
  };
}

const optimistic = (item: CartItem): CartLineValidation => ({ variant_id: item.variantId, available: true });

describe("OrderReview", () => {
  it("明細と小計・送料・合計を表示する", () => {
    const items = [makeItem()];
    const totals = summarizeCart(items, optimistic);

    render(<OrderReview items={items} getValidation={optimistic} totals={totals} />);

    expect(screen.getByText("ボクシーTシャツ")).toBeInTheDocument();
    expect(screen.getByText("M / 黒 × 2")).toBeInTheDocument();
    expect(screen.getAllByText("¥10,000")).toHaveLength(2); // 明細の小計とSubtotalの両方
  });

  it("買えない明細には注意書きを出す", () => {
    const items = [makeItem({ quantity: 5 })];
    const validation = (): CartLineValidation => ({ variant_id: 1, available: true, max_quantity: 3 });
    const totals = summarizeCart(items, validation);

    render(<OrderReview items={items} getValidation={validation} totals={totals} />);

    expect(screen.getByText("在庫は3点までです")).toBeInTheDocument();
  });

  it("送料無料のときはFreeと表示する", () => {
    const items = [makeItem({ unitPrice: 20_000, quantity: 1 })];
    const totals = summarizeCart(items, optimistic);

    render(<OrderReview items={items} getValidation={optimistic} totals={totals} />);

    expect(screen.getByText("Free")).toBeInTheDocument();
  });
});
