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
import { ProductImagesManager } from "../components/ProductImagesManager";
import type { AdminProductImage } from "../types";

const images: AdminProductImage[] = [
  { id: 1, url: "/media/a.jpg", alt: null, position: 0 },
  { id: 2, url: "/media/b.jpg", alt: null, position: 1 },
];

describe("ProductImagesManager", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    vi.mocked(apiClientFetch).mockReset();
    vi.mocked(revalidateTags).mockReset();
  });

  it("画像をPrimary/Hover/#nのラベル付きで表示する", () => {
    render(<ProductImagesManager productId={1} productSlug="boxy-tee" images={images} />);

    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByText("Hover")).toBeInTheDocument();
  });

  it("画像を選ぶとアップロードし、revalidateしてrefreshする", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    render(<ProductImagesManager productId={1} productSlug="boxy-tee" images={[]} />);

    const file = new File(["dummy"], "front.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/Upload Image/, { selector: "input" });
    await userEvent.upload(input, file);

    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/admin/products/1/images",
      expect.objectContaining({ method: "POST" }),
    );
    expect(revalidateTags).toHaveBeenCalledWith(["products", "product:boxy-tee"]);
    expect(refreshMock).toHaveBeenCalled();
  });

  it("▲を押すと並べ替えリクエストを送る", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    render(<ProductImagesManager productId={1} productSlug="boxy-tee" images={images} />);

    await userEvent.click(screen.getAllByLabelText("前へ")[1]);

    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/admin/products/1/images/reorder",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ order: [2, 1] }),
      }),
    );
  });

  it("確認ダイアログでOKすると削除リクエストを送る", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);
    render(<ProductImagesManager productId={1} productSlug="boxy-tee" images={images} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(apiClientFetch).toHaveBeenCalledWith("/api/admin/product-images/1", { method: "DELETE" });
  });

  it("削除が失敗したらエラーメッセージを表示する", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "削除に失敗しました。" }),
    } as Response);
    render(<ProductImagesManager productId={1} productSlug="boxy-tee" images={images} />);

    await userEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    expect(await screen.findByText("削除に失敗しました。")).toBeInTheDocument();
  });
});
