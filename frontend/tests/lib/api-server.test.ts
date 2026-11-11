import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiServerFetch, ApiError } from "@/shared/lib/api-server";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    toString: (): string => "ecp_session=abc123",
  })),
}));

describe("apiServerFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("CookieとOriginヘッダを付けてfetchし、JSONを返す", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    } as Response);

    const result = await apiServerFetch("/api/me");

    expect(fetch).toHaveBeenCalledWith(
      "http://backend:8080/api/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: "ecp_session=abc123",
          Origin: "http://localhost:3000",
          Accept: "application/json",
        }),
        cache: "no-store",
      }),
    );
    expect(result).toEqual({ data: { id: 1 } });
  });

  it("非okレスポンスはApiErrorを投げる", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ message: "Not Found" }),
    } as Response);

    await expect(apiServerFetch("/api/products/x")).rejects.toThrow(ApiError);
  });

  it("next.revalidateを渡した場合はcacheオプションを付けない（ISRとno-storeの競合回避）", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    await apiServerFetch("/api/products", {
      next: { tags: ["products"], revalidate: 600 },
    });

    const call = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(call.cache).toBeUndefined();
    expect(call.next).toEqual({ tags: ["products"], revalidate: 600 });
  });

  it("next未指定（個人化データ）のときはno-storeをデフォルトにする", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    } as Response);

    await apiServerFetch("/api/me");

    const call = vi.mocked(fetch).mock.calls[0][1] as RequestInit;
    expect(call.cache).toBe("no-store");
  });
});
