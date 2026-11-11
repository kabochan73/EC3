# デプロイ構成（Railway。backend系）

frontendのデプロイは [docs/infra/vercel.md](./vercel.md) 参照。このファイルはbackend / queue / scheduler / Postgres / bucketのみを扱う。

## サービス構成

| サービス | 中身 | 公開 | ポート |
|---|---|---|---|
| `backend` | Laravel。`serversideup/php:8.4-fpm-nginx`を薄いDockerfileでラップ | ✅ 公開ドメイン（理由は下記） | 8080 |
| `queue` | 同じbackendイメージを`php artisan queue:work`で起動 | 内部のみ | - |
| `scheduler` | 同じbackendイメージを`php artisan schedule:work`で起動（期限切れ注文のキャンセル等） | 内部のみ | - |
| `Postgres` | RailwayのPostgreSQL | 内部のみ | 5432 |
| bucket | Railway Storage Bucket（S3互換、private）。商品・CMS画像 | 内部（S3 API） | - |

4サービス（backend/queue/scheduler + bucket）とPostgresをGitHubのmainに接続し、push で自動デプロイ。Root Directoryはすべて`/backend`。Watch Paths（`/backend/**`）で、backendディレクトリが変わったときだけ再デプロイする（`docs/`だけの変更ではデプロイしない）。

### backendを公開する理由

1. **Stripe Webhook**: Stripeから`POST /api/stripe/webhook`を直接受ける必要がある（署名検証で保護。署名不正は400。`throttle:60,1`）
2. **frontendのビルド**: Vercelでのビルド時、ISRプリレンダーがLaravelを呼ぶ（[docs/infra/vercel.md](./vercel.md)）。Vercelのビルド環境からbackendの公開URLを叩く
3. **ブラウザが直接APIを叩く**（BFFは廃止。[docs/02-decisions-log.md](../02-decisions-log.md)）。Sanctumのセッション認証（SPA認証）＋CSRFで保護する

BFF廃止によりブラウザが直接Laravelを呼ぶため、**CORS設定が必須**になる（旧設計の「CORSの設定を持たない」は撤回）。`config/cors.php`を新規作成し、`supports_credentials: true`、`allowed_origins`に`FRONTEND_URL`（Vercelの公開ドメイン）を指定する。詳細な設定・CSRFフローは [docs/backend/auth.md](../backend/auth.md) 参照。

frontend（Vercel）とbackend（Railway）は**カスタムドメインの同一トップレベルドメインのサブドメイン**にする（例: backend = `api.example.com`）。これはSanctumのstatefulドメインがクロスサブドメインでセッションCookieを共有するために必須（[docs/backend/auth.md](../backend/auth.md)）。Railwayのbackendサービスの Settings → Domains でカスタムドメインを追加し、DNSにCNAMEを設定する。

`serversideup/php`はnginx + php-fpmをs6-overlayで1コンテナにまとめた本番向けイメージ。opcache / php-fpmチューニング済み・非root・healthcheck付き。同梱拡張は`pdo_pgsql` `redis` `opcache` `zip` `mbstring` `curl` `sodium`など。`intl` / `gd` / `bcmath`は非同梱（画像リサイズはしない、金額はinteger演算のみ）。

## queue / schedulerサービス

- backendと**同じイメージ**（同じDockerfile・Root Directory）で、Start Commandだけ上書きする。Restart PolicyはALWAYS
  - queue: `php artisan queue:work --tries=3 --sleep=3 --max-time=3600`
  - scheduler: `php artisan schedule:work`
- `AUTORUN_ENABLED=false`（migrate / config:cacheはbackendが起動時に1回やる）。変数はbackendと同じセット
- queueのジョブ: メール3種（注文確認・発送通知・パスワードリセット。[docs/backend/mail.md](../backend/mail.md)）。失敗は`failed_jobs`
- schedulerが実行するもの: `orders:expire-pending`（5分ごと。30分を過ぎた未決済注文をキャンセルして在庫を戻す）/ `sanctum:prune-expired`（毎日。ブラウザ経路ではパーソナルアクセストークンを使わないため、将来の非ブラウザAPIクライアント用の安全網として残すのみ）

## リポジトリ構成（backend側）

```
EC3/
├── backend/
│   ├── Dockerfile            # 本番用（FROM serversideup/php の薄いラッパ。backend / queue / scheduler 共用）
│   └── railway.json
└── docs/
```

`frontend/Dockerfile`（本番用）・`frontend/railway.json`は**作らない**（Vercelは自前のビルドパイプラインを使うため不要。[docs/infra/vercel.md](./vercel.md)）。

## 環境変数（backend / queue / scheduler共通）

値はすべてRailwayのVariablesにだけ書く（リポジトリには入れない）。

