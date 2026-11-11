import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(1, "氏名を入力してください"),
    email: z.string().email("メールアドレスの形式で入力してください"),
    password: z.string().min(8, "8文字以上で入力してください"),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "パスワードが一致しません",
    path: ["password_confirmation"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
