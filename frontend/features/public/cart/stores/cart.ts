// カート状態。zustand + persistでlocalStorageに保存（サーバーには一切送らない）。
// ログイン状態と無関係にブラウザ単位で保持する。
//
// 持つのは「追加時点の表示スナップショット」。実在庫・価格は/cart・/checkoutで
// GET /api/cart/validateにより再検証する。確定金額はPOST /api/ordersでサーバーが
// 再計算するので、ここがズレても実害はない。

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CART_MAX_QUANTITY_PER_LINE, CART_STORAGE_KEY } from "@/shared/lib/constants";

import type { CartItem } from "../types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  /** 0以下で削除扱い（数量ステッパーで0まで下げたケース） */
  setQuantity: (variantId: number, quantity: number) => void;
  clear: () => void;
};

/** 1明細の数量を上限（backendのcart_max_quantity_per_line）に収める。 */
function clampQuantity(quantity: number): number {
  return Math.min(quantity, CART_MAX_QUANTITY_PER_LINE);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.variantId === item.variantId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId
                  ? { ...i, quantity: clampQuantity(i.quantity + item.quantity) }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: clampQuantity(item.quantity) }] };
        }),

      removeItem: (variantId) =>
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        })),

      setQuantity: (variantId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.variantId !== variantId)
              : state.items.map((i) =>
                  i.variantId === variantId ? { ...i, quantity: clampQuantity(quantity) } : i,
                ),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      // SSRはlocalStorageが無いので初回描画は必ずitems:[]。自動復元だとクライアント初回
      // 描画がサーバーと食い違いhydration mismatchになるので、復元は明示的に
      // （マウント後に）行う（shared/components/providers/CartHydration.tsx）。
      skipHydration: true,
    },
  ),
);

/** ヘッダーのCART (n)用。数量合計（行数ではない）。 */
export function useCartItemCount(): number {
  return useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));
}

/**
 * localStorageからの復元が終わったか。復元前はitemsが必ず[]なので、
 * これを見ずに「空のカート」を出すと、中身があっても一瞬Your cart is emptyが見えてしまう。
 */
export function useCartHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useCartStore.persist.hasHydrated());

  useEffect(() => {
    return useCartStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