| 変数 | 値 | 用途 |
|---|---|---|
| `APP_KEY` | `base64:...`（`php artisan key:generate --show`） | |
| `APP_ENV` / `APP_DEBUG` | `production` / `false` | |
| `APP_URL` | backendの公開ドメイン（`https://api.example.com`） | |
| `FRONTEND_URL` | frontendの公開ドメイン（`https://app.example.com`） | メール内リンク（注文詳細・パスワードリセット）のbase、CORSの`allowed_origins` |
| `DB_CONNECTION` | `pgsql` | |
| `DB_URL` | `${{Postgres.DATABASE_URL}}`（参照変数） | |
| `LOG_CHANNEL` | `stderr` | Railwayログ |
| `SESSION_DRIVER` | `database` | 旧`array`から変更（セッション認証で実際に使う） |
| `SESSION_DOMAIN` | `.example.com`（先頭ドット） | サブドメイン間でセッションCookieを共有するため |
| `SESSION_COOKIE` | `ecp_session` | |
| `SESSION_SECURE_COOKIE` | `true` | |
| `SESSION_SAME_SITE` | `lax` | |
| `SESSION_LIFETIME` | `43200`（30日） | |
| `SANCTUM_STATEFUL_DOMAINS` | `app.example.com` | [docs/backend/auth.md](../backend/auth.md) |
| `CACHE_STORE` / `QUEUE_CONNECTION` | `database` / `database` | Redisなし |
| `SSL_MODE` | `off` | serversideup。TLSはRailwayエッジ終端 |
| `PHP_OPCACHE_ENABLE` | `1` | 本番はopcache有効 |
| `AUTORUN_ENABLED` | `true`（backend）/ `false`（queue・scheduler） | |
| `AUTORUN_LARAVEL_MIGRATION` | `true`（backendのみ） | 起動時`migrate --force` |
| `AUTORUN_LARAVEL_MIGRATION_ISOLATION` | `false` | `true` + `CACHE_STORE=database`は初回起動で詰む（`cache_locks`がmigrate前に要る）。単一インスタンスなので不要 |
| `AUTORUN_LARAVEL_CONFIG_CACHE` / `ROUTE_CACHE` / `EVENT_CACHE` | `true`（backendのみ） | |
| `AUTORUN_LARAVEL_STORAGE_LINK` | `false` | S3配信なので不要 |
| `FILESYSTEM_DISK` | `s3` | 画像をRailwayバケットへ |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_DEFAULT_REGION` / `AWS_BUCKET` / `AWS_ENDPOINT` | `railway bucket credentials`の値 | |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `false` | |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | `sk_test_...` / `pk_test_...`（testのまま） | publishableは`/api/checkout/payment-intent`のレスポンスに載せる |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`（testモードのWebhookエンドポイントのもの） | Webhook署名検証 |
| `MAIL_MAILER` / `RESEND_API_KEY` | `resend` / `re_...` | `composer require resend/resend-php`が必要 |
| `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` | Resend共有ドメインのアドレス / ブランド名 | 独自ドメインは取らない |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 管理者 | `AdminUserSeeder`が読む |

## デプロイ時のマイグレーションと初期データ

serversideupのLaravel Automations（`AUTORUN_*`）に任せる。backendサービス起動時に:
```
php artisan migrate --force
php artisan config:cache && route:cache && event:cache
```
- `db:seed`はAUTORUNに無い。初期データは手動（`railway ssh --service backend "php artisan db:seed --force"`）
- 初回のトップページは、seedの**後**にfrontend（Vercel）をデプロイする（ビルド時のプリレンダーが空になるのを避ける）

## Stripe Webhook登録

```
stripe webhook_endpoints create --url https://api.example.com/api/stripe/webhook \
  -d "enabled_events[]=payment_intent.succeeded" -d "enabled_events[]=payment_intent.payment_failed" \
  -d "enabled_events[]=payment_intent.canceled" -d "enabled_events[]=charge.refunded"
```
返ってきた`secret`（`whsec_...`）をbackend / queue / schedulerの`STRIPE_WEBHOOK_SECRET`に設定。

## Resend（メール本番）

- 独自ドメインは取らない（費用がかかるため）。送信元はResendの共有ドメインで、**アカウント所有者のアドレスにしか届かない**
- `composer require resend/resend-php`が必要

## Dockerfile

- `backend/Dockerfile`: `serversideup/php:8.4-fpm-nginx` + `composer install --no-dev --optimize-autoloader`。CMDは上書きしない（nginx(8080)とphp-fpmはs6-overlayが起動）。queue / schedulerはRailwayのStart Commandで上書き
- `.dockerignore`に`Dockerfile`を入れない（Railwayがビルダを検出できずRailpackに落ちる）。`railway.json`で`builder: DOCKERFILE`も指定
- `railway up`はgitルートを基準にアーカイブする → サブディレクトリからは`railway up . --path-as-root --service <name>`
</content>
