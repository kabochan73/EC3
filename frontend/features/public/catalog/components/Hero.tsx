"use client";

import { useEffect, useState } from "react";

import type { ContentImage } from "../types";

type Props = {
  headline: string;
  tagline: string;
  images: ContentImage[];
};

const SLIDE_INTERVAL_MS = 5000;

/**
 * 複数画像が自動でopacityフェード切り替わるスライドショー（手動ナビゲーションなし）。
 * headline/taglineは全スライド共通で1つ（docs/frontend/cms.md）。
 * images=0: bg-mistにNO IMAGE（docs/frontend/design-reference.md）。images=1: フェードなし固定表示。
 */
export function Hero({ headline, tagline, images }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <section className="relative flex h-screen items-center justify-center overflow-hidden">
      {images.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-mist">
          <span className="text-xs tracking-widest text-graphite uppercase">NO IMAGE</span>
        </div>
      ) : (
        images.map((image, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- /mediaプロキシ配信はフェーズ4で実装
          <img
            key={image.url}
            src={image.url}
            alt={image.alt ?? ""}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000"
            style={{ opacity: index === activeIndex ? 1 : 0 }}
          />
        ))
      )}

      <div className="relative z-10 text-center">
        <h1 className="text-sm tracking-[0.3em] uppercase">{headline}</h1>
        <p className="mt-2 text-xs tracking-widest text-graphite uppercase">{tagline}</p>
      </div>
    </section>
  );
}
