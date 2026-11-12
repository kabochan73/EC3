"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/shared/components/ui/Field";
import { applyLaravelErrors } from "@/shared/lib/form-errors";

import { categoryFormSchema, type CategoryFormValues } from "./CategoryForm.schema";

type Props = {
  /** 編集時は既存カテゴリの初期値、新規作成時はundefined */
  initialValues?: CategoryFormValues;
  /** Laravelに送ってResponseを返す。エラーの割り当てはこのフォームが行う */
  onSubmit: (values: CategoryFormValues) => Promise<Response>;
  onSaved: () => void;
  onCancel: () => void;
};

/**
 * カテゴリの追加・編集で共用するフォーム。positionは扱わない
 * （新規は末尾に追加、既存は一覧の▲▼で変更 = CategoryManagerの役目）。
 */
export function CategoryForm({ initialValues, onSubmit, onSaved, onCancel }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialValues,
  });

  async function submit(values: CategoryFormValues) {
    setServerError(null);
    const res = await onSubmit(values);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(applyLaravelErrors<CategoryFormValues>(body, setError, "保存できませんでした。"));
      return;
    }

    onSaved();
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="mt-4 space-y-4 border border-ink p-6">
      <Field label="Name" id="name" error={errors.name?.message} {...register("name")} />
      <Field
        label="Slug（例: tops）"
        id="slug"
        placeholder="tops"
        error={errors.slug?.message}
        {...register("slug")}
      />

      {serverError && <p className="text-xs text-graphite">{serverError}</p>}

      <div className="flex gap-4 pt-2">
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
