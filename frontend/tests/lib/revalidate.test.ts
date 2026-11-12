import { describe, it, expect, vi, beforeEach } from "vitest";
import { revalidateTags } from "@/shared/lib/revalidate";

describe("revalidateTags", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true } as Response));
  });

  it("同一オリジンの/api/revalidateにPOSTする（Laravelではなく自分自身を呼ぶ）", async () => {
    await revalidateTags(["categories", "products"]);

    expect(fetch).toHaveBeenCalledWith(
      "/api/revalidate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tags: ["categories", "products"] }),
      }),
    );
  });
});
