import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { ProductCard } from "../components/ProductCard";
import type { ProductSummary } from "../types";

function makeProduct(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: 1,
    name: "ボクシーTシャツ",
    slug: "boxy-tee",
    price: 12000,
    category: { name: "トップス", slug: "tops" },
    stock_status: "in_stock",
    is_new: false,
    images: [],
    ...overrides,
  };
}

describe("ProductCard", () => {
  it("商品名・カテゴリ名・価格を表示する", () => {
    render(<ProductCard product={makeProduct()} />);

    expect(screen.getByText("ボクシーTシャツ")).toBeInTheDocument();
    expect(screen.getByText("トップス")).toBeInTheDocument();
    expect(screen.getByText("¥12,000")).toBeInTheDocument();
  });

  it("商品詳細へのリンクになっている", () => {
    render(<ProductCard product={makeProduct()} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/products/boxy-tee");
  });

  it("is_newならNEWバッジを表示する", () => {
    render(<ProductCard product={makeProduct({ is_new: true })} />);

    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("sold_outならSOLD OUTバッジを表示する", () => {
    render(<ProductCard product={makeProduct({ stock_status: "sold_out" })} />);

    expect(screen.getByText("SOLD OUT")).toBeInTheDocument();
  });

  it("low_stockならLOW STOCKバッジを表示する", () => {
    render(<ProductCard product={makeProduct({ stock_status: "low_stock" })} />);

    expect(screen.getByText("LOW STOCK")).toBeInTheDocument();
  });

  it("in_stockでは在庫バッジを表示しない", () => {
    render(<ProductCard product={makeProduct({ stock_status: "in_stock" })} />);

    expect(screen.queryByText("SOLD OUT")).not.toBeInTheDocument();
    expect(screen.queryByText("LOW STOCK")).not.toBeInTheDocument();
  });
});
