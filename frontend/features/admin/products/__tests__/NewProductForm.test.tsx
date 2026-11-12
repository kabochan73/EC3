import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
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
import { NewProductForm } from "../components/NewProductForm";

const categories: AdminCategory[] = [{ id: 1, name: "トップス", slug: "tops", position: 0, products_count: 0 }];

describe("NewProductForm", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.mocked(apiClientFetch).mockReset();
    vi.mocked(revalidateTags).mockReset();
  });

  it("作成に成功したら商品の編集ページへ遷移する", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 42 } }),
    } as Response);
    render(<NewProductForm categories={categories} />);

    await userEvent.type(screen.getByLabelText("Name"), "ボクシーTシャツ");
    await userEvent.type(screen.getByLabelText(/Slug/), "boxy-tee");
    await userEvent.type(screen.getByLabelText(/Price/), "12000");
    await userEvent.type(screen.getByLabelText("Description"), "説明文");
    await userEvent.type(screen.getByLabelText("Material"), "綿100%");
    await userEvent.type(screen.getByLabelText("Origin"), "日本");
    await userEvent.type(screen.getByLabelText("Product Code"), "EC-TP0001");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/admin/products",
      expect.objectContaining({ method: "POST" }),
    );
    expect(revalidateTags).toHaveBeenCalledWith(["categories", "products"]);
    expect(pushMock).toHaveBeenCalledWith("/admin/products/42");
  });
});
