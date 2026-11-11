# API設計（公開・ユーザー向け）

管理APIは [docs/api/admin.md](./admin.md) 参照。

- ベースパス`/api`
- レスポンスはJSON。一覧は`{ "data": [...] }`、単体は`{ "data": {...} }`
- 認証はSanctumのセッション認証（SPA認証）。Cookie（`ecp_session`）＋CSRFトークン（`X-XSRF-TOKEN`ヘッダ）。[docs/backend/auth.md](../backend/auth.md)
- **ブラウザが直接叩く**（BFFは廃止。[docs/02-decisions-log.md](../02-decisions-log.md)）。書き込み系リクエストの前に`GET /sanctum/csrf-cookie`を呼ぶ必要がある（詳細は下記「ブラウザからの呼び出し」節）
- バリデーションエラーは422 `{ "message": "...", "errors": { "field": ["..."] } }`
- 金額はすべて整数（JPY税込）

## 公開エンドポイント

### GET /api/health
`{ "status": "ok", "app": "...", "database": "ok", "time": "..." }`

### GET /api/categories
```json
{ "data": [ { "id": 1, "name": "Tops", "slug": "tops" }, ... ] }
```

### GET /api/products
クエリ: `category`（slug） / `new`（`true`で作成30日以内・新着順） / `limit`

`is_published = true`のみ。カード表示に必要な項目のみ。
```json
{ "data": [
  { "id": 10, "name": "Boxy Cotton T-Shirt", "slug": "boxy-cotton-t-shirt", "price": 12000,
    "category": { "name": "Tops", "slug": "tops" },
    "stock_status": "in_stock",
    "is_new": true,
    "images": [ { "url": "/media/products/10/01J8A.jpg", "alt": "...", "position": 0 }, ... ] }
] }
```

### GET /api/products/{slug}
詳細。未公開・存在しないslugは404。
```json
{ "data": {
  "id": 10, "name": "...", "slug": "...", "price": 12000,
  "category": { "name": "Tops", "slug": "tops" },
  "description": "...", "material": "...", "care": "...", "origin": "中国", "product_code": "EC-TP0012",
  "size_chart": { "unit": "cm", "columns": [...], "rows": { "S": [...], "M": [...], "L": [...] } },
  "is_new": true,
  "images": [ { "url": "...", "alt": "...", "position": 0 }, ... ],
  "colors": ["Black", "Ecru"],
  "variants": [
    { "id": 55, "size": "S", "color": null, "stock_status": "in_stock", "stock_label": "在庫あり", "selectable": true },
    ...
  ],
  "related": [ /* 同カテゴリの他公開商品をposition順に全件、一覧と同じ要約形式 */ ]
} }
```
`stock_status`閾値: `0`→`sold_out` / `1..5`→`low_stock` / `>=6`→`in_stock`（`config('shop.low_stock_threshold')` = 5）。

### GET /api/content（CMS）
トップページの編集可能コンテンツ。詳細スキーマは [docs/backend/cms.md](../backend/cms.md)。
```json
{ "data": {
  "hero": { "headline": "...", "tagline": "...", "images": [ { "url": "/media/content/hero/01J..jpg", "alt": "..." } ] },
  "concept": { "body": "..." },
  "lookbook": { "images": [ { "url": "/media/content/lookbook/01J..jpg", "alt": "..." }, ... ] },
  "about": { "blocks": [ { "label": "Since 2026", "heading": "...", "body": "...", "image_url": "..." }, ... ] }
} }
```
未設定キーはデフォルト値を埋めて返す（フロントが必ず全キー受け取れる）。

### GET /api/cart/validate（カート再検証）
クエリ`?variant_ids[]=55&variant_ids[]=56`（1〜100件）。各variantの現在価格・在庫ステータス・公開状態・商品名/画像を、渡した順に返す。`/cart` `/checkout`表示時にClient Componentが直接呼ぶ。
```json
{ "data": [
  { "variant_id": 55, "available": true, "price": 12000, "stock_status": "low_stock",
    "max_quantity": 3, "product_name": "...", "product_slug": "...", "size": "M", "color": null,
    "image_url": "/media/..." }
] }
```
存在しない/非公開variantは`available: false`。

