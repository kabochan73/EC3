import type { Metadata } from "next";

export const metadata: Metadata = { title: "管理画面" };

// 仮の画面。運用ダッシュボードはフェーズ9で実装する（docs/04-implementation-roadmap.md）。
export default function AdminPage() {
  return <div className="p-12">管理画面（準備中）</div>;
}
