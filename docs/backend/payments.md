# Stripe決済（backend）

前回（EC-Portfolio2）から変更なし。frontend側は [docs/frontend/payments.md](../frontend/payments.md) 参照。

## 方針

- **Stripeカード決済のみ**（test mode）。PaymentIntent + Payment Element。
- 決済フローは注文作成と**分離**する: `POST /api/orders`（`pending`作成・在庫引き当て）→ `POST /api/checkout/payment-intent`（金額確定・PaymentIntent作成）→ フロントで確定 → **Webhookが唯一の"支払い成立"の判断根拠**。
- フロントの`confirmPayment`成功だけでは注文を`paid`にしない（クライアントは信用しない）。必ずWebhook `payment_intent.succeeded`で遷移。
- 通貨はJPY（ゼロ小数通貨）。`amount`は円をそのまま渡す（`1200` = ¥1,200）。

## なぜ注文を先に作るか

- 在庫の引き当てを決済前に確定させたい（決済画面に進んだ時点で在庫を押さえる。売り違いを減らす）
- 決済失敗・離脱は`pending`のまま残り、ユーザーが注文詳細から再開できる
- 放置された`pending`は**30分（`shop.pending_order_ttl_minutes`）で自動キャンセル**（`orders:expire-pending`をスケジューラが5分ごとに実行。在庫復元）。PaymentIntentはStripe側で自動的に期限切れにならないので、こちらから取り消す
- 同じユーザーが新しい注文を作ると、そのユーザーの`pending`注文はキャンセルされる（`CancelSupersededOrders`）。決済画面から戻って注文し直したときの在庫の二重確保を防ぐ。`POST /api/orders`はユーザーごとに5回/分
- `pending → cancelled`（admin / 期限切れ / 置き換え）では**PaymentIntentをStripe側で取り消してから**キャンセルする。取り消さないと、キャンセル後にユーザーが支払いを完了できてしまう。決済が`succeeded` / `processing`なら取り消せないのでキャンセルしない（adminには409。Webhookでpaidになる）
- それでもキャンセル済み注文に`payment_intent.succeeded`が届いたら、`MarkOrderPaid`が全額返金して記録する（安全網）

## PaymentIntentライフサイクル

```
POST /api/orders
      │  orders.status = pending, 在庫減算, payments行なし
      ▼
POST /api/checkout/payment-intent  （何度呼んでもよい = 冪等）
      │  payments行が無ければStripeにPaymentIntent作成 → payments作成
      │  あれば既存piをretrieveしてclient_secretを返す
      ▼
フロント: Payment Elementでconfirm Payment
      │
      ├─ 成功 → Stripe → Webhook: payment_intent.succeeded
      │            └─ MarkOrderPaid: orders.status = paid, paid_at, payments.status = succeeded,
      │                              payments.stripe_charge_id, SendOrderConfirmationJob dispatch
      │
      ├─ カード拒否 → confirmPaymentがerrorを返す（Webhook: payment_intent.payment_failed）
      │            └─ HandlePaymentFailed: payments.last_error更新（ordersはpendingのまま）
      │
      └─ ユーザー離脱 → pendingのまま。30分後にorders:expire-pendingが
                       PaymentIntentを取り消してcancelled + 在庫復元
```

adminが`paid → cancelled`:
```
TransitionOrderStatus(Cancelled)
  └─ StripeService::refund(payment_intent_id) → Stripe → Webhook: charge.refunded
        └─ RecordRefund: payments.refunded_at記録（追認のみ。返金自体は同期で実行済み）
  └─ RestockOrder: 在庫復元
  └─ orders.status = cancelled, cancelled_at
```

## `POST /api/checkout/payment-intent`の詳細

`CreatePaymentIntent` Action:

1. `order_number`で注文取得。`$order->user_id === $request->user()->id`でなければ404
2. `$order->status !== Pending`なら409 `{ "message": "この注文はすでに処理されています", "status": "<現在値>" }`
3. 金額の再確認: `ShippingFeeCalculator`等で`total`を再計算し`$order->total`と一致するか。ズレたら409（カタログ価格が変わった→注文を作り直させる。`PaymentAmountMismatchException`）
4. `STRIPE_SECRET_KEY`未設定なら503 `{ "message": "決済は現在利用できません" }`（ローカルでキー未入手のとき用）
5. `$order->payment`が無ければ:
   ```php
   $pi = $stripe->createPaymentIntent($order); // amount=total, currency=jpy,
                                               // metadata={order_id, order_number},
                                               // automatic_payment_methods={enabled:true}
   $order->payment()->create([
     'provider' => 'stripe',
     'stripe_payment_intent_id' => $pi->id,
     'status' => $pi->status,
     'amount' => $order->total,
     'currency' => 'jpy',
   ]);
   ```
