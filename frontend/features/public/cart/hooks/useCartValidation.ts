"use client";

import { useQuery } from "@tanstack/react-query";

import { validateCartLines } from "../api";
import type { CartItem, CartLineValidation } from "../types";

/**
 * カートの明細をGET /api/cart/validateで再検証する。
 * store（localStorage）は書き換えず、「今の本当の状態」を返すだけ。
 * カートから消す/数量を減らすのはユーザー操作（ステッパー・削除）に任せる。
 *
 * variant_id集合をキーにするので、数量変更では再取得は走らない。
 */
export function useCartValidation(items: CartItem[]) {
  const variantIds = [...new Set(items.map((item) => item.variantId))].sort((a, b) => a - b);

  const { data, isPending, isError } = useQuery({
    queryKey: ["cart-validate", variantIds],
    queryFn: () => validateCartLines(variantIds),
    staleTime: 30_000,
    enabled: variantIds.length > 0,
  });

  const byVariantId = new Map<number, CartLineValidation>();
  for (const line of data ?? []) {
    byVariantId.set(line.variant_id, line);
  }

  /** 取得前は楽観的にavailable扱い（初回ロードでカートを空に見せない）。 */
  function getValidation(item: CartItem): CartLineValidation {
    return byVariantId.get(item.variantId) ?? { variant_id: item.variantId, available: true };
  }

  return { getValidation, loading: isPending, error: isError };
}
