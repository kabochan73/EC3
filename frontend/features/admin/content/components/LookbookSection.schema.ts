import { z } from "zod";

export const lookbookSchema = z.object({
  images: z.array(
    z.object({
      url: z.string().min(1),
      alt: z.string().nullable(),
    }),
  ),
});

export type LookbookFormValues = z.infer<typeof lookbookSchema>;
