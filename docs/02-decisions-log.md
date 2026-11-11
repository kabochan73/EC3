# 決定事項ログ

決めたことと、まだ決めていないことを記録していく。

## EC-Portfolio2から引き継ぐ決定（変更なし）

詳細は各ドキュメント参照。要点のみ再掲。

| 項目 | 決定内容 |
|---|---|
| バックエンド | Laravel 13 (API専用) + Sanctum |
| フロントエンド | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| DB | PostgreSQL 16 |
| 機能スコープ | [docs/03-features.md](./03-features.md) |
| DB設計 | [docs/backend/database-schema.md](./backend/database-schema.md) |
| API設計 | [docs/api/public.md](./api/public.md)・[docs/api/admin.md](./api/admin.md) |
| 認証（メール認証） | メール認証（アドレス確認）は実装しない |
| 決済 | Stripe PaymentIntent + Payment Element（カード決済のみ、test mode）。注文作成と決済を分離。[docs/backend/payments.md](./backend/payments.md) |
| 注文ステータス | state machine（`pending → paid → shipped → completed` + `cancelled`） |
| メール | Resend（本番）/ Mailpit（ローカル）。キュー経由送信。[docs/backend/mail.md](./backend/mail.md) |
| キュー | `QUEUE_CONNECTION=database`。Redisは入れない |
| CMS | トップのHero/Concept/Lookbook/Aboutを`site_contents`テーブルで編集可能に。[docs/backend/cms.md](./backend/cms.md)・[docs/frontend/cms.md](./frontend/cms.md) |
| レンダリング戦略 | 公開ページはISR + オンデマンド無効化（`revalidateTag`）。個人化データは常に動的。[docs/frontend/rendering-strategy.md](./frontend/rendering-strategy.md) |
| 画像ストレージ | Railway Storage Bucket（S3互換、private）。Next.jsの`/media`プロキシ経由。ローカルはRustFS。[docs/backend/storage-layout.md](./backend/storage-layout.md) |
| backendアプリサーバー | `serversideup/php:8.4-fpm-nginx`をローカル・本番で共用 |
| ローカル環境構築 | Docker Compose。`docker compose up -d`のみで全サービス起動。[docs/infra/local-dev.md](./infra/local-dev.md) |
| デザイン | Balenciaga公式サイト参照のミニマル・モノトーン。配色4色のみ、ダークモードなし |
| 商品構成 | ユニセックス、カテゴリ4種（Tops/Bottoms/Outerwear/Accessories）、サイズS/M/L |
| やらないことリスト | お気に入り・検索・レビュー・クーポン・ゲスト注文・複数配送先・多言語/多通貨・Redis等。[docs/01-overview.md](./01-overview.md) |
| Laravel設計指針 | Fat Controller・過剰抽象化を避ける。Action中心、Serviceは外部システムの薄いラッパーのみ。[docs/backend/folder-structure.md](./backend/folder-structure.md) |

## 今回新たに決めたこと

