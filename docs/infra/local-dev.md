# ローカル開発環境（すべてDocker）

## 方針

- **`docker compose up -d` だけで開発環境が全部立ち上がる。** frontend / backend / queue / scheduler / db / rustfs / mailpitをすべてコンテナで動かす。
- ホストにPHP / Composer / artisanを入れない。`php artisan serve`も`npm run dev`もホストでは打たない。
- **例外**: frontendの`node_modules`だけはホストにも入れる（`cd frontend && npm ci`。IDEのTSサーバー / ESLint用）。ホストのNodeは`.nvmrc`の22。
- artisan / composer / npm / pint / pestはすべて`docker compose exec`経由。
- ソースはバインドマウント（コード編集は即反映）。
- backend / queueはローカルも本番（Railway）も同じイメージ`serversideup/php:8.4-fpm-nginx`。frontendはローカルが`next dev`、本番はVercelの独自ビルド（[docs/infra/vercel.md](./vercel.md)）で別経路になる。

## サービス一覧

| サービス | イメージ / ビルド | 役割 | ホスト公開ポート |
|---|---|---|---|
| `frontend` | `frontend/Dockerfile.dev`（node:22-alpine） | `next dev`（ホットリロード） | `3000` |
| `backend` | `serversideup/php:8.4-fpm-nginx` | Laravel。nginx + php-fpm。artisanの実行先 | `8000`（→8080） |
| `queue` | `serversideup/php:8.4-fpm-nginx`（`command`上書き） | `php artisan queue:work`。メール送信ジョブを処理 | なし |
| `scheduler` | `serversideup/php:8.4-fpm-nginx`（`command`上書き） | `php artisan schedule:work`。未決済注文の期限切れキャンセル等 | なし |
| `db` | `postgres:16-alpine` | PostgreSQL 16 | `5432` |
| `rustfs` | `rustfs/rustfs` | S3互換ストレージ（ローカル専用） | `9000` / `9001`（コンソールは`/rustfs/console/`） |
| `createbuckets` | `amazon/aws-cli` | 起動時に一度だけバケットを作る使い捨て | なし |
| `mailpit` | `axllent/mailpit` | ローカルのSMTP受信箱。送信メールをここで確認 | `8025`（Web UI） |

コンテナ名は`ecp5-<サービス名>`、ボリュームは`ecp5-*`（前回系譜の`ecp4-*`から継続。ディレクトリ名`EC3`をそのままプレフィックスにせず、世代が分かる名前にする。[docs/02-decisions-log.md](../02-decisions-log.md)）。

### 通信経路

BFFは廃止したため、ブラウザは`localhost:3000`（ページ）と`localhost:8000`（API。Cookie + CSRF付き）の両方に直接アクセスする（[docs/02-decisions-log.md](../02-decisions-log.md)）。

```
ブラウザ
  ├─ localhost:3000  ── frontendコンテナ（next dev。ページ・ISR）
  │        │ サーバー側fetch（Cookie転送 + Origin付与）
  │        ▼
  └─ localhost:8000 ─┴─→ backendコンテナ（nginx → php-fpm → Laravel）
        ├─→ db:5432
        ├─→ rustfs:9000
        └─→ mailpit:1025（SMTP）
     queueコンテナ ──→ db:5432 / mailpit:1025（jobsをpullしてメール送信）

Stripe Webhook（ローカル）:
  stripe CLI（ホスト or コンテナ）  ──→  localhost:8000/api/stripe/webhook
```

- ブラウザは`localhost:3000`（ページ）と`localhost:8000`（API、Client Componentから直接）の両方にアクセスする。`localhost:3000`と`localhost:8000`は異なるオリジンだが同一サイト（レジストラブルドメインが同じ`localhost`）なので、カスタムドメインの用意なしでセッションCookieが共有できる（[docs/backend/auth.md](../backend/auth.md)）。
- frontendコンテナ（サーバー側）からは`API_URL=http://backend:8080`。ブラウザからは`NEXT_PUBLIC_API_URL=http://localhost:8000`。

## docker-compose.ymlの要点

