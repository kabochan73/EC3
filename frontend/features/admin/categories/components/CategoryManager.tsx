"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { apiClientFetch } from "@/shared/lib/api-client";
import { revalidateTags } from "@/shared/lib/revalidate";

import type { AdminCategory } from "../types";
import { CategoryForm } from "./CategoryForm";
import type { CategoryFormValues } from "./CategoryForm.schema";

type Mode = { type: "idle" } | { type: "adding" } | { type: "editing"; id: number };

type Props = {
  /** page.tsx（SC）が取得したposition順の一覧 */
  categories: AdminCategory[];
};

/**
 * カテゴリ管理（一覧・追加・編集・削除・▲▼並べ替え。Client Component）。
 * 一覧はpage.tsx（SC）が取ってpropsで渡し、操作の後はrouter.refresh()で描き直す
 * （docs/frontend/rendering-strategy.md）。書き込み成功後はrevalidateTagsで
 * トップページのISRキャッシュ（categories + products）も無効化する。
 */
export function CategoryManager({ categories }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ type: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    setMode({ type: "idle" });
    startTransition(() => router.refresh());
  }

  /** 削除・並べ替え。失敗したらLaravelのメッセージ（409の「商品がN件あります」など）を出す */
  async function act(res: Promise<Response>, failMessage: string) {
    setError(null);
    const response = await res;
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.message ?? failMessage);
      return;
    }
    await revalidateTags(["categories", "products"]);
    refresh();
  }

  function handleDelete(category: AdminCategory) {
    if (!window.confirm(`「${category.name}」を削除しますか？`)) return;
    act(apiClientFetch(`/api/admin/categories/${category.id}`, { method: "DELETE" }), "削除に失敗しました。");
  }

  /** 今の並び順でindexとindex+directionを入れ替えて、全idの順番を送る */
  function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    act(
      apiClientFetch("/api/admin/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: reordered.map((c) => c.id) }),
      }),
      "並べ替えに失敗しました。",
    );
  }

  async function handleCreate(values: CategoryFormValues): Promise<Response> {
    return apiClientFetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
  }

  function handleUpdate(id: number, values: CategoryFormValues): Promise<Response> {
    return apiClientFetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
  }

  async function handleSaved() {
    await revalidateTags(["categories", "products"]);
    refresh();
  }

  const editing = mode.type === "editing" ? categories.find((c) => c.id === mode.id) : undefined;

  return (
    <div className={pending ? "opacity-60" : ""}>
      {error && <p className="mb-6 text-xs text-graphite">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-[11px] tracking-widest text-graphite uppercase">
              <th className="w-20 py-2 pr-4 font-normal">Order</th>
              <th className="py-2 pr-4 font-normal">Name</th>
              <th className="py-2 pr-4 font-normal">Slug</th>
              <th className="py-2 pr-4 font-normal">Products</th>
              <th className="py-2 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category.id} className="border-b border-mist">
                <td className="py-3 pr-4">
                  <div className="flex gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0}
                      className="disabled:opacity-30"
                      aria-label="上へ"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === categories.length - 1}
                      className="disabled:opacity-30"
                      aria-label="下へ"
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td className="py-3 pr-4">{category.name}</td>
                <td className="py-3 pr-4 text-graphite">{category.slug}</td>
                <td className="py-3 pr-4 text-graphite">{category.products_count}</td>
                <td className="py-3">
                  <div className="flex gap-4 text-xs tracking-widest uppercase">
                    <button
                      type="button"
                      onClick={() => setMode({ type: "editing", id: category.id })}
                      className="underline underline-offset-2 hover:text-graphite"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      className="underline underline-offset-2 hover:text-graphite"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mode.type === "editing" && editing ? (
        <CategoryForm
          key={editing.id}
          initialValues={{ name: editing.name, slug: editing.slug }}
          onSubmit={(values) => handleUpdate(editing.id, values)}
          onSaved={handleSaved}
          onCancel={() => setMode({ type: "idle" })}
        />
      ) : mode.type === "adding" ? (
        <CategoryForm onSubmit={handleCreate} onSaved={handleSaved} onCancel={() => setMode({ type: "idle" })} />
      ) : (
        <button
          type="button"
          onClick={() => setMode({ type: "adding" })}
          className="mt-6 border border-ink px-6 py-3 text-xs tracking-widest uppercase transition-colors hover:bg-mist"
        >
          Add New Category
        </button>
      )}
    </div>
  );
}
