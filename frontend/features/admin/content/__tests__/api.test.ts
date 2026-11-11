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
import { getAdminContent } from "../api";

describe("getAdminContent", () => {
  beforeEach(() => {
    vi.mocked(apiServerFetch).mockReset();
  });

  it("/api/admin/contentを呼び、dataを返す", async () => {
    const content = {
      hero: { headline: "H", tagline: "T", images: [] },
      concept: { body: "B" },
      lookbook: { images: [] },
      about: { blocks: [] },
    };
    vi.mocked(apiServerFetch).mockResolvedValue({ data: content });

    const result = await getAdminContent();

    expect(apiServerFetch).toHaveBeenCalledWith("/api/admin/content");
    expect(result).toEqual(content);
  });
});
