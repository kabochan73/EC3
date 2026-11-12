import type { Metadata } from "next";

import { getAdminCategories } from "@/features/admin/categories/api";
import { CategoryManager } from "@/features/admin/categories/components/CategoryManager";

export const metadata: Metadata = { title: "Categories" };

/** カテゴリ管理（Server Component）。role確認はapp/admin/layout.tsxのrequireAdmin()が行う。 */
export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="p-12">
      <h1 className="mb-8 text-lg tracking-widest uppercase">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  );
}
