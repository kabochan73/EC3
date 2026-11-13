"use client";

import { useEffect } from "react";

import { useCartStore } from "@/features/public/cart/stores/cart";

/**
 * カートストアの復元を、マウント後（クライアントでのhydration完了後）に明示的に行う。
 * app/layout.tsxに1回だけ置く（何も描画しない）。
 */
export function CartHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return null;
}
