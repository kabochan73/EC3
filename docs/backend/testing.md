# テスト戦略（backend）

frontend側は [docs/frontend/testing.md](../frontend/testing.md) 参照。

## 方針（今回も継続）

前回（EC-Portfolio2）でPestを導入し、「実装と同時にテストを書く」方針を確立した。今回も同じ方針を継続する。

- **Pest 3**を最初に入れる（[docs/04-implementation-roadmap.md](../04-implementation-roadmap.md) フェーズ1）。
- **ステップごとに、対応するテストを書いてからコミット**。テストの無いステップはコミットしない（純粋なdocs / 設定変更を除く）。
- カバレッジ数値は追わない。「壊れたら困る導線」をFeatureテストで押さえる。

## 何をテストするか

### Featureテスト（中心。HTTPを叩いてJSON / 副作用を検証）

| 領域 | 押さえるケース |
|---|---|
| カタログ | 公開商品のみ一覧に出る / 未公開slugは404 / `?category` `?new`フィルタ / `stock_status`の算出 |
| カート再検証 | 非公開・売り切れvariantが`available: false` |
| 認証 | 登録で201（セッション確立、`assertAuthenticated()`） / ログイン失敗422（`Auth::attempt`がfalse） / `throttle:login` / `/api/me`の中身 |
| パスワードリセット | `forgot-password`は存在しないメールでも200 / トークンで変更成功 / 無効トークン422 |
| 住所録 | 本人のみ / 他人のidは404 / デフォルト設定で他がfalse化 |
| 注文作成 | 在庫不足422+在庫ロールバック / 未公開商品混入422 / 金額はサーバー再計算（クライアント値を無視）/ 送料しきい値 / `pending`で作成+在庫減算 |
| 決済 | payment-intent作成（本人・pendingのみ）/ 非pendingは409 / 金額ズレ409 / キー未設定503 / 既存PaymentIntentの再利用 |
| Webhook | `payment_intent.succeeded`で`paid`+確認メールdispatch / 二重配信で1回だけ / 署名不正400 / 未対応イベントは200 / `payment_intent.canceled`で在庫復元 |
| 注文ステータス | state machineの許可遷移 / 不正遷移422 / `paid→cancelled`で返金+在庫復元 / `paid→shipped`で発送メール |
| 管理API | 非admin403 / 未認証401 / 全ルートにauth+admin（構造テスト）/ 商品・カテゴリ・バリアントCRUD / カテゴリ削除409 / 運用ダッシュボード / バケットへの保存の失敗で画像の行を作らない |
| CMS | `GET /api/content`がデフォルト補完 / `PUT`のrules / 不正key404 / 非admin403 |

### Unitテスト（純粋ロジックだけ）

- `Domain\Order\ShippingFeeCalculator::for()`（境界: 19999 / 20000 / 20001）
- `Domain\Order\OrderNumberGenerator::generate()`（日付内連番・日跨ぎ・UNIQUE衝突リトライ）
- `Enums\StockStatus::fromStock()`（0 / 3 / 4）
- `Enums\OrderStatus::canTransitionTo()` / `transitions()`（全遷移マトリクス）
- `Services\StripeService`

## 構成

```
backend/tests/
├── Pest.php                 # uses(RefreshDatabase::class)->in('Feature')
├── TestCase.php
├── Feature/
│   ├── Health/  Catalog/  Auth/  Account/
│   ├── Order/   Payment/   Admin/  Content/
├── Unit/
│   ├── ShippingFeeCalculatorTest.php  OrderNumberGeneratorTest.php  StockStatusTest.php
│   └── OrderStatusTransitionTest.php  StripeServiceTest.php
└── Support/
    ├── StripeFixtures.php    # 疑似StripeイベントのJSONを組み立てるヘルパ
    └── helpers.php
```

- 実DB（Postgres）で回す。`RefreshDatabase`。CIでも同じPostgresコンテナ。
- Repositoryパターンを使わない設計なので、DBを挟んだテストが自然（[docs/backend/folder-structure.md](./folder-structure.md)）。
- CSRF検証（`VerifyCsrfToken`）はLaravelのテスト環境で既定で無効化されているため、Featureテストで`X-XSRF-TOKEN`を付ける必要はない。認証状態は`actingAs($user)`で作る（既存の管理APIテストはこの方式のままで変更不要）。

## Stripeのテスト方法

**ネットワークを一切叩かない。** `StripeService`をモックする。

```php
// tests/Support/StripeFixtures.php
function stripe_event(string $type, array $objectOverrides = []): \Stripe\Event
{
    $base = json_decode(file_get_contents(__DIR__."/fixtures/{$type}.json"), true);
    $base['data']['object'] = array_replace_recursive($base['data']['object'], $objectOverrides);
    return \Stripe\Event::constructFrom($base);
}
```

```php
beforeEach(function () {
    $this->stripe = $this->mock(StripeService::class);
});

it('marks the order paid', function () {
    $order = Order::factory()->pending()->has(Payment::factory())->create();
    $this->stripe->shouldReceive('constructWebhookEvent')
        ->andReturn(stripe_event('payment_intent.succeeded', [
            'metadata' => ['order_id' => (string) $order->id],
            'latest_charge' => 'ch_x',
        ]));

    postJson('/api/stripe/webhook', ['x' => 1], ['Stripe-Signature' => 'x'])->assertOk();

    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});
```

`CreatePaymentIntent`のテストも`StripeService::createPaymentIntent`をモックして`Stripe\PaymentIntent::constructFrom([...])`を返す。

## メール・キューのテスト

```php
Mail::fake(); Queue::fake();
postJson('/api/forgot-password', ['email' => $user->email])->assertOk();
Queue::assertPushed(SendPasswordResetJob::class);
// ジョブを同期実行してメールを確認したいときはJobを直接newしてhandle()
(new SendPasswordResetJob($user->id, 'token'))->handle();
Mail::assertSent(ResetPasswordMail::class, fn ($m) => $m->hasTo($user->email));
```

## Factory方針

- 全モデルにFactory（テスト専用）。Seederは Factoryを呼ばない（本番イメージは`composer install --no-dev`でFakerが入らないため、値を直接書く）。
- 状態メソッド: `Product::factory()->unpublished()`、`ProductVariant::factory()->soldOut()` / `->lowStock()`、`Order::factory()->pending()` / `->paid()` / `->shipped()`、`User::factory()->admin()`。
- `Order::factory()`は`order_items`を伴わない素の注文も作れる（一覧テスト用）。`->withItems(int $n)`で明細付き。
- `OrderItemFactory`の`image_url`は空文字デフォルト（画像必須にしない）。

## CI

GitHub Actions（`.github/workflows/ci.yml`）。mainへのpushとPRで2ジョブを並列に:

- backend: PostgreSQL 16のサービスコンテナ + PHP 8.4 → Pint → Pest
- frontend: [docs/frontend/testing.md](../frontend/testing.md) 参照

`next build`は入れない（トップページなどをビルド時にLaravelから作るため。ビルドの確認はVercel / Railwayのデプロイに任せる）。
</content>
