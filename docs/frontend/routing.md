# サイトマップ / ページ設計

前回（EC-Portfolio2）から機能・構成は変更なし。実装のディレクトリ構成は [docs/frontend/folder-structure.md](./folder-structure.md)（feature-base）参照。

## ルート一覧

| パス | 内容 | 認証 |
|---|---|---|
| `/` | トップ（ブランドコンセプト・ストーリー＋カテゴリごとの全商品）。**CMSコンテンツ駆動** | 公開 |
| `/products/[slug]` | 商品詳細 | 公開 |
| `/cart` | カート | 公開 |
| `/checkout` | 配送先入力・注文内容確認 → `pending`注文作成 | 要ログイン |
| `/checkout/payment` | Stripe Payment Elementで決済 | 要ログイン |
| `/checkout/complete` | 注文完了（決済結果の反映待ちを含む） | 要ログイン |
| `/login` | ログイン | 公開 |
| `/register` | 会員登録 | 公開 |
| `/forgot-password` | パスワード再設定メールの送信 | 公開 |
| `/reset-password` | 新パスワード設定（メールのリンクから） | 公開（トークン必須） |
| `/account` | マイページ ダッシュボード | 要ログイン |
| `/account/orders` | 注文履歴 | 要ログイン |
| `/account/orders/[number]` | 注文詳細 | 要ログイン |
| `/account/addresses` | 住所録（一覧・追加・編集・削除・デフォルト設定） | 要ログイン |
| `/account/profile` | 氏名・メール・パスワード変更 | 要ログイン |
| `/admin/**` | 管理者ページ（詳細は [docs/api/admin.md](../api/admin.md)） | 要admin |

ブランド紹介は独立ページを持たず`/`トップページ内のセクションとして統合する。カテゴリ別一覧（`/collections/[category]`）・全商品一覧も作らない（小規模カタログのため、トップのカテゴリセクションで出し切る）。

未ログインで要ログインページに来たら`/login?redirect=<元パス>`に転送。`/admin/*`は`middleware.ts`でCookie有無をチェック、実際のrole確認はServer Componentの`requireAdmin()`。

メール認証は実装しない。登録さえすれば誰でも注文確定・決済まで一通り体験できる。

## 共通レイアウト

### ヘッダー
- 左: ロゴ（`/`へ）
- 中央: 無し（ナビ・検索なし）
- 右: `ACCOUNT`（未ログイン時`/login`、ログイン時`/account`）/ `CART (n)`（nは数量合計）
- 常に白背景・下ボーダー固定。モバイルもハンバーガーにせず同じ1行バー

### フッター
- ロゴ＋ダミーの電話番号（`tel:`）＋ダミーのお問い合わせメール（`mailto:`、ドメインはIANA予約の`example.jp`）
- `© 2026 [ブランド名]. All rights reserved.`
- ニュースレター入力・プレースホルダリンクは置かない

## 各ページ

### `/` トップ（CMS駆動）

1. フルスクリーンのヒーロー画像（複数枚が一定間隔で自動的にフェード切り替わるスライドショー。手動ナビゲーションは無し）＋中央に小さくブランド名とタグライン（`hero`コンテンツ）
2. ブランドコンセプト文（3〜4行、余白広め、中央寄せ。理念・スタンスのみ）（`concept`コンテンツ）
3. ルックブックの横スクロール帯（画像のみ5〜6枚）（`lookbook`コンテンツ）
4. カテゴリごとの商品セクション（`TOPS` `BOTTOMS` `OUTERWEAR` `ACCESSORIES`の順）: カテゴリ名の極太見出し＋そのカテゴリの全公開商品を`position`順にグリッド表示
5. `ABOUT`セクション（沿革・素材へのこだわり・製造背景。理念は繰り返さない）（`about`コンテンツ）

データ取得: セクション1〜3・5はCMS（`getContent()`、ISRタグ`content`）、セクション4は商品（`getProducts()`、ISRタグ`products` / `categories`）。詳細は [docs/frontend/rendering-strategy.md](./rendering-strategy.md)。

