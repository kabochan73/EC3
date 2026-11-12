// backend/app/Http/Resources/Admin/*（docs/api/admin.md）。
// 型定義はfeatureごとに独立させる方針のため、公開側のProductImage等とは重複を許容する。

export type SizeChart = {
  unit: string;
  columns: string[];
  rows: Record<string, number[]>;
};

// Admin/ProductListResource（一覧の1行）
export type AdminProductListItem = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: { id: number; name: string; slug: string };
  is_published: boolean;
  position: number;
  total_stock: number;
  variant_count: number;
};

export type AdminProductImage = {
  id: number;
  url: string;
  alt: string | null;
  position: number;
};

// Admin/ProductVariantResource（生のstock/skuを含む）
export type AdminProductVariant = {
  id: number;
  size: string;
  color: string | null;
  sku: string;
  stock: number;
  position: number;
};

// Admin/ProductResource（編集フォーム用の詳細）
export type AdminProduct = {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  material: string;
  care: string | null;
  origin: string;
  product_code: string;
  size_chart: SizeChart | null;
  is_published: boolean;
  position: number;
  created_at: string | null;
  images: AdminProductImage[];
  variants: AdminProductVariant[];
};