6. あれば`$stripe->retrievePaymentIntent($payment->stripe_payment_intent_id)`。`status`が`canceled`なら新規作成し直す（稀）。それ以外はそのまま`client_secret`を返す
7. → 200 `{ "data": { "client_secret": $pi->client_secret, "publishable_key": config('services.stripe.publishable') } }`

## StripeService

```php
final class StripeService
{
    public function __construct(private readonly StripeClient $stripe) {}

    public function createPaymentIntent(Order $order): PaymentIntent { ... }
    public function retrievePaymentIntent(string $id): PaymentIntent { ... }
    public function refund(string $paymentIntentId): Refund { ... }
    public function constructWebhookEvent(string $payload, string $sigHeader): Event { ... }
}
```

- SDK（`stripe/stripe-php`）の`StripeClient`をDI（`AppServiceProvider`でシークレットキーを注入）
- メソッド群が同じ依存（`StripeClient`）を共有し、無限には増えない → Serviceの条件に合致
- テストでは`StripeService`をモック（`$this->mock(StripeService::class)`）してネットワークを避ける

## Webhookハンドラ（Controllerは薄く）

```php
// App\Http\Controllers\Api\Webhook\StripeController
class StripeController extends Controller
{
    public function __invoke(Request $request, StripeService $stripe): Response
    {
        try {
            $event = $stripe->constructWebhookEvent($request->getContent(), $request->header('Stripe-Signature'));
        } catch (SignatureVerificationException) {
            return response('invalid signature', 400);
        }

        if (! StripeEvent::claim($event->id, $event->type)) {
            return response('already processed', 200);
        }

        match ($event->type) {
            'payment_intent.succeeded'      => app(MarkOrderPaid::class)->execute($event),
            'payment_intent.payment_failed' => app(HandlePaymentFailed::class)->execute($event),
            'payment_intent.canceled'       => app(CancelOrderPayment::class)->execute($event),
            'charge.refunded'               => app(RecordRefund::class)->execute($event),
            default                         => null, // 未対応は受け流す
        };

        StripeEvent::complete($event->id);
        return response('ok', 200);
    }
}
```

- ルート: `Route::post('/stripe/webhook', StripeController::class)->middleware('throttle:60,1')`。`auth:sanctum`の外。CSRFはAPIなので元々なし
- 各Action（`MarkOrderPaid`等）が`DB::transaction` + `lockForUpdate`を持つ
- 処理中に例外→500を返してStripeに再送させる

### MarkOrderPaid（Webhook succeededの本体）

```php
final class MarkOrderPaid
{
    public function execute(Event $event): void
    {
        $intent = $event->data->object; // PaymentIntent
        DB::transaction(function () use ($intent) {
            $order = Order::whereKey($intent->metadata->order_id)->lockForUpdate()->firstOrFail();
            if ($order->status !== OrderStatus::Pending) {
                return; // 冪等: 既にpaid / cancelledなら何もしない
            }
            $order->payment->update([
                'status' => 'succeeded',
                'stripe_charge_id' => $intent->latest_charge,
            ]);
            $order->update(['status' => OrderStatus::Paid, 'paid_at' => now()]);
            SendOrderConfirmationJob::dispatch($order->id);
        });
    }
}
```

## Webhook: 冪等性の実装

### `stripe_events`テーブルの使い方

「INSERT済みだがprocessed_at未セットの再送を再処理したい」ケースを踏まえ、**2段階**にする:

```php
// StripeEventモデル
public static function claim(string $eventId, string $type): bool
{
    $row = static::firstOrCreate(
        ['stripe_event_id' => $eventId],
        ['type' => $type],
    );
    return $row->processed_at === null;
}

public static function complete(string $eventId): void
{
    static::where('stripe_event_id', $eventId)->update(['processed_at' => now()]);
}
```

