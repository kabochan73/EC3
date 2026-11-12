// backend/app/Http/Resources/Admin/CategoryResource（docs/api/admin.md）。

export type AdminCategory = {
  id: number;
  name: string;
  slug: string;
  position: number;
  products_count: number;
};
