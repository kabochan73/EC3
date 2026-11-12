import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
import { CategoryManager } from "../components/CategoryManager";
import type { AdminCategory } from "../types";

const categories: AdminCategory[] = [
  { id: 1, name: "トップス", slug: "tops", position: 0, products_count: 2 },
  { id: 2, name: "ボトムス", slug: "bottoms", position: 1, products_count: 0 },
];

describe("CategoryManager", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    vi.mocked(apiClientFetch).mockReset();
    vi.mocked(revalidateTags).mockReset();
  });

  it("一覧を表示する", () => {
    render(<CategoryManager categories={categories} />);

    expect(screen.getByText("トップス")).toBeInTheDocument();
    expect(screen.getByText("ボトムス")).toBeInTheDocument();
    expect(screen.getByText("tops")).toBeInTheDocument();
  });

  it("先頭行の上へボタンは非活性、末尾行の下へボタンは非活性", () => {
    render(<CategoryManager categories={categories} />);

    const ups = screen.getAllByLabelText("上へ");
    const downs = screen.getAllByLabelText("下へ");

    expect(ups[0]).toBeDisabled();
    expect(downs[downs.length - 1]).toBeDisabled();
  });

  it("下へを押すと並び替えリクエストを送り、revalidateしてrefreshする", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    render(<CategoryManager categories={categories} />);

    await userEvent.click(screen.getAllByLabelText("下へ")[0]);

    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/admin/categories/reorder",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ order: [2, 1] }),
      }),
    );
    await waitFor(() => expect(revalidateTags).toHaveBeenCalledWith(["categories", "products"]));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("Addを押すとCategoryFormが開き、保存できる", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    render(<CategoryManager categories={categories} />);

    await userEvent.click(screen.getByRole("button", { name: "Add New Category" }));
    await userEvent.type(screen.getByLabelText("Name"), "アクセサリー");
    await userEvent.type(screen.getByLabelText(/Slug/), "accessories");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/admin/categories",
      expect.objectContaining({ method: "POST" }),
    );
    await waitFor(() => expect(revalidateTags).toHaveBeenCalledWith(["categories", "products"]));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("Editを押すと既存値入りのCategoryFormが開く", async () => {
    render(<CategoryManager categories={categories} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]);

    expect(screen.getByLabelText("Name")).toHaveValue("トップス");
  });

  it("確認ダイアログでOKするとDeleteリクエストを送る", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    render(<CategoryManager categories={categories} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(apiClientFetch).toHaveBeenCalledWith("/api/admin/categories/1", { method: "DELETE" });
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("確認ダイアログでキャンセルすると何も送らない", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<CategoryManager categories={categories} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(apiClientFetch).not.toHaveBeenCalled();
  });

  it("削除が409で失敗したらLaravelのメッセージを表示する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "このカテゴリには商品が2件あります。先に移動または削除してください。" }),
    } as Response);
    render(<CategoryManager categories={categories} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(
      await screen.findByText("このカテゴリには商品が2件あります。先に移動または削除してください。"),
    ).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