```php
if (! StripeEvent::claim($event->id, $event->type)) {
    return response('already processed', 200);
}
try {
    match ($event->type) { ... };
} catch (Throwable $e) {
    report($e);
    return response('processing error', 500); // Stripeが再送 → 次回claimはtrue（processed_atまだnull）
}
StripeEvent::complete($event->id);
return response('ok', 200);
```

### 各Actionの冪等性（DBレベル）

- `MarkOrderPaid`: `lockForUpdate`して`status !== Pending`ならreturn（2回目のsucceeded、または既にキャンセル済み）
- `HandlePaymentFailed`: `payments.last_error`を上書きするだけ（何度実行しても同じ）
- `CancelOrderPayment`: `status`が`pending`のときだけ`cancelled` + 在庫復元
- `RecordRefund`: `refunded_at`がnullのときだけセット

### 署名検証

```php
// StripeService
public function constructWebhookEvent(string $payload, ?string $sigHeader): Event
{
    return Webhook::constructEvent($payload, $sigHeader ?? '', config('services.stripe.webhook_secret'));
}
```
`SignatureVerificationException` → コントローラで400。**生のリクエストボディ**が必要（`$request->getContent()`。パース済みの配列ではダメ）。

### ルート登録（CSRF・Sanctumの外）

```php
// routes/api.php （apiミドルウェアグループ。webのCSRFは元々かからない）
Route::post('/stripe/webhook', StripeController::class)
    ->middleware('throttle:60,1')
    ->name('stripe.webhook');
```

セッション認証導入（`statefulApi()`、[docs/backend/auth.md](./auth.md)）後も、StripeのWebhookリクエストには`Origin`/`Referer`ヘッダが無いため`EnsureFrontendRequestsAreStateful::fromFrontend()`が自動的にfalseを返し、CSRF検証・セッション開始の対象外のまま変わらない。

## 金額・通貨の扱い

- `config('shop.currency')` = `jpy`。JPYはゼロ小数なのでStripeに渡す`amount`は円そのまま。
- `orders.total` / `payments.amount` = 円（integer）。
- 送料無料しきい値・送料は`ShippingFeeCalculator`（Domain）で、注文作成時とPaymentIntent作成時の両方で使う（同じ計算に収束するはず。ズレたら409）。
- PaymentIntentの`amount`は`orders.total`（サーバーが`CreateOrder`で確定した値）から取る。`CreatePaymentIntent`は「注文が`pending`か」「`total`が今計算しても同じか」を確認。ズレたら409（カタログ価格が変わった等→注文を作り直させる）。

## テスト（[docs/backend/testing.md](./testing.md)と対）

`StripeService`をモックしてネットワークを遮断:

```php
it('marks order paid on payment_intent.succeeded webhook', function () {
    $order = Order::factory()->pending()->withPayment()->create();
    $payload = fixture_event('payment_intent.succeeded', [
        'metadata' => ['order_id' => $order->id],
        'latest_charge' => 'ch_test_123',
    ]);
    $this->mock(StripeService::class)
        ->shouldReceive('constructWebhookEvent')->andReturn(Event::constructFrom($payload));

    $this->postJson('/api/stripe/webhook', $payload, ['Stripe-Signature' => 't=1,v1=x'])
        ->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
    Queue::assertPushed(SendOrderConfirmationJob::class);
});

it('is idempotent for duplicate webhook delivery', function () { /* 同じevent idで2回POST → paidは1回、メール1回 */ });
it('rejects webhook with bad signature', fn () => /* constructWebhookEventがthrow → 400 */);
it('returns 409 when creating payment-intent for a non-pending order', ...);
it('ignores confirmPayment success on the client — status stays pending until webhook', ...);
```

## セキュリティ・運用メモ

- `client_secret`はそのオーダーの決済にしか使えない（Stripeの仕様）。ログに出さない。
- Webhookエンドポイントは公開だが署名必須。`STRIPE_WEBHOOK_SECRET`が本番とローカル（`stripe listen`）で異なる点に注意（[docs/infra/local-dev.md](../infra/local-dev.md)）。
- 返金は全額のみ（部分返金はスコープ外）。
- Stripeダッシュボードのイベントログが一次情報。DBとズレたらStripeが正。
- PCI: カード番号はフロントのStripe ElementとStripeサーバーの間だけ。自サーバー・自DBを通らない（SAQ A相当）。
</content>
