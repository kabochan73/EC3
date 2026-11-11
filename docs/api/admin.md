# API設計（管理）

公開APIは [docs/api/public.md](./public.md) 参照。管理画面の画面構成は [docs/frontend/routing.md](../frontend/routing.md)・認可は [docs/backend/auth.md](../backend/auth.md) 参照。

ベースパス`/api/admin`、全エンドポイント`auth:sanctum` + `admin`ミドルウェア。`auth:sanctum`ガードの解決ロジックはセッション認証でも不変（内部でセッション/トークンのどちらでも認証済みユーザーを解決できる。[docs/backend/auth.md](../backend/auth.md)）。

## ダッシュボード

| メソッド | パス | 返却 |
|---|---|---|
| GET | `/api/admin/stats` | `{ unshipped_count, awaiting_delivery_count, low_stock_count, sold_out_count, unshipped_orders: [...] }`。`unshipped_orders` = paidの注文を`paid_at`の古い順に20件 |

売上ダッシュボードは今回のスコープに含めない（[docs/02-decisions-log.md](../02-decisions-log.md)）。

## 商品

| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/products` | 未公開含む。`?q=&category=&page=` |
| POST | `/api/admin/products` | 作成 |
| GET | `/api/admin/products/{id}` | 編集用フル情報（images/variants込み） |
| PUT | `/api/admin/products/{id}` | 基本情報更新 |
| DELETE | `/api/admin/products/{id}` | 削除（`order_items.product_id`はSET NULL） |

## 商品画像

| メソッド | パス | 備考 |
|---|---|---|
| POST | `/api/admin/products/{id}/images` | multipart。バケット保存+行作成 |
| PUT | `/api/admin/products/{id}/images/reorder` | `{ order: [imageId, ...] }` |
| DELETE | `/api/admin/product-images/{id}` | バケットのオブジェクトも削除 |

## バリアント

| メソッド | パス | 備考 |
|---|---|---|
| POST | `/api/admin/products/{id}/variants` | `{ size, color?, sku, stock }` |
| PUT | `/api/admin/variants/{id}` | `{ color?, sku, stock }`（size変更不可） |
| DELETE | `/api/admin/variants/{id}` | 注文で参照済みはSET NULL |

## カテゴリ

| メソッド | パス |
|---|---|
| GET / POST | `/api/admin/categories` |
| PUT / DELETE | `/api/admin/categories/{id}` |
| PUT | `/api/admin/categories/reorder` |

`DELETE`は所属商品がある場合409（`CategoryInUseException`。DBのRESTRICTに頼らず事前チェック）。

## 注文

| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/orders` | 全ユーザー。`?status=&customer_id=&page=`（`customer_id`は会員詳細の注文履歴用） |
| GET | `/api/admin/orders/{order_number}` | 明細・配送先・顧客・決済情報 |
| PUT | `/api/admin/orders/{order_number}/status` | `{ status }`。state machine（[docs/backend/database-schema.md](../backend/database-schema.md)）。不正遷移422。`paid → cancelled`は返金 |

注文詳細ページのステータス操作（現在値に応じてボタンを出し分け）:
- `pending`: `CANCEL ORDER`（在庫復元）
- `paid`: `MARK AS SHIPPED` / `CANCEL & REFUND`（在庫復元+Stripe返金）
- `shipped`: `MARK AS COMPLETED` / `CANCEL`（返品扱い、在庫は戻さない）
- `completed` / `cancelled`: 操作なし

不正遷移はAPIが422。フロントはボタンで既に絞っているが、二重送信対策として楽観ロックはせず「操作後に再取得」。

## 会員

| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/customers` | `role='customer'`。注文数・登録日。`?q=`（name/email部分一致）・`?page=` |
| GET | `/api/admin/customers/{id}` | 会員1人。管理者のid・存在しないidは404 |

## CMS

| メソッド | パス | 備考 |
|---|---|---|
| GET | `/api/admin/content` | 全4キーの`data`（生JSON） |
| PUT | `/api/admin/content/{key}` | `data`を差し替え。`updated_by`に現在のadmin |
| POST | `/api/admin/content/{key}/images` | multipart。`content/{key}/{ulid}.ext`で保存、`{ url }`を返す |

詳細は [docs/backend/cms.md](../backend/cms.md)。

## 画像ストレージ

[docs/backend/storage-layout.md](../backend/storage-layout.md) 参照。
</content>
