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

// backend/app/Enums/StockStatus.php

export type StockStatus = "sold_out" | "low_stock" | "in_stock";

// カート再検証（GET /api/cart/validate。backend/app/Http/Controllers/Api/Shop/CartController）。
// 購入できないvariantは{ variant_id, available: false }だけが返るので、他の項目は省略可能。
export type CartLineValidation = {
  variant_id: number;
  available: boolean;
  price?: number;
  stock_status?: StockStatus;
  /** min(在庫数, 1明細の上限)。公開APIで在庫数が分かる唯一の例外 */
  max_quantity?: number;
  product_name?: string;
  product_slug?: string;
  size?: string;
  color?: string | null;
  image_url?: string | null;
};
