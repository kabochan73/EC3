import type { Metadata } from "next";

import { getAdminContent } from "@/features/admin/content/api";
import { AboutSection } from "@/features/admin/content/components/AboutSection";
import { ConceptSection } from "@/features/admin/content/components/ConceptSection";
import { HeroSection } from "@/features/admin/content/components/HeroSection";
import { LookbookSection } from "@/features/admin/content/components/LookbookSection";

export const metadata: Metadata = { title: "CMS編集" };

/** トップページのCMS編集（docs/frontend/cms.md）。role確認はapp/admin/layout.tsxのrequireAdmin()が行う。 */
export default async function AdminContentPage() {
  const content = await getAdminContent();

  return (
    <div className="p-12">
      <h1 className="text-lg tracking-widest uppercase">Content</h1>

      <div className="mt-8">
        <HeroSection initial={content.hero} />
        <ConceptSection initial={content.concept} />
        <LookbookSection initial={content.lookbook} />
        <AboutSection initial={content.about} />
      </div>
    </div>
  );
}
