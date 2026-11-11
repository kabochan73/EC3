// backend/app/Http/Resources/Account/UserResource.phpと1:1
// （docs/frontend/component-types.md）。

export type UserRole = "customer" | "admin";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};