`max_quantity` = `min(stock, cart_max_quantity_per_line)`。「公開APIは生の在庫数を返さない」方針の唯一の例外で、在庫が上限（10）未満のときは正確な在庫数が分かる。数量セレクタの上限を実在庫に合わせ、「選べたのに注文時に在庫不足」を防ぐ買い物体験を優先した。

## 認証エンドポイント

### POST /api/register（`throttle:register` = IPで5回/分）
body: `name`, `email`, `password`, `password_confirmation`
→ 201 `{ "data": { user } }`（`token`フィールドは無い。成功時にLaravelがセッションCookieを`Set-Cookie`で発行する）

### POST /api/login（`throttle:login` = メール+IPで5回/分）
body: `email`, `password` → 200 `{ "data": { user } }` / 失敗422

`Auth::attempt()`で検証し、成功なら`session()->regenerate()`（セッション固定攻撃対策）。失敗時は「メールが無い」「パスワード違い」を区別しない（同じメッセージ）。**応答時間でも区別させない**ため、ユーザーが存在しない場合もダミーのハッシュに対して`Hash::check`を実行する（[docs/backend/auth.md](../backend/auth.md)）。

### POST /api/logout（要認証）
`session()->invalidate()` + `session()->regenerateToken()` → 204

### GET /api/me（要認証）
→ `{ "data": { id, name, email, role } }`

### PUT /api/me（要認証）
body: `name`, `email` → 更新後のuser。

### PUT /api/me/password（要認証）
body: `current_password`, `password`, `password_confirmation` → 204

メール認証は実装しない。登録だけで購入まで進める。

## パスワードリセット

### POST /api/forgot-password（`throttle:password-reset` = IPで6回/分）
body: `email` → 常に200 `{ "message": "..." }`（アカウント存在を漏らさない）。
存在すれば`SendPasswordResetJob`をdispatchし、キューで`ResetPasswordMail`を送る（リンクはfrontendの`/reset-password?token=..&email=..`）。

### POST /api/reset-password（`throttle:password-reset`）
body: `token`, `email`, `password`, `password_confirmation`
→ 200 / 失敗422（`token`無効・期限切れ含む）。成功で全既存トークンを失効させるかは任意（シンプル優先で失効させない）。

## 住所録（要認証、本人のもののみ）

| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/addresses` | 一覧（is_defaultを先頭） |
| POST | `/api/addresses` | 作成。`is_default=true`なら他をfalse化 |
| PUT | `/api/addresses/{id}` | 更新 |
| DELETE | `/api/addresses/{id}` | 削除 |
| POST | `/api/addresses/{id}/default` | デフォルト設定 |

body: `recipient_name`, `postal_code`, `prefecture`, `city`, `address_line1`, `address_line2?`, `phone`, `is_default?`

## 注文（要認証）

### POST /api/orders（要認証。`throttle:orders` = ユーザーごとに5回/分。メール認証は不要）
```json
{ "items": [ { "variant_id": 55, "quantity": 2 } ],
  "address_id": 3, "address": null, "save_address": false }
