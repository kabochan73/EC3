# フロントエンドのディレクトリ構成（feature-base）

今回新たに決めた変更点（[docs/02-decisions-log.md](../02-decisions-log.md)）。前回（EC-Portfolio2）はtype-base（`components/{domain}` `lib/{domain}`）だったが、今回はfeature-baseに変更する。また、BFFパターンを廃止したため`app/bff/`は存在しない（[docs/frontend/rendering-strategy.md](./rendering-strategy.md)）。

## 方針

- `app/(shop)` `app/admin`で画面単位に大きく分け、その配下を`features/public/*` `features/admin/*`でドメイン別に分割する。
- **featureをまたぐ共有コンポーネント**は、明確なデータ所有者があるものはowner featureに置き、他のfeatureからimportする。`shared/`には逃がさない（例: タグ選択UIを両方のfeatureが使う場合、タグを管理するfeature側に置く）。
- 一方、**ドメインロジックを持たない純粋な表示部品**（バッジ・金額表示・住所表示など、注文/マイページ/管理画面の3箇所から対等に使われ、どちらかが「所有者」とは言えないもの）は`shared/components/`に置く。
- **型定義は共有の`types.ts`を作らない**。`features/public/catalog`・`features/admin/products`のように、public/adminそれぞれのfeature配下に独立した`types.ts`を持つ（重複を許容する）。API共通のラッパー型（`ApiResource<T>` `ApiCollection<T>`）だけは`shared/types.ts`に置く。
- **zodスキーマの分割**: 共有の`schemas.ts`は作らない。フォームごとに専用ファイル（例: `LoginForm.tsx`に対し`LoginForm.schema.ts`）を隣に置く。

## ディレクトリ構成

