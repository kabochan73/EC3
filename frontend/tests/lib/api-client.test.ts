import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClientFetch } from "@/shared/lib/api-client";

function clearCookies(): void {
  document.cookie = "XSRF-TOKEN=; Max-Age=0; path=/";
}

describe("apiClientFetch", () => {
  beforeEach(() => {
    clearCookies();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("GETではCSRFのプライムを行わず、credentials:includeで送る", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    await apiClientFetch("/api/me");

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("XSRF-TOKENが無い状態でPOSTすると、先にCSRFクッキーを取得してからX-XSRF-TOKENを付けて送る", async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      if (String(input).endsWith("/sanctum/csrf-cookie")) {
        document.cookie = "XSRF-TOKEN=primed-token; path=/";
        return { ok: true } as Response;
      }
      return { ok: true } as Response;
    });

    await apiClientFetch("/api/login", { method: "POST", body: "{}" });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/sanctum/csrf-cookie",
      expect.objectContaining({ credentials: "include" }),
    );
    const [, secondInit] = vi.mocked(fetch).mock.calls[1];
    const headers = new Headers((secondInit as RequestInit).headers);
    expect(headers.get("X-XSRF-TOKEN")).toBe("primed-token");
  });

  it("XSRF-TOKENが既にある場合はCSRFクッキーを取得し直さない", async () => {
    document.cookie = "XSRF-TOKEN=existing-token; path=/";
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    await apiClientFetch("/api/login", { method: "POST", body: "{}" });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("X-XSRF-TOKEN")).toBe("existing-token");
  });
});