- `backend` / `queue` / `scheduler`は`image: serversideup/php:8.4-fpm-nginx`を直接指定し、`./backend:/var/www/html`をバインドマウント（ローカル用の専用Dockerfileは作らない）
- `backend` / `queue` / `scheduler`には`environment:`でserversideup運用フラグ（`SSL_MODE` `PHP_OPCACHE_ENABLE` `AUTORUN_ENABLED`）のみ注入する。**`env_file`は使わない**。Laravelの`.env`はコンテナ内のファイルを直接読ませる（`env_file`で注入すると`APP_ENV` / `DB_*`が実際の環境変数になり、`phpunit.xml`の`<env>`がテストDBを上書きできなくなる）
- `frontend`だけ`env_file: ./frontend/.env.local`方式（`build: {context: ./frontend, dockerfile: Dockerfile.dev}`）

```yaml
queue:
  image: serversideup/php:8.4-fpm-nginx
  container_name: ecp5-queue
  command: ["php", "artisan", "queue:work", "--tries=3", "--sleep=3", "--max-time=3600"]
  volumes:
    - ./backend:/var/www/html
  environment:
    SSL_MODE: "off"
    AUTORUN_ENABLED: "false"
  depends_on:
    db: { condition: service_healthy }
    mailpit: { condition: service_started }
```

```yaml
mailpit:
  image: axllent/mailpit:latest
  container_name: ecp5-mailpit
  ports:
    - "8025:8025"
  environment:
    MP_MAX_MESSAGES: "500"
    MP_SMTP_AUTH_ACCEPT_ANY: "1"
    MP_SMTP_AUTH_ALLOW_INSECURE: "1"
```

```yaml
backend:
  image: serversideup/php:8.4-fpm-nginx
  container_name: ecp5-backend
  volumes:
    - ./backend:/var/www/html
  environment:
    SSL_MODE: "off"
    PHP_OPCACHE_ENABLE: "0"
    AUTORUN_ENABLED: "false"
  ports: ["8000:8080"]
  depends_on:
    db: { condition: service_healthy }
    rustfs: { condition: service_healthy }
    mailpit: { condition: service_started }
```

拡張: `pdo_pgsql` `redis` `opcache` `zip` `mbstring`は同梱。`intl` / `gd` / `bcmath`は非同梱（画像リサイズはしない、金額はinteger演算のみ）。

## frontend/Dockerfile.dev

```dockerfile
FROM node:22-alpine
WORKDIR /app
CMD ["sh", "-c", "npm install && npm run dev"]
```

Mac（Docker Desktop）向けにpolling: `WATCHPACK_POLLING=true` / `CHOKIDAR_USEPOLLING=true`。

## ボリューム設計

| 対象 | やり方 | 理由 |
|---|---|---|
| `./backend` → `/var/www/html` | バインドマウント | PHPのコード編集を即反映（backend / queue / schedulerで共有） |
| `/var/www/html/vendor` | バインドマウント（ホストにも置く） | IDE補完。重ければ名前付きボリュームに逃がす |
| `./frontend` → `/app` | バインドマウント | Nextのコード編集を即反映 |
| `/app/node_modules` | 名前付きボリューム | OS差回避。ホストのnode_modulesで上書きさせない |
| `/app/.next` | 名前付きボリューム | ビルドキャッシュを速く |
| db / rustfsのデータ | 名前付きボリューム | `down`してもデータを残す |

## 環境変数（ローカル）

### backend/.env（要点）

| 変数 | 値 |
|---|---|
| `APP_URL` | `http://localhost:8000` |
| `FRONTEND_URL` | `http://localhost:3000` |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `db` |
| `DB_PORT` | `5432` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `database` |
| `SESSION_DRIVER` | `database`（旧`array`から変更） |
| `SESSION_DOMAIN` | `localhost` |
| `SESSION_COOKIE` | `ecp_session` |
| `SESSION_SECURE_COOKIE` | `false` |
| `SESSION_SAME_SITE` | `lax` |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost:3000`（ポート必須） |
| `FILESYSTEM_DISK` | `s3` |
| `AWS_ENDPOINT` | `http://rustfs:9000` |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `true` |
| `MAIL_MAILER` | `smtp` |
| `MAIL_HOST` / `MAIL_PORT` | `mailpit` / `1025` |
| `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` | `sk_test_...` / `pk_test_...`（未入手なら空でも起動する） |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...`（`stripe listen`が表示する値） |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | ローカルの管理者（`AdminUserSeeder`） |

### frontend/.env.local（要点）

| 変数 | 値 |
|---|---|
| `API_URL` | `http://backend:8080`（サーバー側。Dockerネットワーク内部） |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000`（ブラウザから直接Laravelを呼ぶため） |
| `FRONTEND_ORIGIN` | `http://localhost:3000`（サーバー専用。Server ComponentがLaravelを呼ぶ際の`Origin`ヘッダ付与用） |
| `BUCKET_ENDPOINT` | `http://rustfs:9000` |
| `BUCKET_NAME` | ローカル用バケット名 |

