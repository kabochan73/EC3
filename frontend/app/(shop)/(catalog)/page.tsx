import { getCategories, getProducts } from "@/features/public/catalog/api";
import { CategoryGrid } from "@/features/public/catalog/components/CategoryGrid";
import { getContent } from "@/features/public/content/api";
import { AboutSection } from "@/features/public/content/components/AboutSection";
import { BrandConcept } from "@/features/public/content/components/BrandConcept";
import { Hero } from "@/features/public/content/components/Hero";
import { Lookbook } from "@/features/public/content/components/Lookbook";

/** トップページ（CMS駆動。docs/frontend/routing.md）。 */
export default async function HomePage() {
  const [content, categories, products] = await Promise.all([
    getContent(),
    getCategories(),
    getProducts(),
  ]);

  return (
    <>
      <Hero
        headline={content.hero.headline}
        tagline={content.hero.tagline}
        images={content.hero.images}
      />
      <BrandConcept body={content.concept.body} />
      <Lookbook images={content.lookbook.images} />
      <CategoryGrid categories={categories} products={products} />
      <AboutSection blocks={content.about.blocks} />
    </>
  );
}
