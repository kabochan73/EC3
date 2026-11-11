import { z } from "zod";

export const heroSchema = z.object({
  headline: z.string().min(1, "見出しを入力してください"),
  tagline: z.string().min(1, "タグラインを入力してください"),
  images: z.array(
    z.object({
      url: z.string().min(1),
      alt: z.string().nullable(),
    }),
  ),
});

export type HeroFormValues = z.infer<typeof heroSchema>;
