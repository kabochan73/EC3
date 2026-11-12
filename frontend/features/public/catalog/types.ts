// backend/app/Models/SiteContentのdata形状と1:1（docs/backend/cms.md）。

export type ContentImage = {
  url: string;
  alt: string | null;
};

export type AboutBlock = {
  label: string;
  heading: string;
  body: string;
  image_url: string | null;
};

export type SiteContent = {
  hero: {
    headline: string;
    tagline: string;
    images: ContentImage[];
  };
  concept: {
    body: string;
  };
  lookbook: {
    images: ContentImage[];
  };
  about: {
    blocks: AboutBlock[];
  };
};

// backend/app/Enums/StockStatus.php

export type StockStatus = "sold_out" | "low_stock" | "in_stock";

// backend/app/Http/Resources/Shop/CategoryResource

export type Category = {
  id: number;
  name: string;
  slug: string;
};

// backend/app/Http/Resources/Shop/ProductImageResource

export type ProductImage = {
  id: number;
  url: string;
  alt: string | null;
  position: number;
};

// backend/app/Http/Resources/Shop/ProductSummaryResource（一覧カード・関連商品で共通）

export type ProductSummary = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: { name: string; slug: string };
  stock_status: StockStatus;
  is_new: boolean;
  images: ProductImage[];
};
