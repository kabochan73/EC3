import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ toString: (): string => "" })),
}));

const { revalidateTagMock } = vi.hoisted(() => ({ revalidateTagMock: vi.fn() }));
vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
}));

vi.mock("@/shared/lib/api-server", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib/api-server")>(
    "@/shared/lib/api-server",
  );
  return { ...actual, apiServerFetch: vi.fn() };
});

import { apiServerFetch } from "@/shared/lib/api-server";
import { POST } from "@/app/api/revalidate/route";

function makeRequest(tags: string[]): Request {
  return new Request("http://localhost:3000/api/revalidate", {
    method: "POST",
    body: JSON.stringify({ tags }),
  });
}

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    revalidateTagMock.mockClear();
    vi.mocked(apiServerFetch).mockReset();
  });

  it("adminなら許可済みタグをrevalidateTagし、204を返す", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: { role: "admin" } });

    const res = await POST(makeRequest(["content", "products"]));

    expect(res.status).toBe(204);
    expect(revalidateTagMock).toHaveBeenCalledWith("content");
    expect(revalidateTagMock).toHaveBeenCalledWith("products");
  });

  it("product:{slug}形式のタグも許可する", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: { role: "admin" } });

    await POST(makeRequest(["product:boxy-tee"]));

    expect(revalidateTagMock).toHaveBeenCalledWith("product:boxy-tee");
  });

  it("許可リストに無いタグは無視する", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: { role: "admin" } });

    await POST(makeRequest(["something-else"]));

    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("非adminは403になる", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({ data: { role: "customer" } });

    const res = await POST(makeRequest(["content"]));

    expect(res.status).toBe(403);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("未認証（/api/meが失敗）は403になる", async () => {
    vi.mocked(apiServerFetch).mockRejectedValue(new Error("401"));

    const res = await POST(makeRequest(["content"]));

    expect(res.status).toBe(403);
  });
});
