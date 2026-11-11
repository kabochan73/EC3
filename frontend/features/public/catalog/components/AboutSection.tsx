import type { AboutBlock } from "../types";

type Props = {
  blocks: AboutBlock[];
};

/** 沿革・素材・製造背景のブロック配列（3ブロック想定）。0件ならセクションごと出さない（docs/frontend/cms.md）。 */
export function AboutSection({ blocks }: Props) {
  if (blocks.length === 0) return null;

  return (
    <section className="px-6 py-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-16">
        {blocks.map((block, index) => (
          <div key={index} className="grid gap-8 md:grid-cols-2 md:items-center">
            {block.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- /mediaプロキシ配信はフェーズ4で実装
              <img src={block.image_url} alt="" className="aspect-4/3 w-full object-cover" />
            ) : (
              <div className="flex aspect-4/3 w-full items-center justify-center bg-mist">
                <span className="text-xs tracking-widest text-graphite uppercase">NO IMAGE</span>
              </div>
            )}
            <div>
              <p className="text-xs tracking-widest text-graphite uppercase">{block.label}</p>
              <h2 className="mt-2 text-lg tracking-wide uppercase">{block.heading}</h2>
              <p className="mt-4 text-sm leading-loose">{block.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
