"use client";

import { useState } from "react";

import type { AboutBlock, SiteContent } from "@/features/public/content/types";
import { moveItem } from "@/shared/lib/array";

import { useContentSave } from "../hooks/useContentSave";
import { aboutSchema } from "./AboutSection.schema";
import { ContentImageUpload } from "./ContentImageUpload";

type Props = {
  initial: SiteContent["about"];
};

const EMPTY_BLOCK: AboutBlock = { label: "", heading: "", body: "", image_url: null };

export function AboutSection({ initial }: Props) {
  const [blocks, setBlocks] = useState<AboutBlock[]>(initial.blocks);
  const { save, isSaving, error, savedAt } = useContentSave("about", aboutSchema);

  function addBlock() {
    setBlocks((current) => [...current, EMPTY_BLOCK]);
  }

  function removeBlock(index: number) {
    setBlocks((current) => current.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setBlocks((current) => moveItem(current, index, index + direction));
  }

  function updateBlock(index: number, patch: Partial<AboutBlock>) {
    setBlocks((current) =>
      current.map((block, i) => (i === index ? { ...block, ...patch } : block)),
    );
  }

  return (
    <section className="border-b border-black py-12">
      <h2 className="text-sm tracking-widest uppercase">About</h2>

      <div className="mt-6 flex flex-col gap-10">
        {blocks.map((block, index) => (
          <div key={index} className="border border-black p-6">
            <div className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Label (e.g. Since 2026)"
                value={block.label}
                onChange={(e) => updateBlock(index, { label: e.target.value })}
                className="border-b border-black bg-transparent py-2 text-sm outline-none"
              />
              <input
                type="text"
                placeholder="Heading"
                value={block.heading}
                onChange={(e) => updateBlock(index, { heading: e.target.value })}
                className="border-b border-black bg-transparent py-2 text-sm outline-none"
              />
              <textarea
                placeholder="Body"
                value={block.body}
                onChange={(e) => updateBlock(index, { body: e.target.value })}
                rows={3}
                className="border border-black bg-transparent p-3 text-sm outline-none"
              />
              <ContentImageUpload
                contentKey="about"
                image={block.image_url ? { url: block.image_url, alt: null } : null}
                onChange={(next) => updateBlock(index, { image_url: next?.url ?? null })}
              />
            </div>

            <div className="mt-4 flex gap-4">
              <button
                type="button"
                onClick={() => moveBlock(index, -1)}
                disabled={index === 0}
                className="text-xs uppercase underline disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 1)}
                disabled={index === blocks.length - 1}
                className="text-xs uppercase underline disabled:opacity-30"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => removeBlock(index)}
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
        onClick={addBlock}
        className="mt-6 text-xs tracking-widest uppercase underline"
      >
        + Add Block
      </button>

      {error && <p className="mt-2 text-xs text-graphite">{error}</p>}
      {savedAt && (
        <p className="mt-2 text-xs text-graphite">保存しました。トップページに反映されています。</p>
      )}

      <div>
        <button
          type="button"
          onClick={() => save({ blocks })}
          disabled={isSaving}
          className="mt-4 bg-black px-6 py-2 text-xs tracking-widest text-white uppercase disabled:opacity-50"
        >
          {isSaving ? "..." : "Save"}
        </button>
      </div>
    </section>
  );
}
