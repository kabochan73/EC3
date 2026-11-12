import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VariantSelector } from "../components/VariantSelector";
import type { ProductVariant } from "../types";

function variant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: 1,
    size: "M",
    color: null,
    stock_status: "in_stock",
    stock_label: "In Stock",
    selectable: true,
    ...overrides,
  };
}

describe("VariantSelector", () => {
  it("色が無い商品ではColor見出しを表示しない", () => {
    render(<VariantSelector colors={[]} variants={[variant()]} />);

    expect(screen.queryByText("Color")).not.toBeInTheDocument();
  });

  it("色がある商品では最初の色が選択された状態で始まる", () => {
    render(
      <VariantSelector
        colors={["黒", "白"]}
        variants={[
          variant({ id: 1, color: "黒", size: "M" }),
          variant({ id: 2, color: "白", size: "M" }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "黒" })).toHaveClass("bg-ink");
  });

  it("サイズ未選択ではAdd to Cartが非活性", () => {
    render(<VariantSelector colors={[]} variants={[variant()]} />);

    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeDisabled();
  });

  it("選択可能なサイズを選ぶとAdd to Cartが活性化する", async () => {
    const user = userEvent.setup();
    render(<VariantSelector colors={[]} variants={[variant({ size: "M" })]} />);

    await user.click(screen.getByRole("button", { name: "M" }));

    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeEnabled();
  });

  it("sold_outのサイズは選択できない", async () => {
    const user = userEvent.setup();
    render(
      <VariantSelector
        colors={[]}
        variants={[variant({ size: "M", stock_status: "sold_out", selectable: false })]}
      />,
    );

    const sizeButton = screen.getByRole("button", { name: "M" });
    expect(sizeButton).toBeDisabled();

    await user.click(sizeButton);
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeDisabled();
  });

  it("low_stockのサイズには(low stock)の表示が付く", () => {
    render(<VariantSelector colors={[]} variants={[variant({ size: "M", stock_status: "low_stock" })]} />);

    expect(screen.getByText("(low stock)")).toBeInTheDocument();
  });

  it("色を切り替えるとサイズ選択がリセットされ、その色のサイズのみ表示する", async () => {
    const user = userEvent.setup();
    render(
      <VariantSelector
        colors={["黒", "白"]}
        variants={[
          variant({ id: 1, color: "黒", size: "S" }),
          variant({ id: 2, color: "白", size: "M" }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "S" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "M" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "白" }));

    expect(screen.queryByRole("button", { name: "S" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "M" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeDisabled();
  });
});
