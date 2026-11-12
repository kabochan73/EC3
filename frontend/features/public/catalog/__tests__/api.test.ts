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

import { ApiError, apiServerFetch } from "@/shared/lib/api-server";
import { getCategories, getProduct, getProducts } from "../api";

describe("getCategories", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/categoriesをISRタグ付きで呼び、dataを返す", async () => {
    const categories = [{ id: 1, name: "トップス", slug: "tops" }];
    vi.mocked(apiServerFetch).mockResolvedValue({ data: categories });

    const result = await getCategories();

    expect(apiServerFetch).toHaveBeenCalledWith(
      "/api/categories",
      expect.objectContaining({ next: { tags: ["categories"], revalidate: 3600 } }),
    );
    expect(result).toEqual(categories);
  });
});

describe("getProducts", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("オプション無しでは/api/productsをクエリ無しで呼ぶ", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: [] });

    await getProducts();

    expect(apiServerFetch).toHaveBeenCalledWith(
      "/api/products",
      expect.objectContaining({ next: { tags: ["products"], revalidate: 600 } }),
    );
  });

  it("category/isNew/limitを指定すると対応するクエリ文字列を付ける", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: [] });

    await getProducts({ category: "tops", isNew: true, limit: 4 });

    expect(apiServerFetch).toHaveBeenCalledWith(
      "/api/products?category=tops&new=true&limit=4",
      expect.anything(),
    );
  });
});

describe("getProduct", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/products/{slug}をproduct:{slug}とproductsのタグ付きで呼び、dataを返す", async () => {
    const product = { id: 1, name: "P", slug: "p" };
    vi.mocked(apiServerFetch).mockResolvedValue({ data: product });

    const result = await getProduct("p");

    expect(apiServerFetch).toHaveBeenCalledWith(
      "/api/products/p",
      expect.objectContaining({ next: { tags: ["product:p", "products"], revalidate: 600 } }),
    );
    expect(result).toEqual(product);
  });

  it("404はnullを返す", async () => {
    vi.mocked(apiServerFetch).mockRejectedValue(new ApiError(404, null));

    const result = await getProduct("not-exists");

    expect(result).toBeNull();
  });

  it("404以外のエラーはそのまま投げる", async () => {
    vi.mocked(apiServerFetch).mockRejectedValue(new ApiError(500, null));

    await expect(getProduct("p")).rejects.toThrow(ApiError);
  });
});
