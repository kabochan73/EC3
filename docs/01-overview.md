# EC3 — プロジェクト概要

架空のミニマル・アパレルブランドの EC サイト。ポートフォリオ用に作り直す取り組みの **3回目**。

- 1回目 = `../../EC-Portfolio2`（Stripe決済・Resendメール・軽量CMS・管理画面・ISR・テスト・CI/CDまで実装済み。Railwayで本番運用中。**本プロジェクトの参照実装**）
- 2回目（今回・`EC3`） = 1回目と同じ機能スコープ・ほぼ同じ技術スタックを、設計・実装の質を上げてもう一度書き直す

## このイテレーションのゴール

**機能を増やすことが目的ではない。** 前回で完成している機能スコープ（商品閲覧・認証・カート・注文・Stripe決済・Resendメール・軽量CMS・管理画面）をそのまま踏襲し、以下3点の変更を通じて設計・実装の質を上げる。

| 変更点 | 概要 | 詳細 |
|---|---|---|
| フロントエンドのデプロイ先 | Railway → **Vercel**（backendは引き続きRailway） | [docs/infra/vercel.md](./infra/vercel.md) |
| フロントエンドのディレクトリ構成 | type-base（`components/{domain}`）→ **feature-base**（`features/public/*` `features/admin/*`） | [docs/frontend/folder-structure.md](./frontend/folder-structure.md) |
| テスト方針 | 後回し → **実装と同時に書く** | [docs/backend/testing.md](./backend/testing.md)・[docs/frontend/testing.md](./frontend/testing.md) |
| 認証アーキテクチャ | BFFパターン＋トークン認証 → **BFF廃止・ブラウザが直接Laravelを叩く + Sanctumセッション認証（SPA認証）** | [docs/backend/auth.md](./backend/auth.md)・[docs/frontend/rendering-strategy.md](./frontend/rendering-strategy.md) |
| ドメイン構成 | frontend/backend別ドメイン → **カスタムドメインの同一トップレベルドメインのサブドメイン** | [docs/infra/vercel.md](./infra/vercel.md)・[docs/infra/railway.md](./infra/railway.md) |

機能スコープ・DB設計・決済/メール/CMSの設計は前回からそのまま引き継ぐ。引き継ぐ決定・新たに決めた決定の全体は [docs/02-decisions-log.md](./02-decisions-log.md) にまとめる。

## やらないこと（前回から継続）

- お気に入り、検索、レビュー、クーポン、ゲスト注文
- 複数配送先・分割配送・返品RMAフロー
- 多言語・多通貨（JPY税込のみ）
- 運用・法務・コンプラ・監視の作り込み、負荷試験、SLO
- リアルタイム在庫、WebSocket、通知センター
- 決済手段の追加（コンビニ・PayPay等）。Stripeカード決済のみ
- Redis（カタログキャッシュはNext.jsのISRに寄せる。レートリミッタ・キューは`database`ドライバで足りる）
- メール認証（アドレス確認）。登録だけで購入まで一通り体験できるようにする

## 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 |
| 状態管理（カート） | Zustand + localStorage永続化 |
| フォーム/検証 | react-hook-form + @hookform/resolvers + zod |
| クライアントデータ取得 | TanStack Query（ログイン状態表示・カート再検証・決済ステータス確認など一部のみ。大半はServer Componentで取得） |
| 決済UI | @stripe/stripe-js + @stripe/react-stripe-js（Payment Element） |
| 画像プロキシ | @aws-sdk/client-s3（Next.jsの`/media/[...key]`がバケットからGetObject） |
| バックエンド | Laravel 13 (API専用) + Sanctum（セッション認証・SPA認証） |
| 決済 | stripe/stripe-php（PaymentIntent + Webhook） |
| メール | Laravel Mail（Markdown）。本番Resend / ローカルMailpit（SMTP） |
| キュー | `QUEUE_CONNECTION=database`（jobsテーブル）+ `queue:work` worker。Redisなし |
| DB | PostgreSQL 16 |
| 画像ストレージ | Railway Storage Bucket（private・S3互換）。Next.jsの`/media`プロキシ経由で配信。ローカルはRustFS |
| backendアプリサーバー | nginx + php-fpm（`serversideup/php:8.4-fpm-nginx`をローカル・本番で共用） |
| テスト | Pest 4（backend）/ Vitest + Testing Library（frontend）。実装と同時に書く。GitHub ActionsのCIで両方実行 |
| ローカル実行形態 | すべてDocker。`docker compose up -d`でfrontend / backend / queue / scheduler / db / rustfs / mailpitが起動 |
| 本番実行形態 | backend/queue/scheduler/DB/bucket = Railway（Docker）、frontend = **Vercel** |

