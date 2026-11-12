import { z } from "zod";

// backend/app/Http/Requests/Admin/Category/CategoryRequest.phpと揃える。
// slugはLaravelのalpha_dash相当（英数字・ハイフン・アンダースコア）。
export const categoryFormSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(50),
  slug: z
    .string()
    .min(1, "スラッグを入力してください")
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, "英数字・ハイフン・アンダースコアのみ使えます"),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
