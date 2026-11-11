# Laravel設計指針

「綺麗なLaravel」= 設計論を発明することではなく、**フレームワークが用意したレイヤーを正しく使い分け、ビジネスロジックを1箇所に集める**こと。DDD・ヘキサゴナル・CQRSは持ち込まない。前回（EC-Portfolio2）の指針をそのまま踏襲する。

---

## 0. 2大アンチパターン

| アンチパターン | 症状 | 対策 |
|---|---|---|
| Fat Controller | コントローラに在庫チェック・金額計算・トランザクション | ロジックをActionに。コントローラは5〜10行 |
| 過剰な抽象化 | 差し替え予定のないInterface、全テーブルにRepository、神Service | 「差し替える予定がある」「同じロジックが3箇所」のときだけ抽象化 |

**判断基準**: 差し替え予定があるか、同じロジックが3箇所に出たときだけ抽象化する。

---

## 1. レイヤー構成

| レイヤー | 置き場所 | 責務 |
|---|---|---|
| Route | `routes/api.php`（公開+認証必須）/ `routes/admin.php`（管理API。api.phpからprefix('admin') + adminミドルウェアで読み込む） | URLとコントローラの対応、ミドルウェア |
| Controller | `app/Http/Controllers/Api/{Shop,Auth,Account,Order,Webhook,Admin}/` | 入力を受け取りActionを呼びResourceを返す |
| FormRequest | `app/Http/Requests` | 形式的バリデーション+認可 |
| Action | `app/Actions` | ビジネスロジック1ユースケース。トランザクション境界 |
| Domainクラス | `app/Domain` | Eloquent非依存の純粋ロジック（送料計算・採番） |
| Model | `app/Models` | リレーション・スコープ・キャスト |
| Enum | `app/Enums` | 状態・区分の定義と振る舞い（**state machineもここ**） |
| API Resource | `app/Http/Resources/{Shop,Order,Account,Admin}/` | レスポンスJSON整形。公開用と管理用はAdmin/で分ける |
| Exception | `app/Exceptions` | ドメインエラー→HTTP変換（`render()`） |
| Job | `app/Jobs` | キューに載る非同期処理。メール送信など |
| Mailable | `app/Mail` | メール1通の定義（[docs/backend/mail.md](./mail.md)） |
| Service | `app/Services` | **外部システムの凝集したラッパーのみ**。`StorageService` / `StripeService` |

データの流れ:
```
Request → Route → Controller
  → FormRequest（バリデーション・認可）
  → Action::execute(DTO)
      → Domainクラス（純粋ロジック）
      → Model（クエリ・永続化）
      → dispatch(Job)（非同期）
      → throw DomainException（異常系）
  → API Resource → JSON Response
```

---

## 2. ActionとServiceの使い分け

- **デフォルトはAction**。1ユースケース1クラス、`execute()`のみ。動詞で命名。
- **Serviceは外部システムの凝集したラッパーのみ**:
  - `StorageService` … S3互換バケット操作（put / delete / キー生成）
  - `StripeService` … Stripe APIのラッパー（PaymentIntent作成・取得・返金、Webhook署名検証）。SDKを直接コントローラやActionに散らさず、この1クラスに閉じる
- **Actionが Actionを呼ぶのは1段まで**。共通ロジックはDomainクラスへ。
- **単純な読み取りにActionを作らない**。コントローラ直書き、育ったら`Query`クラス。

### 作るAction

| ドメイン | Action |
|---|---|
| Order | `CreateOrder`（`pending`作成・在庫引き当て）/ `RestockOrder`（キャンセル時の在庫戻し）/ `CancelSupersededOrders`（新しい注文を作ったら、同じユーザーの古いpendingを取り消す） |
| Payment | `CreatePaymentIntent`（注文からPaymentIntent作成or再利用）/ `MarkOrderPaid`（Webhook succeededの本体）/ `HandlePaymentFailed` / `CancelOrderPayment`（Webhook canceled）/ `RecordRefund`（Webhook charge.refunded） |
| Admin/Order | `TransitionOrderStatus`（state machineの唯一の入口） |
| Auth | `RegisterUser` / `AuthenticateUser` / `UpdateProfile` / `UpdatePassword` |
| Address | `CreateAddress` / `UpdateAddress` / `DeleteAddress` / `SetDefaultAddress` |
| Admin/Product | `CreateProduct` / `UpdateProduct` / `DeleteProduct` |
| Admin/ProductImage | `CreateProductImage` / `DeleteProductImage` / `ReorderProductImages` |
| Admin/Variant | `CreateVariant` / `UpdateVariant` / `DeleteVariant` |
| Admin/Category | `CreateCategory` / `UpdateCategory` / `DeleteCategory` / `ReorderCategories` |
| Admin/Content | `UpdateSiteContent`（CMS。`data`差し替え + `updated_by`） |