## アーキテクチャ方針

- **BFFパターンは採用しない**: ブラウザが直接Laravel APIを叩く。公開データ（商品・カテゴリ・CMS）はNext.jsのServer Component（ISR）が直接Laravelを呼び、個人データの読み取りもServer ComponentがCookieを転送して直接呼ぶ。書き込み（ログイン・注文・住所・管理画面の更新等）はClient Componentが直接Laravelを呼ぶ。詳細は [docs/frontend/rendering-strategy.md](./frontend/rendering-strategy.md)。
- Laravelにも公開ドメインを付ける。理由は3つ: ①Stripe Webhook（`POST /api/stripe/webhook`）をStripeから直接受けるため（署名検証で保護）、②frontendの`next build`がトップページなどを作るときにLaravelを呼ぶため（Vercelのビルド環境からbackendのRailway公開URLを叩く）、③**ブラウザが直接Laravel APIを叩くため**（[docs/infra/vercel.md](./infra/vercel.md)）。
- 認証はSanctumの**セッション認証（SPA認証）**。ブラウザがLaravel発行のセッションCookie（`ecp_session`）とCSRFトークン（`XSRF-TOKEN`）を保持し、直接Laravelにリクエストする。frontend（Vercel）とbackend（Railway）は**カスタムドメインの同一トップレベルドメインのサブドメイン**にし、Cookieをサブドメイン間で共有する（[docs/backend/auth.md](./backend/auth.md)）。
- 更新操作後のISRキャッシュ無効化（`revalidateTag`）だけは、Next.js側の薄い専用Route Handler（`app/api/revalidate/route.ts`）が担う（BFFのように認証を中継するものではない）。
- カタログ読み取りはISR（タグ付きキャッシュ）＋管理更新時のオンデマンド無効化。個人化データ（注文・住所・カート）は常に動的。
- **Vercelプレビューデプロイ（`*.vercel.app`）では認証フローを検証できない**。プレビュー用URLはカスタムドメイン配下では無いため、Sanctumのstatefulドメイン判定・Cookie共有の対象外になる。ログイン・マイページ・管理画面の確認は本番ドメインかローカルで行う（[docs/02-decisions-log.md](./02-decisions-log.md)）。

## 構成図（ざっくり、本番）

```
[ブラウザ]
   │
   ├─ Next.js (frontend, app.example.com / Vercel) ── 公開ページ（全ページISR） / 管理画面UI
   │        │           ▲
   │        │fetch(API) │ オンデマンド再検証（/api/revalidate → revalidateTag）
   │        ▼           │
   ├─ 直接fetch（Cookie + XSRF-TOKEN付き）────────────────┐
   │                                                     ▼
   │                            [Nginx] ──→ [PHP-FPM / Laravel (backend, api.example.com / Railway)]
   │                                               │
   │                                               ├─ PostgreSQL（Railway managed。sessionsテーブルも使用）
   │                                               ├─ bucket（Railway、S3互換）（商品・CMS画像）
   │                                               └─ Stripe Webhook ←── Stripe（決済イベント）
   │
   queue / scheduler（Railwayの別サービス。backendと同イメージ）
```

## デザイン方針（前回から不変）

Balenciaga公式サイトを参照した硬質なミニマル・モノトーン。

