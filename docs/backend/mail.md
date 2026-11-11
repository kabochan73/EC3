# トランザクションメール

前回（EC-Portfolio2）から変更なし。

## 方針

- **ローカル = Mailpit（SMTP）** / **本番 = Resend**。切り替えは`MAIL_MAILER`のみ。
- Laravel Mail + **Markdown Mailable**（`resources/views/mail/*.blade.php`）。デザインはモノトーンで簡素（Laravel標準のMarkdownコンポーネントの色を上書き）。
- 送信は**キュー経由**（`ShouldQueue`なJobから）。リクエストを待たせない。workerが落ちてもメールが遅延するだけ。
- 宛先は常に実ユーザーのメール。ポートフォリオなので実運用の宛先は自分だけ。**Resendはドメイン未検証のため共有ドメインから送信 = アカウント所有者宛にしか届かない**（[docs/infra/railway.md](../infra/railway.md)）。
- **メール認証（アドレス確認）は実装しない**。登録だけで購入まで一通り体験できるようにする方を優先する。

## Mailable一覧

| クラス | トリガ | 内容 | キュー |
|---|---|---|---|
| `ResetPasswordMail` | `POST /api/forgot-password` | リセットリンク（`${FRONTEND_URL}/reset-password?token=..&email=..`）。有効期限を明記 | `SendPasswordResetJob` |
| `OrderConfirmationMail` | Webhook `payment_intent.succeeded` → `MarkOrderPaid` | 注文番号・明細・送料・合計・配送先・`VIEW ORDER`リンク | `SendOrderConfirmationJob` |
| `OrderShippedMail` | adminが`paid → shipped` | 注文番号・「発送しました」・配送先・`VIEW ORDER`リンク | `SendOrderShippedJob` |

## パスワードリセットの送信経路

[docs/backend/auth.md](./auth.md) 参照。`User`モデルで`sendPasswordResetNotification`をoverrideし、`SendPasswordResetJob`をdispatchする。

注文確認・発送通知も同じ形（`TransitionOrderStatus` / Webhookハンドラが`SendOrderConfirmationJob` / `SendOrderShippedJob`をdispatch）。

## `config/mail.php` / `config/services.php`

```php
// config/mail.php
'default' => env('MAIL_MAILER', 'log'),
'mailers' => [
    'smtp' => [ /* Mailpit。host=mailpit port=1025 encryption=null authなし */ ],
    'resend' => ['transport' => 'resend'],
    'log' => ['transport' => 'log', 'channel' => 'stderr'],
],
'from' => [
    'address' => env('MAIL_FROM_ADDRESS', 'noreply@example.jp'),
    'name' => env('MAIL_FROM_NAME', 'EC3'),
],
```

Resendトランスポートは`composer require resend/resend-php`のみで有効になる（`config/mail.php`の`resend` mailer・`config/services.php`の`resend.key`はLaravel標準で既にある）。

`RESEND_API_KEY`未設定・`MAIL_MAILER=log`でも全フローが動く（メールはログに出るだけ）。ローカルはMailpitを既定にする。

## メールのトーン・デザイン

- 件名: `[ブランド名] ご注文ありがとうございます (EC-20260907-0001)`のような形。全部日本語。
- 本文: Markdown。`php artisan vendor:publish --tag=laravel-mail`でコンポーネントを取り出し、`resources/views/vendor/mail/html/themes/default.css`をモノトーン化（プライマリボタンを黒背景・白文字・角丸なし、リンクは黒下線、パネルはボーダーのみ）。
- ロゴ画像は使わずブランド名のテキスト。
- フッターにダミーの問い合わせ先。

## キュー（[docs/backend/folder-structure.md](./folder-structure.md)と対）

- `QUEUE_CONNECTION=database`。Jobは`implements ShouldQueue`, `use Queueable`。
- Jobのペイロードは**IDのみ**（`userId` / `orderId`）。`handle()`でモデルを引く。
- `--tries=3`。失敗は`failed_jobs`。`failed()`で`Log::warning`（注文自体は成立しているのでメール失敗は致命的でない）。
- テスト: `Mail::fake()` + `Queue::fake()`。
  - 「`forgot-password`で`SendPasswordResetJob`がpushされる」
  - 「Webhook succeededで`SendOrderConfirmationJob`がpushされる」
  - 「`OrderConfirmationMail`が正しい宛先・件名・注文番号を含む」（`Mail::assertQueued(fn ($mail) => $mail->hasTo($user->email) && ...)`）

## セキュリティ・運用メモ

- `forgot-password`のレスポンスは常に成功文言（アカウント存在を漏らさない）。メールが飛ぶかどうかで差が出ないよう、存在しないアドレスでも同じ200+遅延なし。
- リセットリンクはトークン付き・60分（`config/auth.php`の`passwords.users.expire`）。
- メール本文に生のトークンが載る以上、Mailpit / Resendのログ管理に注意（ポートフォリオなので許容）。
- バウンス・苦情処理はしない（実顧客がいない）。
</content>
