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
import { getContent } from "../api";

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