- 配色は `#000 / #fff / #f4f4f4 / #767676` の4色のみ、区切りは原則ボーダー（影は使わない）
- 細いサンセリフ、全大文字、字間広め（tracking）
- 極端な余白、フルスクリーンのヒーロー画像
- アニメーションはopacityと画像差し替えのみ
- ダークモードは持たない

デザインの具体的な参考イメージは未決定。詳細は [docs/frontend/design-reference.md](./frontend/design-reference.md) 参照。

## 商品構成（前回から不変）

ユニセックス。性別（MEN/WOMEN）の区別なし。カテゴリはTops / Bottoms / Outerwear / Accessoriesの4フラット、各3〜6点。サイズはS / M / L（アクセサリーはFREE単一）。

## リポジトリ構成

```
EC3/
├── docs/            # このフォルダ。設計・決定事項のドキュメント
├── backend/         # Laravel
├── frontend/        # Next.js（feature-base構成。docs/frontend/folder-structure.md参照）
└── docker-compose.yml
```

## 機能スコープ

前回（EC-Portfolio2）から変更なし。詳細は [docs/03-features.md](./03-features.md) 参照。

- 公開ページ: トップ（CMS駆動）、商品詳細、カート、チェックアウト（配送先→決済→完了）、ログイン/登録、パスワードリセット、マイページ（注文履歴・住所録・プロフィール）
- 管理画面: 運用ダッシュボード、商品/カテゴリ/画像/バリアント管理、注文管理（フルフィルメント）、会員閲覧、CMS編集
- デプロイも今回のスコープに含める（backend: Railway、frontend: Vercel）

## ドキュメント一覧

| ファイル | 内容 |
|---|---|
| [02-decisions-log.md](./02-decisions-log.md) | 決定事項（前回からの引き継ぎ／今回新たに決めたこと／未決定） |
| [03-features.md](./03-features.md) | 機能スコープ確定版 |
| [04-implementation-roadmap.md](./04-implementation-roadmap.md) | 実装ロードマップ・コミット規約 |
| [api/public.md](./api/public.md) | 公開・ユーザー向けAPI |
| [api/admin.md](./api/admin.md) | 管理API |
| [backend/database-schema.md](./backend/database-schema.md) | テーブル定義とER |
| [backend/folder-structure.md](./backend/folder-structure.md) | Laravel側のレイヤー構成・ディレクトリ構成 |
| [backend/auth.md](./backend/auth.md) | 認証・パスワードリセット設計 |
| [backend/payments.md](./backend/payments.md) | Stripe決済（PaymentIntent・Webhook・冪等性） |
| [backend/mail.md](./backend/mail.md) | トランザクションメール |
| [backend/cms.md](./backend/cms.md) | 軽量CMS（backend側） |
| [backend/storage-layout.md](./backend/storage-layout.md) | 画像ストレージ設計 |
| [backend/testing.md](./backend/testing.md) | backendのテスト戦略 |
| [frontend/folder-structure.md](./frontend/folder-structure.md) | feature-baseディレクトリ構成 |
| [frontend/routing.md](./frontend/routing.md) | サイトマップ・各ページの構成 |
| [frontend/rendering-strategy.md](./frontend/rendering-strategy.md) | データ取得とISR |
| [frontend/component-types.md](./frontend/component-types.md) | 型・バリデーションの配置方針 |
| [frontend/payments.md](./frontend/payments.md) | Stripe決済（frontend側） |
| [frontend/cms.md](./frontend/cms.md) | 軽量CMS（frontend側） |
| [frontend/design-reference.md](./frontend/design-reference.md) | デザイン参考 |
| [frontend/testing.md](./frontend/testing.md) | frontendのテスト戦略 |
| [infra/local-dev.md](./infra/local-dev.md) | ローカル開発環境（すべてDocker） |
| [infra/railway.md](./infra/railway.md) | backendのRailwayデプロイ構成 |
| [infra/vercel.md](./infra/vercel.md) | frontendのVercelデプロイ構成 |
</content>
