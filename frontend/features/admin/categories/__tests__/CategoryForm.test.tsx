import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CategoryForm } from "../components/CategoryForm";

describe("CategoryForm", () => {
  it("初期値をフォームに表示する", () => {
    render(
      <CategoryForm
        initialValues={{ name: "トップス", slug: "tops" }}
        onSubmit={vi.fn()}
        onSaved={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Name")).toHaveValue("トップス");
    expect(screen.getByLabelText(/Slug/)).toHaveValue("tops");
  });

  it("未入力ではクライアント側のバリデーションエラーが出て送信しない", async () => {
    const onSubmit = vi.fn();
    render(<CategoryForm onSubmit={onSubmit} onSaved={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("名前を入力してください")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("不正なslugはクライアント側のバリデーションエラーが出る", async () => {
    render(<CategoryForm onSubmit={vi.fn()} onSaved={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Name"), "トップス");
    await userEvent.type(screen.getByLabelText(/Slug/), "トップス！");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("英数字・ハイフン・アンダースコアのみ使えます")).toBeInTheDocument();
  });

  it("成功時はonSavedを呼ぶ", async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true } as Response);
    const onSaved = vi.fn();
    render(<CategoryForm onSubmit={onSubmit} onSaved={onSaved} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Name"), "トップス");
    await userEvent.type(screen.getByLabelText(/Slug/), "tops");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "トップス", slug: "tops" });
    expect(await screen.findByText("Save")).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalled();
  });

  it("422エラーはフィールド下に表示される", async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: "入力内容を確認してください。", errors: { slug: ["このスラッグは既に使われています。"] } }),
    } as Response);
    render(<CategoryForm onSubmit={onSubmit} onSaved={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Name"), "トップス");
    await userEvent.type(screen.getByLabelText(/Slug/), "tops");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("このスラッグは既に使われています。")).toBeInTheDocument();
  });

  it("Cancelを押すとonCancelを呼ぶ", async () => {
    const onCancel = vi.fn();
    render(<CategoryForm onSubmit={vi.fn()} onSaved={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalled();
  });
});
