// backend/app/Http/Resources/Admin/CustomerResource（docs/api/admin.md）。

export type AdminCustomer = {
  id: number;
  name: string;
  email: string;
  orders_count: number;
  joined_at: string | null;
};