メール送信そのものはActionではなく**Job**（`SendOrderConfirmationJob`等）に置き、Action / Webhookハンドラから`dispatch()`する。

---

## 3. 注文ステータスstate machine（Enumに振る舞い）

```php
enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Shipped = 'shipped';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function transitions(): array
    {
        return match ($this) {
            self::Pending   => [self::Paid, self::Cancelled],
            self::Paid      => [self::Shipped, self::Cancelled],
            self::Shipped   => [self::Completed, self::Cancelled],
            self::Completed, self::Cancelled => [],
        };
    }

    public function canTransitionTo(self $to): bool
    {
        return in_array($to, $this->transitions(), true);
    }

    public function isTerminal(): bool
    {
        return $this->transitions() === [];
    }
}
```

- 遷移の**副作用**（在庫戻し・返金・メール）はEnumではなく`TransitionOrderStatus` Actionが持つ（Enumは「遷移が許されるか」の判定のみ）
- `TransitionOrderStatus::execute(Order $order, OrderStatus $to)`:
  1. `$order->status->canTransitionTo($to)`でなければ`throw new InvalidOrderTransitionException`
  2. `DB::transaction`で`lockForUpdate`
  3. `$to`に応じた副作用: `Cancelled`かつ`from`がpending/paid → `RestockOrder`。`from === Paid && $to === Cancelled` → `StripeService::refund`。`$to === Shipped` → `shipped_at` + `SendOrderShippedJob`
  4. `$order->update(['status' => $to, ...timestamps])`

---

## 4. キュー

- `QUEUE_CONNECTION=database`（`jobs`テーブル）。Redisは入れない。
- **キューに載せるもの**: メール送信のみ（3種: 注文確認・発送通知・パスワードリセット）。Webhookの本体処理は同期（Stripeが200を待つ間に完了させたい／メールだけ後回し）。
- Jobは薄く: `SendOrderConfirmationJob($orderId)` → `handle()`で`Order::with(...)->find($id)`して`Mail::to(...)->send(new OrderConfirmationMail($order))`。IDを渡してモデルはhandle内で引く。
- `--tries=3`、失敗は`failed_jobs`。`failed()`フックでログ（メールなので握りつぶしてよい。注文自体は成立している）。
- ローカル: composeの`queue`サービスが`php artisan queue:work`。テスト: `Queue::fake()` / `Mail::fake()`。

---

## 5. パスワードリセット

- **メール認証機能は実装しない**。ポートフォリオ用途で、誰でもアカウント登録だけで購入まで一通り体験できるようにするため、`verified`ミドルウェア・検証メール送信・`/verify-email`系エンドポイントは作らない（`User`は`MustVerifyEmail`を実装しない、`email_verified_at`列も無い）。
- パスワードリセットは`Password` brokerをそのまま。`password_reset_tokens`テーブル利用。リセットURLは**frontendのパス**を指す（詳細は [docs/backend/auth.md](./auth.md)）。

---

## 6. Eloquent / Model

- スコープでクエリに言葉を: `scopePublished` / `scopeInCategory` / `scopeForUser`
- グローバルeager loadはしない。必要な箇所で`->with([...])`
- `AppServiceProvider::boot()`で`Model::preventLazyLoading(! app()->isProduction())`
  - **注意**: `preventLazyLoading`は複数行結果にしか効かない。単一モデルの遅延アクセスはすり抜ける。詳細ページの`with`は手を抜かない
- キャスト: `status => OrderStatus::class` / `size_chart => 'array'` / `data => 'array'`（site_contents）/ `paid_at => 'datetime'`など

---

## 7. configに集約（`config/shop.php`）

```php
return [
    'low_stock_threshold' => 5,
    'new_product_days' => 30,
    'shipping_fee' => 800,
    'free_shipping_threshold' => 20000,
    'cart_max_quantity_per_line' => 10,
    'pending_order_ttl_minutes' => 30,
    'order_number_prefix' => 'EC',
    'currency' => 'jpy',
];
```
Stripe / Resendのキーは`config/services.php`。

