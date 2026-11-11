# 認証設計

## 方式

- **Sanctumのセッション認証（SPA認証）**。ブラウザがLaravel発行のセッションCookieとCSRFトークンを保持し、**直接**Laravelにリクエストする（トークン方式・BFF中継は廃止。[docs/02-decisions-log.md](../02-decisions-log.md)）。
- frontend（Vercel）とbackend（Railway）は**カスタムドメインの同一トップレベルドメインのサブドメイン**にする（例: `app.example.com` / `api.example.com`）。SanctumのstatefulドメインがクロスサブドメインでセッションCookieを共有するために必須。
- メール認証（アドレス確認）は実装しない。`User`は`MustVerifyEmail`を実装せず、`email_verified_at`列も持たない。登録した時点で購入まで一通り体験できる。

## Sanctum stateful設定

`bootstrap/app.php`に`statefulApi()`を追加し、`EnsureFrontendRequestsAreStateful`ミドルウェアを`api`ミドルウェアグループの先頭に差し込む:

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->statefulApi();
})
```

このミドルウェアは、リクエストの`Origin`/`Referer`ヘッダが`config('sanctum.stateful')`（`SANCTUM_STATEFUL_DOMAINS`環境変数）に一致する場合のみ、Cookie復号→セッション開始→CSRF検証のパイプラインを適用する。一致しない場合は素通りする（Stripe Webhookのように`Origin`ヘッダが無いリクエストは自動的に対象外になり、既存の動作に影響しない。[docs/backend/payments.md](./payments.md)）。

`config/sanctum.php`は変更不要（`'stateful' => explode(',', (string) env('SANCTUM_STATEFUL_DOMAINS', ''))`が標準）。`/sanctum/csrf-cookie`ルートはSanctumのサービスプロバイダが自動登録する。

### 環境変数

| 変数 | 本番 | ローカル | 備考 |
|---|---|---|---|
| `SANCTUM_STATEFUL_DOMAINS` | `app.example.com` | `localhost:3000` | ローカルはポート必須（Originヘッダにポートが含まれるため） |
| `SESSION_DRIVER` | `database` | `database` | 従来`array`（トークン認証でセッション不使用）から変更 |
| `SESSION_DOMAIN` | `.example.com`（先頭ドット） | `localhost` | サブドメイン間でCookie共有するための設定。ローカルは`localhost:3000`/`localhost:8000`が異なるオリジンだが同一サイト（レジストラブルドメインが同じ`localhost`）なのでドメイン工作は不要 |
| `SESSION_COOKIE` | `ecp_session` | `ecp_session` | 旧`ecp_token`から命名変更 |
| `SESSION_SECURE_COOKIE` | `true` | `false` | ローカルはhttpなのでfalse |
| `SESSION_SAME_SITE` | `lax` | `lax` | |
| `SESSION_LIFETIME` | `43200`（30日） | `43200` | 旧トークンの有効期限30日とUXを揃える |

`personal_access_tokens`テーブル・`HasApiTokens`トレイトは残すが、ブラウザ経路では使わない（将来の非ブラウザAPIクライアント用に予約。[docs/backend/database-schema.md](./database-schema.md)）。

## CORS設定（`config/cors.php`、新規作成）

```php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('FRONTEND_URL', 'http://localhost:3000')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

`supports_credentials: true`の場合、`allowed_origins`にワイルドカード`*`は使えない（Fetch仕様上の制約）。既存の`FRONTEND_URL`環境変数（メールリンク用）をそのまま再利用する。`HandleCors`はLaravelのグローバルミドルウェアスタックに既定で入っているため、追加のミドルウェア登録は不要。

## CSRFトークンのフロー

標準的なSanctum SPA認証のフロー: 状態変更系リクエスト（POST/PUT/PATCH/DELETE）の前に`GET /sanctum/csrf-cookie`を呼び、`XSRF-TOKEN`（非httpOnly）Cookieを取得。以降のリクエストでその値を`X-XSRF-TOKEN`ヘッダに載せる。Laravelはレスポンスごとに`XSRF-TOKEN`を更新するので、一度プライムすれば以後は自動で回る。フロント側の実装（遅延プライム方式）は [docs/frontend/rendering-strategy.md](../frontend/rendering-strategy.md) 参照。

