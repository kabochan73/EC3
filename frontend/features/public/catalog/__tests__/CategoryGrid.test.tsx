import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { CategoryGrid } from "../components/CategoryGrid";
import type { Category, ProductSummary } from "../types";

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

const categories: Category[] = [
  { id: 1, name: "トップス", slug: "tops" },
  { id: 2, name: "ボトムス", slug: "bottoms" },
];

describe("CategoryGrid", () => {
  it("カテゴリ名の見出しとそのカテゴリの商品を表示する", () => {
    render(
      <CategoryGrid
        categories={categories}
        products={[makeProduct({ id: 1, name: "商品A", category: { name: "トップス", slug: "tops" } })]}
      />,
    );

    expect(screen.getByRole("heading", { name: "トップス" })).toBeInTheDocument();
    expect(screen.getByText("商品A")).toBeInTheDocument();
  });

  it("商品0件のカテゴリはセクション自体を出さない", () => {
    render(<CategoryGrid categories={categories} products={[]} />);

    expect(screen.queryByRole("heading", { name: "トップス" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "ボトムス" })).not.toBeInTheDocument();
  });

  it("商品をカテゴリごとに振り分けて表示する", () => {
    render(
      <CategoryGrid
        categories={categories}
        products={[
          makeProduct({ id: 1, name: "トップス商品", category: { name: "トップス", slug: "tops" } }),
          makeProduct({ id: 2, name: "ボトムス商品", category: { name: "ボトムス", slug: "bottoms" } }),
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "トップス" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ボトムス" })).toBeInTheDocument();
    expect(screen.getByText("トップス商品")).toBeInTheDocument();
    expect(screen.getByText("ボトムス商品")).toBeInTheDocument();
  });
});
