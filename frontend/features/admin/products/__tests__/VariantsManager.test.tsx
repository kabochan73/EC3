import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/shared/lib/api-client", () => ({
  apiClientFetch: vi.fn(),
}));

vi.mock("@/shared/lib/revalidate", () => ({
  revalidateTags: vi.fn(),
}));

import { apiClientFetch } from "@/shared/lib/api-client";
import { revalidateTags } from "@/shared/lib/revalidate";
import { VariantsManager } from "../components/VariantsManager";
import type { AdminProductVariant } from "../types";

const variants: AdminProductVariant[] = [
  { id: 1, size: "S", color: null, sku: "SKU-1", stock: 3, position: 0 },
  { id: 2, size: "M", color: "黒", sku: "SKU-2", stock: 0, position: 1 },
];

describe("VariantsManager", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    vi.mocked(apiClientFetch).mockReset();
    vi.mocked(revalidateTags).mockReset();
  });

  it("バリアントが無ければ案内メッセージを表示する", () => {
    render(<VariantsManager productId={1} productSlug="boxy-tee" variants={[]} />);

    expect(screen.getByText(/バリアントがありません/)).toBeInTheDocument();
  });

  it("一覧を表示する", () => {
    render(<VariantsManager productId={1} productSlug="boxy-tee" variants={variants} />);

    expect(screen.getByText("SKU-1")).toBeInTheDocument();
    expect(screen.getByText("黒")).toBeInTheDocument();
  });

  it("Addで新規作成フォームが開き、保存できる", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    render(<VariantsManager productId={1} productSlug="boxy-tee" variants={variants} />);

    await userEvent.click(screen.getByRole("button", { name: "Add New Variant" }));
    await userEvent.type(screen.getByLabelText("SKU"), "SKU-3");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/admin/products/1/variants",
      expect.objectContaining({ method: "POST" }),
    );
    expect(revalidateTags).toHaveBeenCalledWith(["products", "product:boxy-tee"]);
    expect(refreshMock).toHaveBeenCalled();
  });

  it("Editで既存値入りのフォームが開き、sizeは変更できない", async () => {
    render(<VariantsManager productId={1} productSlug="boxy-tee" variants={variants} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Edit" })[1]);

    expect(screen.getByLabelText("SKU")).toHaveValue("SKU-2");
    expect(screen.queryByLabelText("Size")).not.toBeInTheDocument();
  });

  it("確認ダイアログでOKすると削除リクエストを送る", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    render(<VariantsManager productId={1} productSlug="boxy-tee" variants={variants} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(apiClientFetch).toHaveBeenCalledWith("/api/admin/variants/1", { method: "DELETE" });
    expect(revalidateTags).toHaveBeenCalledWith(["products", "product:boxy-tee"]);
  });

  it("削除確認をキャンセルすると何もしない", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<VariantsManager productId={1} productSlug="boxy-tee" variants={variants} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(apiClientFetch).not.toHaveBeenCalled();
  });
});
