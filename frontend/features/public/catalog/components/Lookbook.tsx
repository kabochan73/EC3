import type { ContentImage } from "../types";

type Props = {
  images: ContentImage[];
};

/** ルックブックの横スクロール帯（画像のみ）。0枚でもbg-mistプレースホルダーを1枚表示する（docs/frontend/cms.md）。 */
export function Lookbook({ images }: Props) {
  if (images.length === 0) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto flex aspect-3/4 w-64 items-center justify-center bg-mist">
          <span className="text-xs tracking-widest text-graphite uppercase">NO IMAGE</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex gap-4 overflow-x-auto px-6 py-24">
      {images.map((image) => (
        // eslint-disable-next-line @next/next/no-img-element -- /mediaプロキシ配信はフェーズ4で実装
        <img
          key={image.url}
          src={image.url}
          alt={image.alt ?? ""}
          className="aspect-3/4 w-64 shrink-0 object-cover"
        />
      ))}
    </section>
  );
}
