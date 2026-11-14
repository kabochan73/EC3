import { z } from "zod";

export const newAddressSchema = z.object({
  recipient_name: z.string().min(1, "お名前を入力してください").max(100),
  postal_code: z
    .string()
    .min(1, "郵便番号を入力してください")
    .regex(/^\d{3}-\d{4}$/, "123-4567の形式で入力してください"),
  prefecture: z.string().min(1, "都道府県を入力してください").max(10),
  city: z.string().min(1, "市区町村を入力してください").max(100),
  address_line1: z.string().min(1, "番地を入力してください").max(255),
  address_line2: z.string().max(255).optional().or(z.literal("")),
  phone: z.string().min(1, "電話番号を入力してください").max(20),
});

export type NewAddressFormValues = z.infer<typeof newAddressSchema>;