商品グリッド: PC 4カラム / タブレット3 / モバイル2。商品カード:
- 画像（`position=0`）、ホバーで`position=1`に差し替え
- 左上バッジ: `NEW`（作成30日以内）/ 在庫バッジ`LOW STOCK`・`SOLD OUT`
- カテゴリ名（小・グレー・全大文字）
- 商品名（最大2行）
- 価格`¥12,000`

並び順は`products.position`。ソートUIなし。カテゴリに商品0件時はそのセクション自体を出さない。

### `/products/[slug]` 商品詳細

- パンくず: `HOME / 商品名`
- 左: 画像ギャラリー（全画像を縦積み）。モバイルは横スワイプカルーセル＋ドット
- 右: スティッキーパネル
  - カテゴリ（小・グレー・全大文字）
  - 商品名 / 価格
  - 配送目安の囲み（`SHIPPING: 3–5 BUSINESS DAYS`、静的）
  - 色スウォッチ（複数色ある商品のみ。選択でその色のサイズと在庫を切替。画像は商品単位なので切り替えない）
  - サイズセレクタ（`stock=0`はグレーアウト・選択不可、`1〜5`はサイズ横に`LOW STOCK`）
  - `ADD TO CART`（サイズ未選択時は非活性）
  - アコーディオン: `DESCRIPTION` / `MATERIAL & CARE` / `SIZE GUIDE`（`size_chart`を表、nullは非表示）/ `SHIPPING & RETURNS`（静的）
  - スペック（アコーディオン外に小さく）: `ORIGIN` / `PRODUCT CODE`
- 下部: `YOU MAY ALSO LIKE` — 同カテゴリの他の公開商品をposition順に全件

ISR: `getProduct(slug)`にタグ`product:{slug}`と`products`。

### `/cart` カート

- 明細行: サムネ / 商品名・サイズ（・色）/ 単価 / 数量ステッパー / 小計 / 削除
- 数量上限は`min(stock, 10)`（`/api/cart/validate`の`max_quantity`。1明細10個まで = `config('shop.cart_max_quantity_per_line')`）
- サマリー: `SUBTOTAL` / `SHIPPING` / `TOTAL` / `CHECKOUT`ボタン
- 空カート: `YOUR CART IS EMPTY` ＋ `CONTINUE SHOPPING`
- カートはZustand + localStorage。ヘッダーの`CART (n)`と同期
- ページ表示時に各明細の商品/在庫/価格をAPIで再検証

### `/checkout` チェックアウト（配送先 → 注文作成）

1. 配送先: 住所録から選択、または新規入力（「住所録に保存」チェック）
2. 注文内容の確認（明細・送料・合計）
3. `PLACE ORDER` → Client Componentが`apiClientFetch`で`POST /api/orders`をLaravelに直接送信 → `status = pending`で注文作成、在庫引き当て → `/checkout/payment?order=<number>`へ

### `/checkout/payment` 決済

1. 対象注文（`pending`かつ本人）を取得。`pending`でなければ状態に応じて`/checkout/complete`か`/account/orders/[number]`へ
2. 同じServer Componentが`apiServerFetch`でLaravelの`POST /api/checkout/payment-intent`を呼び、`client_secret`と`publishable_key`を受け取る（サーバーが金額を再計算）
3. Stripe Payment Elementを描画。テストカード`4242 4242 4242 4242`
4. `stripe.confirmPayment({ confirmParams: { return_url } })` → Stripeが`/checkout/complete?order=<number>`へ戻す
5. カード拒否・3DS失敗はフォーム内にエラー表示（注文は`pending`のまま、再試行可能）

### `/checkout/complete` 注文完了

