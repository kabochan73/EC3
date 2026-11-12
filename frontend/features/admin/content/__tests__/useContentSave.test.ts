import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";

vi.mock("@/shared/lib/api-client", () => ({
  apiClientFetch: vi.fn(),
}));

vi.mock("@/shared/lib/revalidate", () => ({
  revalidateTags: vi.fn(),
}));

import { apiClientFetch } from "@/shared/lib/api-client";
import { revalidateTags } from "@/shared/lib/revalidate";
import { useContentSave } from "../hooks/useContentSave";

const schema = z.object({ body: z.string().min(1, "本文を入力してください") });

describe("useContentSave", () => {
  beforeEach(() => {
    vi.mocked(apiClientFetch).mockReset();
    vi.mocked(revalidateTags).mockReset();
  });

  it("保存成功でPUTとrevalidateの両方を呼び、savedAtをセットする", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({ ok: true } as Response);

    const { result } = renderHook(() => useContentSave("concept", schema));

    let saved = false;
    await act(async () => {
      saved = await result.current.save({ body: "本文" });
    });

    expect(saved).toBe(true);
    expect(apiClientFetch).toHaveBeenCalledWith(
      "/api/admin/content/concept",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(revalidateTags).toHaveBeenCalledWith(["content"]);
    await waitFor(() => expect(result.current.savedAt).not.toBeNull());
    expect(result.current.error).toBeNull();
  });

  it("zodバリデーションに失敗するとAPIを呼ばずにエラーを返す", async () => {
    const { result } = renderHook(() => useContentSave("concept", schema));

    let saved = true;
    await act(async () => {
      saved = await result.current.save({ body: "" });
    });

    expect(saved).toBe(false);
    expect(apiClientFetch).not.toHaveBeenCalled();
    expect(result.current.error).toBe("本文を入力してください");
  });

  it("PUTが失敗したらエラーメッセージをセットし、revalidateは呼ばない", async () => {
    vi.mocked(apiClientFetch).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "保存できませんでした。" }),
    } as Response);

    const { result } = renderHook(() => useContentSave("concept", schema));

    let saved = true;
    await act(async () => {
      saved = await result.current.save({ body: "本文" });
    });

    expect(saved).toBe(false);
    expect(apiClientFetch).toHaveBeenCalledTimes(1);
    expect(revalidateTags).not.toHaveBeenCalled();
    expect(result.current.error).toBe("保存できませんでした。");
  });
});
