"use client";

import { useState } from "react";

import type { ContentImage, SiteContent } from "@/features/public/catalog/types";
import { moveItem } from "@/shared/lib/array";

import { useContentSave } from "../hooks/useContentSave";
import { ContentImageUpload } from "./ContentImageUpload";
import { lookbookSchema } from "./LookbookSection.schema";

type Props = {
  initial: SiteContent["lookbook"];
};

export function LookbookSection({ initial }: Props) {
  const [images, setImages] = useState<ContentImage[]>(initial.images);
  const { save, isSaving, error, savedAt } = useContentSave("lookbook", lookbookSchema);

  function addImage() {
    setImages((current) => [...current, { url: "", alt: null }]);
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImages((current) => moveItem(current, index, index + direction));
  }

  function updateImage(index: number, next: ContentImage | null) {
    setImages((current) =>
      current.map((item, i) => (i === index ? (next ?? { url: "", alt: null }) : item)),
    );
  }

  function handleSave() {
    // urlが空の行（追加したがまだアップロードしていない）は保存から除外する
    save({ images: images.filter((image) => image.url) });
  }

  return (
    <section className="border-b border-black py-12">
      <h2 className="text-sm tracking-widest uppercase">Lookbook</h2>

      <div className="mt-6 flex flex-col gap-6">
        {images.map((image, index) => (
          <div key={index} className="flex items-start gap-4">
            <ContentImageUpload
              contentKey="lookbook"
              image={image.url ? image : null}
              onChange={(next) => updateImage(index, next)}
            />
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => moveImage(index, -1)}
                disabled={index === 0}
                className="text-xs uppercase underline disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveImage(index, 1)}
                disabled={index === images.length - 1}
                className="text-xs uppercase underline disabled:opacity-30"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="text-xs text-graphite uppercase underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addImage}
        className="mt-6 text-xs tracking-widest uppercase underline"
      >
        + Add Image
      </button>

      {error && <p className="mt-2 text-xs text-graphite">{error}</p>}
      {savedAt && (
        <p className="mt-2 text-xs text-graphite">保存しました。トップページに反映されています。</p>
      )}

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mt-4 bg-black px-6 py-2 text-xs tracking-widest text-white uppercase disabled:opacity-50"
        >
          {isSaving ? "..." : "Save"}
        </button>
      </div>
    </section>
  );
}
