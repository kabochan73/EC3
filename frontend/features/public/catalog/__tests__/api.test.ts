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
import { getCategories, getContent, getProducts } from "../api";

describe("getContent", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/contentをISRタグ付きで呼び、dataを返す", async () => {
    const content = {
      hero: { headline: "H", tagline: "T", images: [] },
      concept: { body: "B" },
      lookbook: { images: [] },
      about: { blocks: [] },
    };
    vi.mocked(apiServerFetch).mockResolvedValue({ data: content });

    const result = await getContent();

    expect(apiServerFetch).toHaveBeenCalledWith(
      "/api/content",
      expect.objectContaining({ next: { tags: ["content"], revalidate: 3600 } }),
    );
    expect(result).toEqual(content);
  });
});

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
