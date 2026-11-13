import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("../../api", () => ({
  validateCartLines: vi.fn(),
}));

import { validateCartLines } from "../../api";
import { useCartValidation } from "../useCartValidation";
import type { CartItem } from "../../types";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 1,
    productSlug: "boxy-tee",
    productName: "ボクシーTシャツ",
    size: "M",
    color: null,
    unitPrice: 12000,
    quantity: 1,
    imageUrl: null,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useCartValidation", () => {
  beforeEach(() => {
    vi.mocked(validateCartLines).mockReset();
  });

  it("取得前はavailable:trueを楽観的に返す", () => {
    vi.mocked(validateCartLines).mockResolvedValue([]);

    const { result } = renderHook(() => useCartValidation([makeItem()]), { wrapper });

    expect(result.current.getValidation(makeItem())).toEqual({
      variant_id: 1,
      available: true,
    });
  });

  it("取得後はAPIの結果をvariant_idで返す", async () => {
    vi.mocked(validateCartLines).mockResolvedValue([
      { variant_id: 1, available: false },
    ]);

    const { result } = renderHook(() => useCartValidation([makeItem()]), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.getValidation(makeItem())).toEqual({
      variant_id: 1,
      available: false,
    });
  });

  it("重複したvariantIdは1回だけ問い合わせる", () => {
    vi.mocked(validateCartLines).mockResolvedValue([]);

    renderHook(
      () => useCartValidation([makeItem({ variantId: 1 }), makeItem({ variantId: 1 })]),
      { wrapper },
    );

    expect(validateCartLines).toHaveBeenCalledWith([1]);
  });

  it("カートが空なら問い合わせない", () => {
    renderHook(() => useCartValidation([]), { wrapper });

    expect(validateCartLines).not.toHaveBeenCalled();
  });
});
