import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ toString: (): string => "" })),
}));

vi.mock("@/shared/lib/api-server", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib/api-server")>(
    "@/shared/lib/api-server",
  );
  return { ...actual, apiServerFetch: vi.fn() };
});

import { apiServerFetch } from "@/shared/lib/api-server";
import { getAdminProduct, getAdminProducts } from "../api";

describe("getAdminProducts", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("オプション無しでは/api/admin/productsをクエリ無しで呼ぶ", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1 } });

    await getAdminProducts();

    expect(apiServerFetch).toHaveBeenCalledWith("/api/admin/products");
  });

  it("q/category/pageを指定すると対応するクエリ文字列を付ける", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: [], meta: { current_page: 2, last_page: 3 } });

    await getAdminProducts({ q: "シャツ", category: "tops", page: 2 });

    expect(apiServerFetch).toHaveBeenCalledWith(
      `/api/admin/products?q=${encodeURIComponent("シャツ")}&category=tops&page=2`,
    );
  });

  it("page=1は省略する", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1 } });

    await getAdminProducts({ page: 1 });

    expect(apiServerFetch).toHaveBeenCalledWith("/api/admin/products");
  });
});

describe("getAdminProduct", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/admin/products/{id}を呼び、dataを返す", async () => {
    const product = { id: 1, name: "P" };
    vi.mocked(apiServerFetch).mockResolvedValue({ data: product });

    const result = await getAdminProduct(1);

    expect(apiServerFetch).toHaveBeenCalledWith("/api/admin/products/1");
    expect(result).toEqual(product);
  });
});
