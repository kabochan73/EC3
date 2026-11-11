import { z } from "zod";

export const conceptSchema = z.object({
  body: z.string().min(1, "本文を入力してください"),
});

export type ConceptFormValues = z.infer<typeof conceptSchema>;
