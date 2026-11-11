# 実装ロードマップ

機能ごとの縦切り（1機能をbackend→frontendまで一気通貫で作って、都度ローカルで動作確認する）で進める。デプロイはまず行わず、ローカルのDocker Composeで動作確認する。

**並び順は難易度優先**: 土台→認証のあとは、簡単な機能（CMS・商品管理・会員閲覧）を先に片付け、中程度の機能（カート・注文・注文管理・運用ダッシュボード）を経て、一番難しい決済に時間を使えるようにする。メール（パスワードリセット・注文確認・発送通知）は決済・フルフィルメントと内容が絡むため最後にまとめる。

注文管理・運用ダッシュボードは「paidの注文」をFactory/Seederで直接作って確認できるため、決済（フェーズ10）より前に実装できる。CMSも商品機能とは独立しているため、認証の直後に実装できる（トップページはCMSセクションのみで先に動かし、商品セクションは[フェーズ4](#フェーズ4-カテゴリ商品管理)で追加する）。

進捗はこのファイルのチェックボックスで管理する。

## コミット規約

- **実装したら同じコミットでテストも書く**（[docs/backend/testing.md](./backend/testing.md)・[docs/frontend/testing.md](./frontend/testing.md)）
- **ロードマップのステップ単位で、1ステップ実装したらすぐコミットする。** 複数ステップをまとめて実装してから後でコミットを分割する、という進め方はしない
- **コミットする前に必ず変更内容をユーザーに提示し、確認を得てからコミットする。** 確認を待たずに実行しない
- **ロードマップのチェックボックス更新は、そのステップの実装コミットに含める。** 別コミットに分けない
- **フェーズ1（土台）の環境構築関連コミットは、ファイル数の目安を当てはめない**（Docker構成などは性質上まとまった変更になるため）
- コミットメッセージ: 1行目に日本語の題名、その下に箇条書きで補足

## フェーズ1: 土台

- [x] 1. リポジトリの骨組み: `git init`、`.gitignore`、`.editorconfig`、`.nvmrc`、README骨子
- [x] 2. ローカルインフラ（db / rustfs / mailpit）+ テストDB初期化: `docker-compose.yml`に`db`/`rustfs`/`createbuckets`/`mailpit`を追加、`backend/database/init/01-create-test-db.sql`。`docker compose up -d`でここまで起動確認
- [x] 3. Laravel 13雛形 + Sanctum: `composer create-project laravel/laravel backend "^13.0"`（dockerのcomposerイメージ経由）→ `composer require laravel/sanctum` → `php artisan install:api` → `php artisan key:generate`
- [x] 4. backendコンテナ + `/api/health`: `docker-compose.yml`に`backend`サービス追加（`image: serversideup/php:8.4-fpm-nginx`を直接指定、`./backend:/var/www/html`バインドマウント）、`backend/.env.example`、簡易ヘルスチェックルート
- [ ] 5. Next.js 16雛形 + 確定ライブラリ: `create-next-app`（TypeScript/Tailwind/ESLint/App Router）→ `zustand` `@tanstack/react-query` `react-hook-form` `@hookform/resolvers` `zod` `@stripe/stripe-js` `@stripe/react-stripe-js` `lucide-react` `@aws-sdk/client-s3`、devDependenciesに`vitest` `@testing-library/react` `@testing-library/jest-dom` `@testing-library/user-event` `jsdom` `@vitejs/plugin-react`
- [ ] 6. frontendコンテナ + env見本: `frontend/Dockerfile.dev`、`docker-compose.yml`に`frontend`サービス追加、`frontend/.env.example`、`next.config.ts`（standalone出力なし。Vercel向け）
- [ ] 7. queue worker / schedulerコンテナ: `docker-compose.yml`に`queue`/`scheduler`追加（backendと同イメージ、`command`のみ上書き）
- [ ] 8. API疎通確認: frontend側に簡易な`apiServerFetch`/`/api/health`呼び出しを置き、ブラウザ・Next→Laravelの経路が通ることを確認（環境構築フェーズの完了マーカー）
- [ ] 9. backend用Railway本番Dockerfile: `backend/Dockerfile`、`backend/railway.json`、`backend/.dockerignore`（実デプロイは別フェーズでよいが、ファイルはここで用意）
- [ ] 10. カスタムドメイン設定: ドメイン名を取得し、Vercel（`app.example.com`）・Railway（`api.example.com`）にそれぞれ設定（[docs/infra/vercel.md](./infra/vercel.md)・[docs/infra/railway.md](./infra/railway.md)）。次のフェーズのSanctum stateful設定の前提になる

## フェーズ2: 認証

**backend**
- [ ] 11. DB＋User: `personal_access_tokens`マイグレーション（残すが未使用）、`User.php`（role列）、`config/sanctum.php`
- [ ] 12. Sanctum stateful設定: `bootstrap/app.php`に`statefulApi()`、`config/cors.php`新規作成（`supports_credentials: true`）、`SANCTUM_STATEFUL_DOMAINS`/`SESSION_DRIVER=database`等の環境変数（[docs/backend/auth.md](./backend/auth.md)）
- [ ] 13. 管理者seed: `AdminUserSeeder.php`、`DatabaseSeeder.php`
- [ ] 14. 認証API: `Api/AuthController`（`Auth::attempt()`ベースのregister/login/logout/me、`/me`更新、パスワード更新）、`routes/api.php`、throttle設定 + テスト。パスワードリセット（メール送信を伴う）は[フェーズ11](#フェーズ11-メール)に回す

**frontend**
- [ ] 15. APIクライアント基盤: `shared/lib/api-server.ts`（`apiServerFetch`。Cookie転送＋Origin付与）、`shared/lib/api-client.ts`（`apiClientFetch`。CSRF自動プライム）、型配置方針（[docs/frontend/component-types.md](./frontend/component-types.md)）
- [ ] 16. ログイン/登録画面: `features/public/auth/`、`apiClientFetch`でLaravelに直接送信 + `middleware.ts` + テスト
- [ ] 17. 管理画面ガード: `app/admin/layout.tsx`、`requireAdmin()` + テスト

## フェーズ3: CMS

**backend**
- [ ] 18. DB: `site_contents`マイグレーション、`SiteContentSeeder`、公開/管理API（[docs/backend/cms.md](./backend/cms.md)）+ テスト

**frontend**
- [ ] 19. トップページのCMS駆動化（Hero/Concept/Lookbook/About。商品セクションはまだ無い状態で先に動かす）、CMS編集画面（[docs/frontend/cms.md](./frontend/cms.md)）

## フェーズ4: カテゴリ・商品管理

**backend**
- [ ] 20. DB: `categories`/`products`/`product_images`/`product_variants`マイグレーション
- [ ] 21. 公開API: `Api/CategoryController`、`Api/ProductController`（index/show）+ テスト
- [ ] 22. 管理API: 商品・画像・バリアントCRUD + テスト

**frontend**
- [ ] 23. トップページに商品セクションを追加（[フェーズ3](#フェーズ3-cms)で作ったCMSセクションの下に差し込む）+ 商品カード
- [ ] 24. 商品詳細ページ
- [ ] 25. 管理画面の商品・カテゴリ管理画面、`app/api/revalidate/route.ts`（[docs/frontend/rendering-strategy.md](./frontend/rendering-strategy.md)）

## フェーズ5: 会員閲覧

**backend**
- [ ] 26. 会員閲覧API（一覧・詳細、閲覧のみ）+ テスト

**frontend**
- [ ] 27. 会員閲覧画面

## フェーズ6: カート

**backend**
- [ ] 28. カート再検証API（`/api/cart/validate`）+ テスト

**frontend**
- [ ] 29. カート（zustand + localStorage、`/cart`ページ）

## フェーズ7: 注文

**backend**
- [ ] 30. DB: `addresses`/`orders`/`order_items`マイグレーション、state machine（`OrderStatus` Enum）
- [ ] 31. 住所録API + テスト
- [ ] 32. 注文作成API（`CreateOrder` Action、在庫ロック・デッドロック回避）+ テスト

**frontend**
- [ ] 33. チェックアウト（配送先入力→注文作成まで。決済ページはまだ無い）
- [ ] 34. マイページ（注文履歴・注文詳細・住所録・プロフィール）

## フェーズ8: 注文管理

**backend**
- [ ] 35. 注文管理API（フルフィルメント・state machine遷移）+ テスト

**frontend**
- [ ] 36. 注文管理画面

## フェーズ9: 運用ダッシュボード

**backend**
- [ ] 37. 運用ダッシュボードAPI + テスト

**frontend**
- [ ] 38. 運用ダッシュボード画面

## フェーズ10: 決済

**backend**
- [ ] 39. DB: `payments`/`stripe_events`マイグレーション
- [ ] 40. `StripeService`、PaymentIntent作成API、Webhookハンドラ + テスト（[docs/backend/payments.md](./backend/payments.md)）
- [ ] 41. 未決済注文の自動キャンセル（scheduler）

**frontend**
- [ ] 42. StripeProvider、決済ページ、完了ページ（ポーリング）（[docs/frontend/payments.md](./frontend/payments.md)）

## フェーズ11: メール

**backend**
- [ ] 43. キュー設定、Mailable3種（パスワードリセット・注文確認・発送通知）、パスワードリセットAPI（forgot-password/reset-password）+ テスト（[docs/backend/mail.md](./backend/mail.md)）

**frontend**
- [ ] 44. パスワードリセット画面

## フェーズ12: 仕上げ

- [ ] 45. エラー/ローディング/空状態の整備
- [ ] 46. レスポンシブ確認
- [ ] 47. CI（GitHub Actions）
- [ ] 48. backend/frontendの本番デプロイ（Railway + Vercel）

各フェーズのファイルパス・詳細は、着手するタイミングで該当ドキュメント（`docs/backend/*` `docs/frontend/*` `docs/api/*`）を見ながら詰める。
</content>
