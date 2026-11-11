import { describe, it, expect, vi, beforeEach } from "vitest";

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/shared/lib/api-server", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib/api-server")>(
    "@/shared/lib/api-server",
  );
  return { ...actual, apiServerFetch: vi.fn() };
});

import { apiServerFetch, ApiError } from "@/shared/lib/api-server";
import { requireAuth, requireAdmin } from "@/shared/lib/auth";

describe("requireAuth", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    vi.mocked(apiServerFetch).mockReset();
  });

  it("ログイン済みならユーザー情報を返す", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({
      data: { id: 1, name: "Aoi", email: "aoi@example.com", role: "customer" },
    });

    const user = await requireAuth();

    expect(user.email).toBe("aoi@example.com");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("未ログイン（401）なら/loginへリダイレクトする", async () => {
    vi.mocked(apiServerFetch).mockRejectedValue(new ApiError(401, null));

    await expect(requireAuth()).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("401以外のエラーはそのまま投げる", async () => {
    vi.mocked(apiServerFetch).mockRejectedValue(new ApiError(500, null));

    await expect(requireAuth()).rejects.toBeInstanceOf(ApiError);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    vi.mocked(apiServerFetch).mockReset();
  });

  it("adminユーザーならそのまま返す", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({
      data: { id: 1, name: "Admin", email: "admin@example.jp", role: "admin" },
    });

    const user = await requireAdmin();

    expect(user.role).toBe("admin");
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("customerユーザーは/へリダイレクトする", async () => {
    vi.mocked(apiServerFetch).mockResolvedValue({
      data: { id: 2, name: "Customer", email: "c@example.com", role: "customer" },
    });

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("未ログインなら/loginへリダイレクトする", async () => {
    vi.mocked(apiServerFetch).mockRejectedValue(new ApiError(401, null));

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