Stripeのpublishable keyはAPIが返す。`NEXT_PUBLIC_API_URL`はブラウザが直接Laravelを叩くために必要（BFF廃止に伴う変更。[docs/02-decisions-log.md](../02-decisions-log.md)）。

## 初回セットアップ

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

docker compose up -d --build

docker compose exec backend composer install
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed

cd frontend && npm ci    # ホスト。IDE補完・型チェック用
```

## Stripe（ローカル）

決済フローを触るとき:

```bash
stripe login
stripe listen --forward-to localhost:8000/api/stripe/webhook
#   → 表示される whsec_... を backend/.env の STRIPE_WEBHOOK_SECRET に入れて docker compose restart backend queue

stripe trigger payment_intent.succeeded
```

テストカード: `4242 4242 4242 4242` / 任意の未来の有効期限 / 任意のCVC。3DSテスト: `4000 0025 0000 3155`。

## よく使うコマンド

```bash
docker compose up -d
docker compose down            # データは残る
docker compose down -v         # データごと破棄
docker compose logs -f backend

docker compose exec backend php artisan migrate
docker compose exec backend php artisan test           # Pest
docker compose exec backend ./vendor/bin/pint --dirty
docker compose exec backend php artisan tinker

docker compose exec frontend npm test               # Vitest
docker compose exec frontend npm run lint
docker compose exec frontend npx tsc --noEmit
```

## トラブルシュート

| 症状 | 対処 |
|---|---|
| frontendのファイル変更が反映されない | polling envを確認。`docker compose restart frontend` |
| `.tsx`全体が「`react`が見つからない」 | ホストに`node_modules`が無い。`cd frontend && npm ci` |
| `vendor`が無い | `docker compose exec backend composer install` |
| `could not translate host name "db"` | `.env`の`DB_HOST=db`（`127.0.0.1`はコンテナ自身） |
| backendが502 | `docker compose logs backend`。`APP_KEY`未設定 / `storage/`権限 |
| メールが届かない | Mailpit UI（:8025）を見る。`queue`コンテナが起動しているか |
| Webhookが来ない | `stripe listen`が起動しているか。`STRIPE_WEBHOOK_SECRET`が一致し、restart済みか |
| RustFSに接続できない | `AWS_ENDPOINT=http://rustfs:9000`と`AWS_USE_PATH_STYLE_ENDPOINT=true` |
| ログインしても認証状態が保持されない | `SANCTUM_STATEFUL_DOMAINS`にポート（`localhost:3000`）が入っているか確認。Client Componentのfetchに`credentials: 'include'`が付いているか確認 |
| 書き込みAPIが419（CSRFトークン不一致） | `GET /sanctum/csrf-cookie`を先に呼んでいるか、`X-XSRF-TOKEN`ヘッダに`XSRF-TOKEN`Cookieの値を付けているか確認 |
| 書き込みAPIが419になる（上を満たしていても） | `localhost`ドメインのCookieはポートを区別しないため、同じマシンで動かした**別のLaravel/Sanctumプロジェクト**（例: `EC-Portfolio2`。同じ`ecp_session` / `XSRF-TOKEN`という名前）の古いCookieが残っていて誤って使われている可能性がある。ブラウザの開発者ツールで`localhost`の`XSRF-TOKEN` / `ecp_session`Cookieを削除してから再試行する |

## 本番との差分

| | ローカル | 本番 |
|---|---|---|
| backend / queue / schedulerイメージ | serversideupを直接 + マウント | 同イメージにコード焼き込み（Railway） |
| opcache | 0 | 1 |
| frontend | `next dev`（コンテナ） | Vercelの独自ビルド（[docs/infra/vercel.md](./vercel.md)） |
| メール | Mailpit（SMTP） | Resend |
| Stripe webhook | `stripe listen`が転送 | Stripe → backend公開URL直 |
| PostgreSQL | 16 | Railway managed |
</content>
