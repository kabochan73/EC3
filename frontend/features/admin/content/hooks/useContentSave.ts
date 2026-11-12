"use client";

import { useState } from "react";
import type { ZodType } from "zod";

import { apiClientFetch } from "@/shared/lib/api-client";
import { revalidateTags } from "@/shared/lib/revalidate";

/**
 * CMSセクションの保存（docs/frontend/cms.md）。
 * zodで確かめる→PUT /api/admin/content/{key}→成功後POST /api/revalidate（tags: ['content']）。
 */
export function useContentSave<T>(key: string, schema: ZodType<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function save(data: T): Promise<boolean> {
    setIsSaving(true);
    setError(null);
    setSavedAt(null);

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力内容を確認してください。");
      setIsSaving(false);
      return false;
    }

    const res = await apiClientFetch(`/api/admin/content/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      // このフックはuseStateで入力を持つ画面向け（react-hook-formは使わない）ため、
      // フィールド単位の割り当てはせずメッセージだけ表示する（docs/frontend/cms.md）。
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "保存に失敗しました。");
      setIsSaving(false);
      return false;
    }

    await revalidateTags(["content"]);

    setIsSaving(false);
    setSavedAt(Date.now());
    return true;
  }

  return { save, isSaving, error, savedAt };
}