```
- `address_id`か`address`（新規）のどちらか必須
- 金額はサーバーで再計算。`status = pending`で作成、在庫引き当て
- → 201 `{ "data": { order } }`（order_items含む、`status: "pending"`）
- 在庫不足 → 422 `{ "message": "...", "errors": { "items": [...] }, "shortages": [ { "variant_id": 55, "available": 1 } ] }`

### GET /api/orders（要認証）
本人の注文一覧（新しい順）。要約（number / created_at / item_count / total / status）。

### GET /api/orders/{order_number}（要認証）
本人の注文詳細。他人の注文は404。`payment`の要約（status / last_error）を含む。

## 決済

### POST /api/checkout/payment-intent（要認証。メール認証は不要）
body: `{ "order_number": "EC-20260907-0001" }`
- 対象注文が本人・`pending`であることを検証（それ以外は409）
- 金額をサーバーで再計算（`orders.total`と一致確認。ズレたら409=注文が古い）
- `payments`行が無ければPaymentIntentを作成（`amount = total`, `currency = jpy`, `metadata.order_id`）。あれば既存を再利用（`client_secret`を取り直す）
- → 200 `{ "data": { "client_secret": "pi_..._secret_...", "publishable_key": "pk_test_..." } }`

詳細は [docs/backend/payments.md](../backend/payments.md)。

### POST /api/stripe/webhook（**認証なし**。署名検証のみ。Sanctum・CSRF対象外）
- ヘッダ`Stripe-Signature`を`STRIPE_WEBHOOK_SECRET`で検証。失敗→400
- `stripe_events`にevent idをINSERT（重複なら200・no-op）
- 扱うイベント:
  - `payment_intent.succeeded` → 注文を`paid`に、注文確認メールdispatch
  - `payment_intent.payment_failed` → `payments.last_error`を更新（注文は`pending`のまま）
  - `payment_intent.canceled` → 注文を`cancelled`に、在庫復元
  - `charge.refunded` → `payments.refunded_at`を記録
- 未対応イベントは200で受け流す
- → 常に200（署名不正の400を除く）。処理失敗時は500を返してStripeに再送させる

詳細・冪等性の実装は [docs/backend/payments.md](../backend/payments.md)。

## ブラウザからの呼び出し（BFF廃止）

BFFは廃止し、ブラウザが直接Laravelを呼ぶ（[docs/02-decisions-log.md](../02-decisions-log.md)）。経路は3系統:

| データ | 経路 | 実装 |
|---|---|---|
| 公開データ（商品・カテゴリ・CMS） | Server Component → `apiServerFetch`（ISRタグ付き） → Laravel | Cookie不要 |
| 個人データの読み取り（マイページ・住所録・注文・決済ページ・管理画面） | Server Component → `apiServerFetch`（Cookie転送 + `Origin`ヘッダ付与、`no-store`） → Laravel | [docs/frontend/rendering-strategy.md](../frontend/rendering-strategy.md) |
| 書き込み（ログイン・注文・住所・管理画面の更新等） | Client Component → `apiClientFetch`（`credentials: 'include'` + CSRF） → Laravel 直接 | 必要なら`GET /sanctum/csrf-cookie`を自動で先に呼ぶ |

Client Component側の実装例:

```ts
// shared/lib/api-client.ts
export async function apiClientFetch(path: string, init: RequestInit = {}) {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (method !== 'GET' && method !== 'HEAD') {
    await ensureCsrfCookie(); // XSRF-TOKENが無ければ GET /sanctum/csrf-cookie
    headers.set('X-XSRF-TOKEN', readCookie('XSRF-TOKEN') ?? '');
  }
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { ...init, headers, credentials: 'include' });
}
```

PaymentIntentの作成（`/api/checkout/payment-intent`）・ログイン・住所の保存・注文作成などは、すべて上記の経路でブラウザ（またはServer Component）が直接呼ぶ。

**Stripe Webhookは変更なし。** Stripe → backendの公開URLへ直接（[docs/infra/railway.md](../infra/railway.md)）。`Origin`ヘッダが無いためSanctumのstateful判定も素通りし、既存の動作に影響しない。

更新操作後のISRキャッシュ無効化（`revalidateTag`）は、認証を中継するものではない薄い専用Route Handler（`POST /api/revalidate`）が行う（[docs/frontend/rendering-strategy.md](../frontend/rendering-strategy.md)）。

Cookie名: `ecp_session`（httpOnly）/ `XSRF-TOKEN`（非httpOnly）。いずれもLaravelが発行する。詳細は [docs/backend/auth.md](../backend/auth.md)。
</content>
