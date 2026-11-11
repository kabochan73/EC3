"use client";

import { useState } from "react";

import { apiClientFetch } from "@/shared/lib/api-client";
import type { ContentImage } from "@/features/public/catalog/types";

type Props = {
  contentKey: string;
  image: ContentImage | null;
  onChange: (next: ContentImage | null) => void;
};

/**
 * プレビュー + Upload / Replace / Remove（docs/frontend/cms.md）。
 * アップロード直後はURLをstateに入れるだけで、保存するまでdataには入らない。
 */
export function ContentImageUpload({ contentKey, image, onChange }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    const res = await apiClientFetch(`/api/admin/content/${contentKey}/images`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      setError("アップロードに失敗しました。");
      setIsUploading(false);
      return;
    }

    const body = (await res.json()) as { url: string };
    onChange({ url: body.url, alt: image?.alt ?? null });
    setIsUploading(false);
  }

  return (
    <div className="flex items-start gap-4">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- /mediaプロキシ配信はフェーズ4で実装
        <img src={image.url} alt={image.alt ?? ""} className="h-24 w-24 object-cover" />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center bg-mist">
          <span className="text-[10px] tracking-widest text-graphite uppercase">NO IMAGE</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="cursor-pointer text-xs tracking-widest uppercase underline underline-offset-2">
          {isUploading ? "..." : image ? "Replace" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>

        {image && (
          <>
            <input
              type="text"
              placeholder="Alt text"
              value={image.alt ?? ""}
              onChange={(e) => onChange({ url: image.url, alt: e.target.value || null })}
              className="border-b border-black bg-transparent text-xs outline-none"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-left text-xs tracking-widest text-graphite uppercase underline underline-offset-2"
            >
              Remove
            </button>
          </>
        )}

        {error && <p className="text-xs text-graphite">{error}</p>}
      </div>
    </div>
  );
}
