import { z } from "zod";

import type { SizeChart } from "../types";

// backend/app/Http/Requests/Admin/Product/ProductRequest.phpと揃える。
// size_chartはSizeChartEditorが別に持ち、送信時にProductFormが合わせる。
export const productFormSchema = z.object({
  category_id: z.number().int().min(1, "カテゴリを選択してください"),
  name: z.string().min(1, "商品名を入力してください").max(120),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .max(140)
    .regex(/^[A-Za-z0-9_-]+$/, "英数字・ハイフン・アンダースコアのみ使えます"),
  price: z.number().int().min(1, "価格は1以上の整数で入力してください"),
  description: z.string().min(1, "説明を入力してください"),
  material: z.string().min(1, "素材を入力してください"),
  care: z.string().max(1000).optional().or(z.literal("")),
  origin: z.string().min(1, "原産国を入力してください").max(50),
  product_code: z.string().min(1, "品番を入力してください").max(30),
  is_published: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

/** Laravelに送る形（フォームの値 + サイズ表。空のcareはnullにする）。 */
export type ProductPayload = Omit<ProductFormValues, "care"> & {
  care: string | null;
  size_chart: SizeChart | null;
};
