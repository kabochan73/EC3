import { z } from "zod";

// backend/app/Http/Requests/Admin/Variant/{Store,Update}VariantRequest.phpと揃える。
// sizeは新規作成のときだけ選べる（更新では変えられない）。編集フォームでも今のsizeを
// 入れておくので、スキーマは1つで足りる。
export const SIZES = ["S", "M", "L", "FREE"] as const;

export const variantFormSchema = z.object({
  size: z.enum(SIZES),
  color: z.string().max(30).optional().or(z.literal("")),
  sku: z.string().min(1, "SKUを入力してください").max(40),
  stock: z.number().int().min(0, "0以上の整数で入力してください"),
});

export type VariantFormValues = z.infer<typeof variantFormSchema>;

/** Laravelに送る形（空のcolorはnull）。更新ではsizeを送らない。 */
export type CreateVariantPayload = Omit<VariantFormValues, "color"> & { color: string | null };
export type UpdateVariantPayload = Omit<CreateVariantPayload, "size">;
