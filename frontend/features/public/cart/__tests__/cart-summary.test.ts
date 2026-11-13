import { describe, expect, it } from "vitest";

import { CART_MAX_QUANTITY_PER_LINE, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/shared/lib/constants";

import { lineProblem, summarizeCart } from "../cart-summary";
import type { CartItem, CartLineValidation } from "../types";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 1,
    productSlug: "boxy-tee",
    productName: "ボクシーTシャツ",
    size: "M",
    color: "黒",
    unitPrice: 5000,
    quantity: 1,
    imageUrl: null,
    ...overrides,
  };
}

/** 再検証の結果がまだ無いとき（availableだけtrue） */
const optimistic = (item: CartItem): CartLineValidation => ({ variant_id: item.variantId, available: true });

describe("summarizeCart", () => {
  it("小計は単価×数量の合計", () => {
    const items = [
      makeItem({ variantId: 1, unitPrice: 5000, quantity: 2 }),
      makeItem({ variantId: 2, unitPrice: 3000 }),
    ];

    expect(summarizeCart(items, optimistic).subtotal).toBe(13000);
  });

  it("しきい値未満は送料あり、ちょうど以上は無料", () => {
    const under = summarizeCart([makeItem({ unitPrice: FREE_SHIPPING_THRESHOLD - 1 })], optimistic);
    expect(under.shipping).toBe(SHIPPING_FEE);
    expect(under.total).toBe(FREE_SHIPPING_THRESHOLD - 1 + SHIPPING_FEE);

    const exact = summarizeCart([makeItem({ unitPrice: FREE_SHIPPING_THRESHOLD })], optimistic);
    expect(exact.shipping).toBe(0);
    expect(exact.total).toBe(FREE_SHIPPING_THRESHOLD);
  });

  it("送料無料まであといくらか（無料ならゼロ）", () => {
    expect(summarizeCart([makeItem({ unitPrice: 15000 })], optimistic).untilFreeShipping).toBe(
      FREE_SHIPPING_THRESHOLD - 15000,
    );
    expect(summarizeCart([makeItem({ unitPrice: 30000 })], optimistic).untilFreeShipping).toBe(0);
  });

  it("再検証で返ってきたpriceが、カートに入れた時点の価格より優先される", () => {
    const validation = (): CartLineValidation => ({ variant_id: 1, available: true, price: 4000 });

    expect(summarizeCart([makeItem({ unitPrice: 5000, quantity: 2 })], validation).subtotal).toBe(8000);
  });

  it("問題のある行が1つでもあればblocked、全部正常ならfalse", () => {
    const soldOut = (item: CartItem): CartLineValidation =>
      item.variantId === 2 ? { variant_id: 2, available: true, stock_status: "sold_out" } : optimistic(item);

    expect(summarizeCart([makeItem(), makeItem({ variantId: 2 })], soldOut).blocked).toBe(true);
    expect(summarizeCart([makeItem(), makeItem({ variantId: 2 })], optimistic).blocked).toBe(false);
  });
});

describe("lineProblem", () => {
  it("販売終了（available: false）", () => {
    expect(lineProblem(makeItem(), { variant_id: 1, available: false })).toEqual({ kind: "unavailable" });
  });

  it("売り切れ", () => {
    expect(lineProblem(makeItem(), { variant_id: 1, available: true, stock_status: "sold_out" })).toEqual({
      kind: "sold_out",
    });
  });

  it("数量がmax_quantityを超えるとover_stock（ちょうどなら問題なし）", () => {
    const validation: CartLineValidation = { variant_id: 1, available: true, max_quantity: 3 };

    expect(lineProblem(makeItem({ quantity: 4 }), validation)).toEqual({ kind: "over_stock", max: 3 });
    expect(lineProblem(makeItem({ quantity: 3 }), validation)).toBeNull();
  });

  it("max_quantityが無いときは1明細の上限（10）で判定する", () => {
    expect(
      lineProblem(makeItem({ quantity: CART_MAX_QUANTITY_PER_LINE + 1 }), optimistic(makeItem())),
    ).toEqual({
      kind: "over_stock",
      max: CART_MAX_QUANTITY_PER_LINE,
    });
  });
});