```
frontend/
├── middleware.ts                 # /account /checkout /admin のCookie有無ガード（`ecp_session`）
├── app/
│   ├── layout.tsx                # <html><body>のシェルだけ
│   ├── globals.css               # Tailwind + デザイントークン
│   ├── error.tsx  global-error.tsx  not-found.tsx
│   ├── (shop)/                   # ストアフロント。Header/Footer付き共通レイアウト
│   │   ├── layout.tsx  error.tsx  not-found.tsx
│   │   ├── (catalog)/            # /  と  /products/[slug]
│   │   ├── (cart)/               # /cart  /checkout  /checkout/payment（error.tsxあり）  /checkout/complete  + loading.tsx
│   │   ├── (auth)/               # /login  /register  /forgot-password  /reset-password
│   │   └── (account)/            # /account  /account/orders(/[number])  /account/addresses  /account/profile
│   ├── admin/                    # 管理画面。独自レイアウト（サイドバー）+ error.tsx  not-found.tsx
│   │   └── products/  categories/  orders/  customers/  content/
│   ├── media/[...key]/route.ts   # バケットの画像の配信
│   └── api/
│       └── revalidate/route.ts   # 更新成功後にブラウザが呼ぶ、キャッシュ無効化専用の薄いRoute Handler（docs/frontend/rendering-strategy.md）
├── features/
│   ├── public/
│   │   ├── catalog/              # トップ・商品詳細
│   │   │   ├── components/       Hero BrandConcept Lookbook CategoryGrid AboutSection ProductCard
│   │   │   │                     ProductMedia Gallery VariantSelector Accordion SizeChartTable
│   │   │   ├── types.ts
│   │   │   └── __tests__/
│   │   ├── cart/
│   │   │   ├── components/       CartView CartLine CartSummary
│   │   │   ├── stores/cart.ts    # zustand（persist、キー ecp-cart）
│   │   │   ├── hooks/            useCartValidation
│   │   │   ├── types.ts
│   │   │   └── __tests__/
│   │   ├── checkout/
│   │   │   ├── components/       CheckoutClient AddressPicker OrderReview StripeProvider PaymentForm CheckoutComplete
│   │   │   ├── hooks/            useOrderStatusPolling
│   │   │   ├── types.ts
│   │   │   └── __tests__/
│   │   ├── auth/
│   │   │   ├── components/       LoginForm(+.schema.ts) RegisterForm(+.schema.ts) ForgotPasswordForm(+.schema.ts) ResetPasswordForm(+.schema.ts)
│   │   │   ├── types.ts
│   │   │   └── __tests__/
│   │   └── account/
│   │       ├── components/       AccountMenu OrderList AddressBook AddressForm(+.schema.ts) ProfileForm(+.schema.ts) PasswordForm(+.schema.ts) LogoutButton
│   │       ├── types.ts
│   │       └── __tests__/
│   └── admin/
│       ├── auth/
│       │   ├── components/       AdminShell AdminHeader AdminNav
│       │   └── __tests__/
│       ├── dashboard/
│       │   ├── components/       StatCard UnshippedOrderList
│       │   └── __tests__/
│       ├── products/
│       │   ├── components/       ProductForm(+.schema.ts) SizeChartEditor ProductImagesManager VariantsManager VariantForm(+.schema.ts)
│       │   ├── types.ts
│       │   └── __tests__/
│       ├── categories/
│       │   ├── components/       CategoryManager CategoryForm(+.schema.ts)
│       │   ├── types.ts
│       │   └── __tests__/
│       ├── orders/
│       │   ├── components/       OrderTable OrderStatusActions
│       │   ├── types.ts
│       │   └── __tests__/
│       ├── customers/
│       │   ├── components/       CustomerTable
│       │   ├── types.ts
│       │   └── __tests__/
│       └── content/              # CMS編集
│           ├── components/       HeroSection ConceptSection LookbookSection AboutSection ContentImageUpload ContentSaveBar
│           ├── hooks/            useContentSave
│           ├── types.ts
│           └── __tests__/
├── shared/
│   ├── lib/
│   │   ├── api-server.ts   # apiServerFetch（サーバー専用。Cookie転送＋Origin付与、ISRタグ付き）／ApiError
│   │   ├── api-client.ts   # apiClientFetch（ブラウザ専用。credentials:'include'＋CSRFの自動プライム）
│   │   ├── auth.ts         # requireAuth / requireAdmin（`apiServerFetch`で`/api/me`を呼ぶ）
│   │   ├── constants.ts    # SESSION_COOKIE_NAME（`ecp_session`）, CART_STORAGE_KEY, 送料・在庫・数量のしきい値（表示用）
│   │   ├── revalidate.ts   # ISRのタグ名の一元管理 + revalidateヘルパ
│   │   ├── format.ts       # formatYen / formatDate / formatDateTime（日本時間）/ formatOrderStatus（注文ステータスの日本語ラベル）
│   │   ├── form-errors.ts  # Laravelの422をフォームの欄に割り当てる
│   │   └── array.ts        # moveItem等の純粋な計算
│   ├── components/
│   │   ├── layout/   Header Footer CartCount AccountLink
│   │   ├── order/    OrderStatusBadge ShippingAddress AmountSummary   # マイページ・チェックアウト・管理画面で共用。OrderStatusBadgeは`formatOrderStatus`で日本語ラベルを表示（下記）
│   │   ├── ui/       Field
│   │   └── providers/  CartHydration QueryProvider
│   └── types.ts       # ApiResource<T> / ApiCollection<T> のみ（ドメインの型はfeature配下）
└── tests/               # Vitest + Testing Library（shared/ 用。feature内のテストは各feature配下の__tests__に置く）
```

**規約**: `.tsx`はJSXを返す関数だけ。`apiServerFetch`/`apiClientFetch`を呼ぶだけの関数・型定義・zodスキーマは`.ts`ファイルに分けて同じfeature配下に置く。

## featureをまたぐコンポーネントの置き場所の判断

| 状況 | 置き場所 |
|---|---|
| あるfeatureのデータを別のfeatureも使う（例: タグ選択UIをadmin/postsとadmin/tagsが両方使う） | データの所有者となるfeature配下に置き、他からimportする |
| どのfeatureが所有者とも言えない、ドメインロジックを持たない表示専用部品（例: `OrderStatusBadge`） | `shared/components/`に置く |
| ページ全体で使うプロバイダ・レイアウト部品（`QueryProvider` `CartHydration` `Header` `Footer`） | `shared/components/`に置く |
</content>
