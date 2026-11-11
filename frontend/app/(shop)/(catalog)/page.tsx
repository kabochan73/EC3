import { getContent } from "@/features/public/catalog/api";
import { AboutSection } from "@/features/public/catalog/components/AboutSection";
import { BrandConcept } from "@/features/public/catalog/components/BrandConcept";
import { Hero } from "@/features/public/catalog/components/Hero";
import { Lookbook } from "@/features/public/catalog/components/Lookbook";

/**
 * トップページ（CMS駆動。docs/frontend/routing.md）。
 * カテゴリごとの商品セクションはフェーズ4で、Lookbookとaboutの間に追加する。
 */
export default async function HomePage() {
  const content = await getContent();

  return (
    <>
      <Hero
        headline={content.hero.headline}
        tagline={content.hero.tagline}
        images={content.hero.images}
      />
      <BrandConcept body={content.concept.body} />
      <Lookbook images={content.lookbook.images} />
      <AboutSection blocks={content.about.blocks} />
    </>
  );
}
