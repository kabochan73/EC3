import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { AdminCategory } from "@/features/admin/categories/types";
import { ProductForm } from "../components/ProductForm";

const categories: AdminCategory[] = [
  { id: 1, name: "トップス", slug: "tops", position: 0, products_count: 1 },
  { id: 2, name: "ボトムス", slug: "bottoms", position: 1, products_count: 0 },
];

async function fillRequiredFields() {
  await userEvent.type(screen.getByLabelText("Name"), "ボクシーTシャツ");
  await userEvent.type(screen.getByLabelText(/Slug/), "boxy-tee");
  await userEvent.type(screen.getByLabelText(/Price/), "12000");
  await userEvent.type(screen.getByLabelText("Description"), "説明文");
  await userEvent.type(screen.getByLabelText("Material"), "綿100%");
  await userEvent.type(screen.getByLabelText("Origin"), "日本");
  await userEvent.type(screen.getByLabelText("Product Code"), "EC-TP0001");
}

describe("ProductForm", () => {
  it("カテゴリの選択肢を表示する", () => {
    render(
      <ProductForm categories={categories} onSubmit={vi.fn()} onSaved={vi.fn()} submitLabel="Create" />,
    );

    expect(screen.getByRole("option", { name: "トップス" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ボトムス" })).toBeInTheDocument();
  });

  it("未入力ではクライアント側のバリデーションエラーが出て送信しない", async () => {
    const onSubmit = vi.fn();
    render(<ProductForm categories={categories} onSubmit={onSubmit} onSaved={vi.fn()} submitLabel="Create" />);

    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("商品名を入力してください")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("成功時はcare/size_chartを含むpayloadでonSubmitを呼び、onSavedを呼ぶ", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true } as Response);
    const onSaved = vi.fn();
    render(<ProductForm categories={categories} onSubmit={onSubmit} onSaved={onSaved} submitLabel="Create" />);

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ボクシーTシャツ",
        slug: "boxy-tee",
        price: 12000,
        care: null,
        size_chart: null,
        is_published: false,
      }),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("422エラーはフィールド下に表示される", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "入力内容を確認してください。", errors: { slug: ["このスラッグは既に使われています。"] } }),
    } as Response);
    render(<ProductForm categories={categories} onSubmit={onSubmit} onSaved={vi.fn()} submitLabel="Create" />);

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("このスラッグは既に使われています。")).toBeInTheDocument();
  });

  it("size_chart系の422はフォーム下にまとめて表示する", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "入力内容を確認してください。", errors: { "size_chart.columns": ["形式が不正です。"] } }),
    } as Response);
    render(<ProductForm categories={categories} onSubmit={onSubmit} onSaved={vi.fn()} submitLabel="Create" />);

    await fillRequiredFields();
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("サイズ表: 形式が不正です。")).toBeInTheDocument();
  });

  it("編集時は既存の値をフォームに表示する", () => {
    render(
      <ProductForm
        categories={categories}
        product={{
          id: 1,
          category_id: 2,
          name: "ウールセーター",
          slug: "wool-sweater",
          price: 18000,
          description: "説明",
          material: "ウール100%",
          care: "手洗い",
          origin: "日本",
          product_code: "EC-TP0002",
          size_chart: null,
          is_published: true,
          position: 0,
          created_at: null,
          images: [],
          variants: [],
        }}
        onSubmit={vi.fn()}
        onSaved={vi.fn()}
        submitLabel="Save"
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("ウールセーター");
    expect(screen.getByLabelText("Care（任意）")).toHaveValue("手洗い");
    expect(screen.getByLabelText("Published")).toBeChecked();
  });
});
