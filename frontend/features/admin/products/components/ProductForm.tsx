"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { AdminCategory } from "@/features/admin/categories/types";
import { Field } from "@/shared/components/ui/Field";
import { applyLaravelErrors } from "@/shared/lib/form-errors";

import type { AdminProduct, SizeChart } from "../types";
import { productFormSchema, type ProductFormValues, type ProductPayload } from "./ProductForm.schema";
import { SizeChartEditor } from "./SizeChartEditor";

type Props = {
  categories: AdminCategory[];
  /** 編集時は既存の商品、新規作成時はundefined */
  product?: AdminProduct;
  /** Laravelに送ってResponseを返す。エラーの割り当てはこのフォームが行う */
  onSubmit: (payload: ProductPayload) => Promise<Response>;
  onSaved: (res: Response) => void | Promise<void>;
  submitLabel: string;
};

const labelClass = "block text-[11px] tracking-widest text-graphite uppercase";
const textareaClass = "mt-2 w-full border border-ink bg-transparent p-2 text-sm outline-none";

/** 商品の「基本情報」フォーム（新規作成・編集で共用）。画像・バリアントは別の部品。 */
export function ProductForm({ categories, product, onSubmit, onSaved, submitLabel }: Props) {
  const [sizeChart, setSizeChart] = useState<SizeChart | null>(product?.size_chart ?? null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          category_id: product.category_id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          description: product.description,
          material: product.material,
          care: product.care ?? "",
          origin: product.origin,
          product_code: product.product_code,
          is_published: product.is_published,
        }
      : { category_id: categories[0]?.id, is_published: false },
  });

  async function submit(values: ProductFormValues) {
    setServerError(null);
    const res = await onSubmit({ ...values, care: values.care || null, size_chart: sizeChart });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const message = applyLaravelErrors<ProductFormValues>(body, setError, "保存できませんでした。");
      // size_chart.*のエラーは入力欄と1対1にならないので、下にまとめて出す
      const sizeChartKey = Object.keys(body?.errors ?? {}).find((key) => key.startsWith("size_chart"));
      setServerError(sizeChartKey ? `サイズ表: ${body.errors[sizeChartKey][0]}` : message);
      return;
    }

    await onSaved(res);
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="category_id" className={labelClass}>
          Category
        </label>
        <select
          id="category_id"
          className="mt-2 w-full border-b border-ink bg-transparent py-2 text-sm outline-none"
          {...register("category_id", { valueAsNumber: true })}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category_id && <p className="mt-1 text-xs text-graphite">{errors.category_id.message}</p>}
      </div>

      <Field label="Name" id="name" error={errors.name?.message} {...register("name")} />
      <Field
        label="Slug（例: boxy-cotton-t-shirt）"
        id="slug"
        error={errors.slug?.message}
        {...register("slug")}
      />
      <Field
        label="Price（円・税込）"
        id="price"
        type="number"
        error={errors.price?.message}
        {...register("price", { valueAsNumber: true })}
      />

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea id="description" rows={4} className={textareaClass} {...register("description")} />
        {errors.description && <p className="mt-1 text-xs text-graphite">{errors.description.message}</p>}
      </div>

      <div>
        <label htmlFor="material" className={labelClass}>
          Material
        </label>
        <textarea id="material" rows={2} className={textareaClass} {...register("material")} />
        {errors.material && <p className="mt-1 text-xs text-graphite">{errors.material.message}</p>}
      </div>

      <div>
        <label htmlFor="care" className={labelClass}>
          Care（任意）
        </label>
        <textarea id="care" rows={2} className={textareaClass} {...register("care")} />
      </div>

      <Field label="Origin" id="origin" error={errors.origin?.message} {...register("origin")} />
      <Field
        label="Product Code"
        id="product_code"
        error={errors.product_code?.message}
        {...register("product_code")}
      />

      <label className="flex items-center gap-2 text-[11px] tracking-widest text-graphite uppercase">
        <input type="checkbox" {...register("is_published")} />
        Published
      </label>

      <SizeChartEditor initialValue={product?.size_chart ?? null} onChange={setSizeChart} />

      {serverError && <p className="text-xs text-graphite">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-ink px-6 py-3 text-xs tracking-widest text-paper uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {isSubmitting ? "..." : submitLabel}
      </button>
    </form>
  );
}
