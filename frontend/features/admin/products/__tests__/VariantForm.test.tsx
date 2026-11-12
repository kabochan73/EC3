import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { VariantForm } from "../components/VariantForm";
import type { AdminProductVariant } from "../types";

describe("VariantForm", () => {
  it("新規作成ではsizeのセレクトを表示する", () => {
    render(<VariantForm onSubmit={vi.fn()} onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText("Size")).toBeInTheDocument();
  });

  it("編集ではsizeを表示だけにし、変更できない", () => {
    const variant: AdminProductVariant = { id: 1, size: "M", color: "黒", sku: "SKU-1", stock: 3, position: 0 };
    render(<VariantForm variant={variant} onSubmit={vi.fn()} onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByLabelText("Size")).not.toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("SKU未入力ではクライアント側のバリデーションエラーが出て送信しない", async () => {
    const onSubmit = vi.fn();
    render(<VariantForm onSubmit={onSubmit} onSaved={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("SKUを入力してください")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("成功時はcolorをnullにしてonSubmitを呼び、onSavedを呼ぶ", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true } as Response);
    const onSaved = vi.fn();
    render(<VariantForm onSubmit={onSubmit} onSaved={onSaved} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("SKU"), "SKU-1");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ size: "S", color: null, sku: "SKU-1", stock: 0 }),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("422エラーはフィールド下に表示される", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "入力内容を確認してください。", errors: { sku: ["このSKUは既に使われています。"] } }),
    } as Response);
    render(<VariantForm onSubmit={onSubmit} onSaved={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("SKU"), "SKU-1");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("このSKUは既に使われています。")).toBeInTheDocument();
  });

  it("Cancelを押すとonCancelを呼ぶ", async () => {
    const onCancel = vi.fn();
    render(<VariantForm onSubmit={vi.fn()} onSaved={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
