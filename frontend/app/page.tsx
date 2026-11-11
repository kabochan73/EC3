import { HealthCheckClient } from "./HealthCheckClient";

// 環境構築フェーズの完了マーカー（ロードマップ フェーズ1 ステップ8）。
// Next→Laravel（サーバー側）とブラウザ→Laravel（直接）の両経路が通ることを確認する。
// 本来のトップページはフェーズ3でCMS駆動に置き換える。
async function apiServerFetch(path: string) {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export default async function Home() {
  const serverHealth = await apiServerFetch("/api/health");

  return (
    <div className="flex flex-col gap-4 p-16 font-mono text-sm">
      <h1 className="text-lg font-bold">API疎通確認</h1>
      <section>
        <h2 className="font-semibold">Next → Laravel（サーバー側）</h2>
        <pre>{JSON.stringify(serverHealth, null, 2)}</pre>
      </section>
      <HealthCheckClient />
    </div>
  );
}
