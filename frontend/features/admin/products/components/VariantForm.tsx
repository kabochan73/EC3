"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/shared/components/ui/Field";
import { applyLaravelErrors } from "@/shared/lib/form-errors";

import type { AdminProductVariant } from "../types";
import {
  SIZES,
  variantFormSchema,
  type CreateVariantPayload,
  type VariantFormValues,
} from "./VariantForm.schema";

type Props = {
  /** 編集時は既存のバリアント、新規作成時はundefined */
  variant?: AdminProductVariant;
  /** Laravelに送ってResponseを返す。エラーの割り当てはこのフォームが行う（更新ではsizeを送らない） */
  onSubmit: (payload: CreateVariantPayload) => Promise<Response>;
  onSaved: () => void;
  onCancel: () => void;
};

/**
 * バリアントの追加・編集で共用するフォーム。sizeは新規作成のときだけ選べ、編集では表示だけ。
 * skuの重複・サイズ・色の組み合わせ重複などの422は欄の下に出す。
 */
export function VariantForm({ variant, onSubmit, onSaved, onCancel }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormValues>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: variant
      ? {
          size: variant.size as VariantFormValues["size"],
          color: variant.color ?? "",
          sku: variant.sku,
          stock: variant.stock,
        }
      : { size: "S", color: "", sku: "", stock: 0 },
  });

  async function submit(values: VariantFormValues) {
    setServerError(null);
    const res = await onSubmit({ ...values, color: values.color || null });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(applyLaravelErrors<VariantFormValues>(body, setError, "保存できませんでした。"));
      return;
    }

    onSaved();
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="mt-4 border border-ink p-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="w-24">
          {variant ? (
            <>
              <p className="text-[11px] tracking-widest text-graphite uppercase">Size</p>
              <p className="mt-2 py-2 text-sm">{variant.size}</p>
            </>
          ) : (
            <>
              <label htmlFor="size" className="block text-[11px] tracking-widest text-graphite uppercase">
                Size
              </label>
              <select
                id="size"
                className="mt-2 w-full border-b border-ink bg-transparent py-2 text-sm outline-none"
                {...register("size")}
              >
                {SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="w-32">
          <Field label="Color（任意）" id="color" error={errors.color?.message} {...register("color")} />
        </div>
        <div className="w-40">
          <Field label="SKU" id="sku" error={errors.sku?.message} {...register("sku")} />
        </div>
        <div className="w-24">
          <Field
            label="Stock"
            id="stock"
            type="number"
            error={errors.stock?.message}
            {...register("stock", { valueAsNumber: true })}
          />
        </div>
      </div>

      {errors.size && <p className="mt-2 text-xs text-graphite">{errors.size.message}</p>}
      {serverError && <p className="mt-2 text-xs text-graphite">{serverError}</p>}

      <div className="mt-4 flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {isSubmitting ? "..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
