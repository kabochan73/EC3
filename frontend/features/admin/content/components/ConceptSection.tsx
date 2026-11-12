"use client";

import { useState } from "react";

import type { SiteContent } from "@/features/public/content/types";

import { useContentSave } from "../hooks/useContentSave";
import { conceptSchema } from "./ConceptSection.schema";

type Props = {
  initial: SiteContent["concept"];
};

export function ConceptSection({ initial }: Props) {
  const [body, setBody] = useState(initial.body);
  const { save, isSaving, error, savedAt } = useContentSave("concept", conceptSchema);

  return (
    <section className="border-b border-black py-12">
      <h2 className="text-sm tracking-widest uppercase">Brand Concept</h2>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="mt-6 w-full border border-black bg-transparent p-4 text-sm outline-none"
      />

      {error && <p className="mt-2 text-xs text-graphite">{error}</p>}
      {savedAt && (
        <p className="mt-2 text-xs text-graphite">保存しました。トップページに反映されています。</p>
      )}

      <button
        type="button"
        onClick={() => save({ body })}
        disabled={isSaving}
        className="mt-4 bg-black px-6 py-2 text-xs tracking-widest text-white uppercase disabled:opacity-50"
      >
        {isSaving ? "..." : "Save"}
      </button>
    </section>
  );
}
