# Stripe決済（frontend）

前回（EC-Portfolio2）から変更なし。backend側は [docs/backend/payments.md](../backend/payments.md) 参照。実装は`features/public/checkout/`配下（[docs/frontend/folder-structure.md](./folder-structure.md)）。

## StripeProvider

`features/public/checkout/components/StripeProvider.tsx`（Client）:
```tsx
// publishableKeyは /api/checkout/payment-intent のレスポンスで受け取る（NEXT_PUBLIC_* の環境変数は使わない）
const stripePromise = loadStripe(publishableKey);
// <Elements stripe={stripePromise} options={{ clientSecret, appearance }}> でラップ
```
`appearance`はモノトーン（`theme: 'flat'`ベースにボーダーのみ、角丸なし、フォント継承）。

## `/checkout/payment`フロー

1. Server Component: `getOrder(number)`で対象注文を取得。`pending`でなければ状態別にリダイレクト（`paid`→complete、`cancelled`→orders詳細）。
2. 同じServer Componentが`POST /api/checkout/payment-intent`（`{ order_number }`）を呼び、`{ client_secret, publishable_key }`を受け取る。503（Stripe未設定）・409（価格が変わった）は、このSCがパネルで表示する
3. Client `PaymentForm`:
   - propsで受け取った`clientSecret` / `publishableKey`で`<Elements options={{ clientSecret }}>` → `<PaymentElement />` + `SUBMIT`ボタン
   - `stripe.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/checkout/complete?order=${number}` } })`
   - 成功・3DSとも、Stripeが`return_url`へ戻す（`redirect: 'if_required'`は使わない）
   - エラー（`error.type === 'card_error' | 'validation_error'`）→フォーム下にメッセージ。注文は`pending`のまま
4. `client_secret`は再訪時に同じPaymentIntentのものが返る（[docs/backend/payments.md](../backend/payments.md)の再利用）。

## `/checkout/complete`

- `useOrderStatusPolling(number)`フック（`features/public/checkout/hooks/`）: `apiClientFetch`で`GET /api/orders/{number}`をLaravelに直接2.5秒間隔で最大60秒ポーリング、`status`が`pending`でなくなったら停止。
- `paid` → 注文番号・`VIEW ORDER`・`CONTINUE SHOPPING`、カートを空に。
- タイムアウト → 「決済を受け付けました。反映まで少しかかることがあります」＋`VIEW ORDER`、カートは空に（Webhookが最終的に確定させる）。
- URLにStripeの`redirect_status=failed`が付いていたら（SCの`searchParams`で読んでpropsで渡す）「決済に失敗しました」＋`/checkout/payment?order=..`へ戻すリンク。

## スタイル

Stripe Payment Elementの`appearance`は [docs/frontend/design-reference.md](./design-reference.md) のトークンに合わせる。
</content>
