// カートの1行。APIのレスポンスではなく、このストアが持つ形（追加時点の表示スナップショット）。
export type CartItem = {
  variantId: number;
  productSlug: string;
  productName: string;
  size: string;
  color: string | null;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
};