- `apiClientFetch`で`GET /api/orders/<number>`をポーリング（2.5秒間隔・最大60秒）して`paid`になるのを待つ（Webhook反映のラグ対策）
- `paid`確認: `注文番号`表示 / `VIEW ORDER`（注文詳細へ）/ `CONTINUE SHOPPING` / カートを空にする
- タイムアウト時: 「決済処理中です。数分後に注文履歴でご確認ください」＋ `VIEW ORDER`（カートは空にしてよい。Webhookが最終的に反映する）

### `/login` / `/register`

- ミニマルなフォーム（メール・パスワード、登録時は氏名も）
- 登録成功 → `redirect`先 or `/account`（メール認証は実装しないため、確認メールも案内バナーも無し）
- ログイン成功 → `redirect`先 or `/account`
- ログインフォームに`Forgot your password?` → `/forgot-password`
- バリデーションエラーはフィールド下に表示

### `/forgot-password`

- メールアドレス入力 → `apiClientFetch`で`POST /api/forgot-password`をLaravelに直接送信
- 成功時は「登録があればメールを送りました」の中立メッセージ（アカウント存在の漏洩を避ける）

### `/reset-password`

- URLの`token` / `email`をhiddenで保持。新パスワード+確認を入力 → `apiClientFetch`で`POST /api/reset-password`をLaravelに直接送信
- 成功 → `/login`（「パスワードを変更しました」）

### `/account` ダッシュボード

- `ようこそ, {name}`
- `ORDERS` / `ADDRESSES` / `PROFILE` / `LOGOUT`（adminなら`ADMIN PANEL`も）

### `/account/orders` 注文履歴

- 一覧: 注文番号 / 日付 / 点数 / 合計 / ステータス（表示は日本語。下記「注文ステータスの表示ラベル」参照）
- 行クリックで詳細へ

### `/account/orders/[number]` 注文詳細

- 配送先スナップショット / 明細 / 送料 / 合計 / ステータス / 注文日時
- `pending`の場合は`COMPLETE PAYMENT`ボタン（`/checkout/payment?order=<number>`）

### `/account/addresses` 住所録

カード一覧（デフォルトにバッジ）、追加・編集・削除・デフォルト設定。項目: 宛名 / 郵便番号 / 都道府県 / 市区町村 / 番地 / 建物（任意）/ 電話番号

### `/account/profile` プロフィール

- 氏名・メール変更フォーム
- パスワード変更フォーム（現パスワード必須）

## 業務ルール

- 送料: 一律¥800、小計¥20,000以上で無料
- 価格・金額はすべて整数（JPY・税込）
- 在庫: **注文作成時**（`POST /api/orders`）に`stock`を減算（トランザクション内）。決済失敗・放棄で`cancelled`にすると在庫を戻す
- 在庫ステータス: `0`→SOLD OUT / `1〜5`→LOW STOCK / `6以上`→在庫あり（`config('shop.low_stock_threshold') = 5`）
- `NEW`バッジ: `created_at`が30日以内
- 注文ステータス遷移: [docs/backend/database-schema.md](../backend/database-schema.md)のstate machine参照

## 注文ステータスの表示ラベル（今回新たに決めたこと）

API・DBの値（`pending` `paid` `shipped` `completed` `cancelled`）はそのまま英語の識別子として使うが、**ユーザーに見せる表示は日本語にする**（[docs/02-decisions-log.md](../02-decisions-log.md)）。`OrderStatusBadge`（[docs/frontend/folder-structure.md](./folder-structure.md)）が`shared/lib/format.ts`の`formatOrderStatus()`でこの変換を行う。マイページの注文一覧・詳細、管理画面の注文一覧・詳細で共通して使う。

| API・DBの値 | 表示ラベル |
|---|---|
| `pending` | 支払い待ち |
| `paid` | 支払い済み |
| `shipped` | 発送済み |
| `completed` | 完了 |
| `cancelled` | キャンセル済み |

管理画面の注文一覧のステータスフィルタ（[docs/api/admin.md](../api/admin.md)の`?status=`）も、選択肢のUI表示はこのラベルを使う（クエリパラメータの値自体は`pending`等の英語のまま）。
</content>