| 項目 | 決定内容 | 理由 |
|---|---|---|
| frontendのデプロイ先 | Railway → **Vercel**（backendは引き続きRailway） | ユーザーの希望。Next.js本来のビルドパイプライン・画像最適化・ISRをフルに使える |
| フロントエンドのディレクトリ構成 | type-base（`components/{domain}`）→ **feature-base**（`app/(shop)` `app/admin`で大きく分け、配下を`features/public/*` `features/admin/*`でドメイン別に分割） | 別プロジェクト（Blog3）で採用した構成に揃え、ドメインごとの凝集度を上げる |
| テスト方針 | 「後回し」→ **実装と同時に書く**（ロードマップの各ステップに同コミットでテストを含める） | 前回（EC-Portfolio2）でも同方針だったが、今回も明文化して徹底する |
| ドキュメント構成 | 前回の`docs/00〜12.md`（平坦な連番）→ `01-04`の連番4ファイル + `api/` `backend/` `frontend/` `infra/` サブディレクトリでトピック別詳細 | 別プロジェクト（Blog3）のドキュメント構成を踏襲。トピックごとの見通しが良くなる |
| コンテナ名プレフィックス | `ecp5-`（前回の`ecp4-`の系譜を継続。ディレクトリ名`EC3`をそのままプレフィックスにしない） | 前回までの系譜（`ecp-` → `ecp4-`）に揃え、世代が分かるようにするため |
| 売上ダッシュボード | **やらない**（前回は`/admin/sales`として追加していたが、今回はスコープに含めない） | ユーザーの判断。管理画面は運用ダッシュボードのみ |
| Heroセクション | 単一画像 → **複数画像の自動スライドショー**（headline/taglineは共通1つ、画像のみ複数枚。自動切り替えのみで手動ナビゲーションは無し）。[docs/backend/cms.md](./backend/cms.md)・[docs/frontend/cms.md](./frontend/cms.md) | ユーザーの希望。トップのビジュアル訴求力を上げる |
| 注文ステータスの表示 | API・DBの値（`pending`等）は英語のままだが、**ユーザーに見せる表示は日本語**にする（支払い待ち・支払い済み・発送済み・完了・キャンセル済み）。[docs/frontend/routing.md](./frontend/routing.md) | ユーザーの希望。前回（EC-Portfolio2）は`PENDING`等の英語表示のままだったが、分かりやすさを優先 |
| アーキテクチャ（BFF） | BFFパターン（Next.jsのRoute Handlerがトークンを中継）を**廃止**。**ブラウザが直接Laravel APIを叩く**構成に変更（例外のStripe Webhookは変更なし）。更新操作後のISRキャッシュ無効化（`revalidateTag`）だけは`app/api/revalidate/route.ts`という薄い専用Route Handlerに残す。[docs/frontend/rendering-strategy.md](./frontend/rendering-strategy.md) | ユーザーの希望 |
| 認証方式 | Sanctumパーソナルアクセストークン → **Sanctumのセッション認証（SPA認証、Cookie + CSRF）**。Cookie名は`ecp_session`＋`XSRF-TOKEN`。[docs/backend/auth.md](./backend/auth.md) | ユーザーの希望。BFF廃止とセットの変更 |
| ドメイン構成 | frontend（Vercel）とbackend（Railway）を**カスタムドメインの同一トップレベルドメインのサブドメイン**にする（例: `app.example.com` / `api.example.com`）。[docs/infra/vercel.md](./infra/vercel.md)・[docs/infra/railway.md](./infra/railway.md) | SanctumのstatefulドメインがクロスサブドメインでセッションCookieを共有するために必須。ドメイン名の購入費用（年間$10〜20程度）が追加で発生する |
| Vercelプレビューデプロイの制約 | プレビューデプロイ（`*.vercel.app`）は`example.com`配下のドメインではないため、Sanctumのstatefulドメイン判定・Cookie共有の対象外になる。**プレビューデプロイでは認証フロー（ログイン・マイページ・管理画面）は検証できない**。認証系の確認は本番ドメインかローカルでのみ行う | BFF方式ではNext.jsサーバーが中継するためどのフロントエンドオリジンからでも動いていたが、セッション認証化で生じる新たな制約 |

## 未決定（これから詰める項目）

- 実装ロードマップのフェーズ2以降の詳細ステップ（[docs/04-implementation-roadmap.md](./04-implementation-roadmap.md) に大枠のみ記載。各フェーズ着手時に詳細を詰める）
- 購入するカスタムドメイン名そのもの（未定。実装着手前に決める）

## フェーズ3着手時に決めたこと

| 項目 | 決定内容 |
|---|---|
| CMS画像（Hero/Lookbook/About） | 今回も画像なしで進める（前回同様、`bg-mist`のグレーボックス＋`NO IMAGE`表示）。管理画面からの画像アップロード機能自体は実装するが、実画像の用意はしない |
</content>
