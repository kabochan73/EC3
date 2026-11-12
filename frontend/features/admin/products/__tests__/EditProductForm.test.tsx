import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/shared/lib/api-client", () => ({
  apiClientFetch: vi.fn(),
}));

vi.mock("@/shared/lib/revalidate", () => ({
  revalidateTags: vi.fn(),
}));

import { apiClientFetch } from "@/shared/lib/api-client";
import { revalidateTags } from "@/shared/lib/revalidate";
import type { AdminCategory } from "@/features/admin/categories/types";
import { EditProductForm } from "../components/EditProductForm";
import type { AdminProduct } from "../types";

const categories: AdminCategory[] = [{ id: 1, name: "トップス", slug: "tops", position: 0, products_count: 1 }];

const product: AdminProduct = {
  id: 10,
  category_id: 1,
  name: "ボクシーTシャツ",
  slug: "boxy-tee",
  price: 12000,
  description: "説明",
  material: "綿100%",
  care: null,
  origin: "日本",
  product_code: "EC-TP0001",
  size_chart: null,
  is_published: true,
  position: 0,
  created_at: null,
  images: [],
  variants: [],
};

describe("EditProductForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    vi.mocked(apiClientFetch).mockReset();
    vi.mocked(revalidateTags).mockReset();
  });

  it("保存に成功すると新旧slugのタグをrevalidateし、router.refreshする", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { ...product, slug: "boxy-tee" } }),
    } as Response);
    render(<EditProductForm product={product} categories={categories} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/admin/products/10",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(revalidateTags).toHaveBeenCalledWith(
      expect.arrayContaining(["categories", "products", "product:boxy-tee"]),
    );
    expect(refreshMock).toHaveBeenCalled();
    expect(await screen.findByText("保存しました。")).toBeInTheDocument();
  });

  it("slugを変更して保存すると新旧両方のタグをrevalidateする", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { ...product, slug: "new-slug" } }),
    } as Response);
    render(<EditProductForm product={product} categories={categories} />);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await screen.findByText("保存しました。");
    const calledWith = vi.mocked(revalidateTags).mock.calls[0][0];
    expect(calledWith).toEqual(expect.arrayContaining(["product:boxy-tee", "product:new-slug"]));
  });

  it("削除を確認すると削除リクエストを送り、一覧へ遷移する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    render(<EditProductForm product={product} categories={categories} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete Product" }));

    expect(apiClientFetch).toHaveBeenCalledWith("/api/admin/products/10", { method: "DELETE" });
    expect(revalidateTags).toHaveBeenCalledWith(["categories", "products", "product:boxy-tee"]);
    expect(pushMock).toHaveBeenCalledWith("/admin/products");
  });

  it("削除確認をキャンセルすると何もしない", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<EditProductForm product={product} categories={categories} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete Product" }));

    expect(apiClientFetch).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("削除が失敗したらエラーメッセージを表示する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "削除に失敗しました。" }),
    } as Response);
    render(<EditProductForm product={product} categories={categories} />);

    await userEvent.click(screen.getByRole("button", { name: "Delete Product" }));

    expect(await screen.findByText("削除に失敗しました。")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
