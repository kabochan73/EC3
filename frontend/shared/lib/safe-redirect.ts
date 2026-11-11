// ログイン/登録後の戻り先（?redirect=）はサイト内のパスだけに限る。
// "//evil.example"のようなプロトコル相対URLは外部サイトへのオープンリダイレクトに
// なるため拒否する（docs/frontend/testing.md「ログイン後の戻り先」）。

export function safeRedirect(path: string | null | undefined): string {
  if (path && path.startsWith("/") && !path.startsWith("//")) return path;
  return "/account";
}
