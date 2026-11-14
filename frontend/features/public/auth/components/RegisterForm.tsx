"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/shared/components/ui/Field";
import { apiClientFetch } from "@/shared/lib/api-client";
import { applyLaravelErrors } from "@/shared/lib/form-errors";
import { safeRedirect } from "@/shared/lib/safe-redirect";

import { registerSchema, type RegisterFormValues } from "./RegisterForm.schema";

type Props = {
  /** ?redirect=。page.tsx（SC）がsearchParamsから読んで渡す */
  redirectTo: string | null;
};

export function RegisterForm({ redirectTo }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    const res = await apiClientFetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(
        applyLaravelErrors<RegisterFormValues>(body, setError, "会員登録に失敗しました。"),
      );
      return;
    }

    // ヘッダーのAccountLinkが即座にログイン状態へ貼り替わるようにする
    await queryClient.invalidateQueries({ queryKey: ["session"] });
    router.push(safeRedirect(redirectTo));
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md px-6 py-24">
      <h1 className="text-center text-4xl tracking-[0.15em] uppercase">Register</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-12 space-y-6">
        <Field
          label="Name"
          id="name"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Field
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          label="Password"
          id="password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Field
          label="Confirm Password"
          id="password_confirmation"
          type="password"
          autoComplete="new-password"
          error={errors.password_confirmation?.message}
          {...register("password_confirmation")}
        />

        {serverError && <p className="text-lg text-gray-600">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black py-3 text-xl font-semibold tracking-widest text-white uppercase transition-opacity hover:opacity-80 disabled:opacity-60"
        >
          {isSubmitting ? "..." : "Register"}
        </button>
      </form>

      <p className="mt-8 text-center text-lg text-gray-600">
        Already have an account?{" "}
        <Link
          href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
          className="text-black underline underline-offset-2"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
