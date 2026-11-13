import { beforeEach, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { useCartStore } from "@/features/public/cart/stores/cart";
import { CartCount } from "../CartCount";

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("CartCount", () => {
  it("カートが空なら0を表示する", () => {
    render(<CartCount />);

    expect(screen.getByText("Cart (0)")).toBeInTheDocument();
  });

  it("数量の合計を表示する（行数ではない）", () => {
    useCartStore.getState().addItem({
      variantId: 1,
      productSlug: "boxy-tee",
      productName: "ボクシーTシャツ",
      size: "M",
      color: null,
      unitPrice: 12000,
      quantity: 2,
      imageUrl: null,
    });
    useCartStore.getState().addItem({
      variantId: 2,
      productSlug: "wool-sweater",
      productName: "ウールセーター",
      size: "L",
      color: null,
      unitPrice: 18000,
      quantity: 3,
      imageUrl: null,
    });

    render(<CartCount />);

    expect(screen.getByText("Cart (5)")).toBeInTheDocument();
  });

  it("/cartへのリンクになっている", () => {
    render(<CartCount />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/cart");
  });
});