Server Component（SSR）からLaravelを呼ぶ場合は別の問題がある。Node.jsのfetchは`Origin`ヘッダを自動付与しないため`EnsureFrontendRequestsAreStateful::fromFrontend()`がfalseになりステートフル判定が効かない。対策として、サーバー専用のfetchヘルパーがCookie転送に加えて`Origin`ヘッダを明示的にfrontendのURLに設定する（詳細は [docs/frontend/rendering-strategy.md](../frontend/rendering-strategy.md)）。

## エンドポイント概要

ログイン/登録/ログアウト/パスワードリセットのAPI詳細は [docs/api/public.md](../api/public.md) 参照。要点:

- `POST /api/register` / `POST /api/login`: throttle付き（IPまたはメール+IPで5回/分）。**レスポンスに`token`フィールドは含まない**（セッションCookieが`Set-Cookie`で自動発行される）
- ログイン: `Auth::attempt()` → 成功なら`$request->session()->regenerate()`（セッション固定攻撃対策）
- ログイン失敗時は「メールが無い」「パスワード違い」を区別しない。**応答時間でも区別させない**ため、ユーザーが存在しない場合もダミーのハッシュに対して`Hash::check`を実行する
- `POST /api/logout`: `Auth::guard('web')->logout()` → `session()->invalidate()` → `session()->regenerateToken()`
- `GET /api/me`: `role`を含むユーザー情報を返す

```php
public function login(LoginRequest $request)
{
    if (! Auth::attempt($request->only('email', 'password'))) {
        return response()->json(['message' => __('auth.failed')], 422);
    }
    $request->session()->regenerate();
    return response()->json(['data' => $request->user()]);
}

public function logout(Request $request)
{
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return response()->noContent();
}
```

## 認可（role）

- `users.role`（`customer` / `admin`、default `customer`）。シーダーで管理者1人を投入
- `GET /api/me`は`role`を返す
- Laravel: `/api/admin/*`は`auth:sanctum` + `admin`ミドルウェア（`EnsureAdmin`、`$user->role === UserRole::Admin`）。認証済みだが権限なしは403。**`auth:sanctum`ガードの解決ロジックはセッション認証でも変わらない**（内部でセッション/トークンのどちらでも認証済みユーザーを解決できる）
- Next.js: `proxy.ts`（Next.js 16。旧middleware.ts）で`/admin/*`をCookie有無だけチェック。実role確認はServer Componentの`requireAdmin()`（`role !== 'admin'`なら`/`へ）。ログインは通常の`/login`を共用

## パスワードリセット（Laravel標準を薄く使う）

`Password` brokerをそのまま使い、`password_reset_tokens`テーブルを利用する。リセットURLは**frontendのパス**を指す必要があるため、`User`モデルで通知を差し替える:

```php
// User.php
public function sendPasswordResetNotification($token): void
{
    SendPasswordResetJob::dispatch($this->id, $token);
}
```

`SendPasswordResetJob::handle()`がフロント向けURL（`${FRONTEND_URL}/reset-password?token=..&email=..`）を自前で組み立てて`ResetPasswordMail`を送る（Laravelの`ResetPassword::createUrlUsing()`は使わない）。`config/auth.php`の`passwords.users.expire`（分）を本文に埋め込む。メール送信の詳細は [docs/backend/mail.md](./mail.md) 参照。

- `POST /api/forgot-password`は常に200を返す（アカウント存在を漏らさない）。存在すれば`SendPasswordResetJob`をdispatchする
- `POST /api/reset-password`は`token` `email` `password` `password_confirmation`を受け取り、無効・期限切れは422
- 成功で全既存トークンを失効させるかは任意（シンプル優先で失効させない）

## Cookie仕様

| Cookie名 | 属性 | 発行元 |
|---|---|---|
| `ecp_session` | httpOnly / secure（本番）/ sameSite=lax / path=/ / `Domain=.example.com`（本番）・`localhost`（ローカル） | Laravel（ログイン成功時に`Set-Cookie`） |
| `XSRF-TOKEN` | 非httpOnly（JSから読む必要があるため）/ secure（本番）/ sameSite=lax | Laravel（`GET /sanctum/csrf-cookie`、以後レスポンスごとに更新） |

いずれもLaravelが発行し、ブラウザが自動保存・送信する。Next.js側でCookieの読み書きは行わない（旧設計の`ecp_token`をNext.jsがhttpOnly Cookieとして保持する方式は廃止）。
</content>