---

## 8. ディレクトリ構成

```
app/
├── Actions/
│   ├── Order/            CreateOrder(+Input) RestockOrder CancelSupersededOrders
│   ├── Payment/          CreatePaymentIntent MarkOrderPaid HandlePaymentFailed CancelOrderPayment RecordRefund
│   ├── Admin/            Order/TransitionOrderStatus  Content/UpdateSiteContent  Product/... Category/... Variant/... ProductImage/...
│   ├── Auth/             RegisterUser AuthenticateUser UpdateProfile UpdatePassword
│   └── Address/          CreateAddress UpdateAddress DeleteAddress SetDefaultAddress
├── Console/Commands/     ExpirePendingOrders（orders:expire-pending。schedulerが5分ごと）
├── Domain/
│   └── Order/            ShippingFeeCalculator  OrderNumberGenerator
├── Enums/                OrderStatus  StockStatus  UserRole
├── Jobs/                 SendPasswordResetJob  SendOrderConfirmationJob  SendOrderShippedJob
├── Mail/                 ResetPasswordMail  OrderConfirmationMail  OrderShippedMail
├── Http/
│   ├── Controllers/Api/   Shop/  Auth/  Account/  Order/(OrderController CheckoutController)  Webhook/StripeController  Admin/
│   ├── Middleware/        EnsureAdmin
│   ├── Requests/          Auth/  Address/  Order/  Checkout/  Admin/{Category,Product,ProductImage,Variant,Order,Content}/
│   └── Resources/         Shop/  Order/(OrderResource OrderListResource OrderItemResource)  Account/  Admin/
├── Exceptions/           InsufficientStockException  UnpublishedProductException  CategoryInUseException
│                         InvalidOrderTransitionException  PaymentAmountMismatchException
│                         OrderNotPendingException  PaymentInProgressException
├── Models/               ... Payment  StripeEvent  SiteContent
└── Services/             StorageService  StripeService
```

---

## 9. 命名規約

| 対象 | 規約 | 例 |
|---|---|---|
| Action | 動詞+名詞、`execute()` | `CreatePaymentIntent` `TransitionOrderStatus` |
| Actionの入力DTO | `{Action名}Input` | `CreateOrderInput` |
| Job | `{動詞}{名詞}Job` | `SendOrderConfirmationJob` |
| Mailable | `{名詞}Mail` | `OrderConfirmationMail` |
| FormRequest | `{動詞}{モデル}Request` | `StoreOrderRequest` |
| Resource | `{モデル}Resource` | `OrderResource` |
| Enum | 単数名詞 | `OrderStatus` |
| Exception | `{事象}Exception` | `InvalidOrderTransitionException` |

---

## 10. バリデーションの層分担

| 層 | 何を | 例 |
|---|---|---|
| FormRequest | 形式・型・必須・所有権（DB単発exists） | `quantity`は1〜10、`address_id`は本人のもの |
| Action | 業務ルール・競合が絡む検証 | `lockForUpdate`後の在庫、`is_published`、金額再計算、**state machine遷移可否** |
| DB制約 | 最終防衛線 | `stock >= 0` CHECK、`sku` UNIQUE、`orders_status_check`、FK |

書き込み系（POST/PUT/PATCH/DELETEでbodyを取る）はrulesが1行でもFormRequestに分ける。読み取り系のGETクエリはインライン`$request->validate()`。

---

## 11. テスト

実装と同時に書く方針に変更（[docs/backend/testing.md](./testing.md)参照）。

---

## 12. やらないことリスト

| 誘惑 | 判断 | 理由 |
|---|---|---|
| Repositoryパターン | 使わない | Eloquentが Repository |
| 神`OrderService` / `PaymentService`に全メソッド | Actionに分割。Serviceは SDKラッパーのみ | 神クラス化 |
| Interface + 実装1つ（`PaymentGatewayInterface`等） | 作らない | Stripeを差し替える予定がない。必要になってからで遅くない |
| Webhook処理を全部キューに | 同期でやる | Stripeが待つ200の間に注文確定まで済ませたい。メールだけ非同期 |
| イベント/リスナーで疎結合化 | Action直呼び | この規模では追いにくくなるだけ |
| Redis | 入れない（[docs/01-overview.md](../01-overview.md)） | カタログキャッシュはNextのISRに寄せた。レートリミッタ・キューは`database`で足りる。実負荷が出たら再検討 |
</content>
