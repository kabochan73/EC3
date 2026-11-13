import { beforeEach, describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

import { useCartItemCount, useCartStore } from "../stores/cart";
import type { CartItem } from "../types";

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

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("useCartStore", () => {
  it("addItemで新しい明細を追加する", () => {
    useCartStore.getState().addItem(makeItem());

    expect(useCartStore.getState().items).toEqual([makeItem()]);
  });

  it("同じvariantIdをaddItemすると数量を合算する", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ quantity: 3 }));

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it("数量は上限（10）を超えない", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 8 }));
    useCartStore.getState().addItem(makeItem({ quantity: 8 }));

    expect(useCartStore.getState().items[0].quantity).toBe(10);
  });

  it("removeItemで該当の明細だけ削除する", () => {
    useCartStore.getState().addItem(makeItem({ variantId: 1 }));
    useCartStore.getState().addItem(makeItem({ variantId: 2 }));

    useCartStore.getState().removeItem(1);

    expect(useCartStore.getState().items.map((i) => i.variantId)).toEqual([2]);
  });

  it("setQuantityで数量を変更する", () => {
    useCartStore.getState().addItem(makeItem({ quantity: 1 }));

    useCartStore.getState().setQuantity(1, 4);

    expect(useCartStore.getState().items[0].quantity).toBe(4);
  });

  it("setQuantityで0以下にすると削除扱いになる", () => {
    useCartStore.getState().addItem(makeItem());

    useCartStore.getState().setQuantity(1, 0);

    expect(useCartStore.getState().items).toEqual([]);
  });

  it("clearで全明細を削除する", () => {
    useCartStore.getState().addItem(makeItem({ variantId: 1 }));
    useCartStore.getState().addItem(makeItem({ variantId: 2 }));

    useCartStore.getState().clear();

    expect(useCartStore.getState().items).toEqual([]);
  });

  it("useCartItemCountは数量の合計を返す（行数ではない）", () => {
    useCartStore.getState().addItem(makeItem({ variantId: 1, quantity: 2 }));
    useCartStore.getState().addItem(makeItem({ variantId: 2, quantity: 3 }));

    const { result } = renderHook(() => useCartItemCount());

    expect(result.current).toBe(5);
  });
});
