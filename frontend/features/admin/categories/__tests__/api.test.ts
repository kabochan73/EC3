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
import { getAdminCategories } from "../api";

describe("getAdminCategories", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/admin/categoriesを呼び、dataを返す", async () => {
    const categories = [
      { id: 1, name: "トップス", slug: "tops", position: 0, products_count: 3 },
    ];
    vi.mocked(apiServerFetch).mockResolvedValue({ data: categories });

    const result = await getAdminCategories();

    expect(apiServerFetch).toHaveBeenCalledWith("/api/admin/categories");
    expect(result).toEqual(categories);
  });
});
