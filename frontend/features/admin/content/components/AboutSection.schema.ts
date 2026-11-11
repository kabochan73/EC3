import { z } from "zod";

export const aboutSchema = z.object({
  blocks: z.array(
    z.object({
      label: z.string().min(1, "ラベルを入力してください"),
      heading: z.string().min(1, "見出しを入力してください"),
      body: z.string().min(1, "本文を入力してください"),
      image_url: z.string().nullable(),
    }),
  ),
});

export type AboutFormValues = z.infer<typeof aboutSchema>;
