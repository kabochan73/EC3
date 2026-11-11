import { requireAdmin } from "@/shared/lib/auth";

/**
 * 管理画面。Cookie有無はproxy.tsで事前チェック済み。ここではrole確認のみ行う
 * （docs/backend/auth.md）。サイドバー等の独自レイアウトは管理画面の中身を作るときに追加する。
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return <>{children}</>;
}
