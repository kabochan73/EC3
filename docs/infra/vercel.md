# デプロイ構成（Vercel。frontend）

今回新たに決めた変更点（[docs/02-decisions-log.md](../02-decisions-log.md)）。前回（EC-Portfolio2）はfrontendもRailwayにDockerデプロイしていたが、今回はVercelに変更する。backend / queue / scheduler / DB / bucketは引き続きRailway（[docs/infra/railway.md](./railway.md)）。

## Vercel化で変わること

| 項目 | 前回（Railway） | 今回（Vercel） |
|---|---|---|
| ビルド方式 | `frontend/Dockerfile`（3段multi-stage: deps→build→run） | Vercelの自前ビルドパイプライン（Next.js自動検出）。`frontend/Dockerfile`は**作らない** |
| `next.config.ts` | `output: "standalone"` | **standalone出力は付けない**（Vercelは自前のサーバーレス/Node実行環境を使うため不要かつ無意味） |
| ビルド時環境変数 | `ARG API_URL`をDockerfileに渡す | Vercel Project SettingsのEnvironment Variables（Build/Production両方に設定） |
| 起動コマンド | `node server.js`（standalone出力） | Vercelが自動的にハンドリング |
| ローカル開発 | `Dockerfile.dev`で`next dev` | **変更なし**。`Dockerfile.dev`で`next dev`のまま（[docs/infra/local-dev.md](./local-dev.md)） |

ローカルのDocker化とVercelデプロイ方式は無関係（ローカルは`next dev`、本番はVercelの独自ビルド）なので、`docker-compose.yml`自体の設計に変更はない。

## Vercel側の設定

- Root Directory = `frontend`
- Framework Preset = Next.js（自動検出）
- Node.js Version = 22.x（`.nvmrc` / `package.json engines`と揃える）
- `vercel.json`は基本不要（Root Directory設定とNext.js自動検出で十分）
- **カスタムドメインの設定**: Project Settings → Domains で`app.example.com`を追加し、DNSにCNAMEを設定する。SanctumのstatefulドメインがクロスサブドメインでセッションCookieを共有するために必須（[docs/backend/auth.md](../backend/auth.md)参照）。backend側のカスタムドメイン（`api.example.com`）は [docs/infra/railway.md](./railway.md) 参照

## 環境変数（Vercel Project Settings）

値はすべてVercelのEnvironment Variablesにだけ書く（リポジトリには入れない）。BFF廃止によりブラウザが直接Laravelを叩くため、**`NEXT_PUBLIC_API_URL`が新たに必要**（Stripeのpublishable keyは引き続き`/api/checkout/payment-intent`のレスポンスで受け取る。`NEXT_PUBLIC_*`を一切使わない方針は撤回）。

| 変数 | 値（本番） | 用途 |
|---|---|---|
| `API_URL` | backendの公開URL（`https://api.example.com`） | サーバー側（Server Component）からLaravelを呼ぶ。ビルド時のISRプリレンダーでも使う |
| `NEXT_PUBLIC_API_URL` | backendの公開URL（`https://api.example.com`） | **新規**。ブラウザ（Client Component）が直接Laravelを呼ぶため |
| `FRONTEND_ORIGIN` | frontendの公開URL（`https://app.example.com`） | **新規・サーバー専用**。Server ComponentがLaravelを呼ぶ際、Node.jsのfetchは`Origin`ヘッダを自動付与しないため、明示的に設定する（[docs/frontend/rendering-strategy.md](../frontend/rendering-strategy.md)） |
| `BUCKET_ENDPOINT` / `BUCKET_ACCESS_KEY_ID` / `BUCKET_SECRET_ACCESS_KEY` / `BUCKET_NAME` / `BUCKET_REGION` | `railway bucket credentials`の値 | `/media`プロキシのGetObject |
| `BUCKET_FORCE_PATH_STYLE` | `false`（Railwayのバケットはバーチャルホスト形式） | |

## backendのビルド時アクセスについて

Next.jsのISRプリレンダー（`next build`時にトップページなどを作る）はVercelのビルド環境からLaravelを呼ぶ必要がある。Railwayの内部DNS（`*.railway.internal`）はVercelのビルド環境から解決できないため、`API_URL`はbackendの**公開URL**にする（実行時の呼び出しも同じURLでよい）。これは前回Railway同士でデプロイしていたときと同じ制約（RailwayのビルドステージからもInternal DNSが引けなかった）が、Vercel化後も変わらず残る。

## Laravel側で確認すべき点

- **CORS設定が必須**（BFF廃止によりブラウザが直接Laravelを叩くため。旧「CORS設定は不要」の記述は撤回）。`config/cors.php`で`supports_credentials: true`、`allowed_origins`に`app.example.com`を指定（[docs/backend/auth.md](../backend/auth.md)）
- `FRONTEND_URL`（メールリンクのbase、CORSの`allowed_origins`）をVercelの本番ドメインに更新する必要がある（[docs/infra/railway.md](./railway.md)の環境変数）
- `SANCTUM_STATEFUL_DOMAINS=app.example.com`を設定する（[docs/backend/auth.md](../backend/auth.md)）

## Vercelプレビューデプロイでの制約

プレビューデプロイ（`*.vercel.app`のURL）は`example.com`配下のドメインではないため、`SANCTUM_STATEFUL_DOMAINS`に含まれず、Sanctumのstateful判定・セッションCookie共有の対象外になる。**プレビューデプロイでは認証フロー（ログイン・マイページ・管理画面）は検証できない**。認証系の確認は本番ドメイン（`app.example.com`）かローカルで行う（[docs/02-decisions-log.md](../02-decisions-log.md)）。

## next.config.ts

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

画像配信は`/media/[...key]/route.ts`でS3 GetObjectをプロキシする方式を継続する（Next.js標準の`<Image>`最適化・`images.domains`設定は使わない）。
</content>
