# 型・バリデーションの配置方針

今回の変更点を反映（[docs/02-decisions-log.md](../02-decisions-log.md)）。feature-base化に伴い、型とバリデーションスキーマの置き場所も見直す。

## 型

型は「種類」ごとに置き場所を決める。「全部を1か所に」はしない。

| 種類 | 置き場所 |
|---|---|
| **APIのレスポンスの型** | 各featureの`types.ts`（[docs/frontend/folder-structure.md](./folder-structure.md)）。`features/public/catalog/types.ts`・`features/admin/products/types.ts`のように、public/adminそれぞれのfeature配下に独立して持つ（重複を許容する） |
| **APIの共通ラッパー型** | `shared/types.ts`に`ApiResource<T> = { data: T }` / `ApiCollection<T> = { data: T[] }`のみ |
| **フォームの入力の型** | 各featureの`*.schema.ts`で`z.infer<typeof schema>`から作る。Laravelに送る形が少し違うとき（例: 管理画面の商品フォームの値+サイズ表）も、`z.infer`を元に同じファイルで作る |
| **コンポーネントのpropsの型** | そのコンポーネントのファイルの中 |

- APIのレスポンスの型は`backend/app/Http/Resources/*`と1:1。Resourceを変えたらここも直す（コメントで対応ファイル名）。
- `OrderStatus` / `StockStatus`は`backend/app/Enums/*`と一致。
- 決済系: `PaymentIntentResponse = { client_secret: string; publishable_key: string }`、`OrderDetail`に`payment?: { status: string; last_error: string | null }`。
- CMS: `SiteContent = { hero: {...}; concept: {...}; lookbook: {...}; about: {...} }`（[docs/frontend/cms.md](./cms.md)）。

**共有の`types.ts`を1ファイルに全部まとめない**こと。ショップ・会員・注文・管理・入力の型が混在すると、どのfeatureがどの型に依存しているか見えなくなる。入力の型も「フォームの型」と「表示用の型」を別々に持つ二重管理を避け、`z.infer`から作る一本に統一する。

## バリデーション（各featureの`*.schema.ts`）

- 1フォーム1ファイル（`LoginForm.schema.ts` `RegisterForm.schema.ts` `ProfileForm.schema.ts` `PasswordForm.schema.ts` `AddressForm.schema.ts` `ForgotPasswordForm.schema.ts` `ResetPasswordForm.schema.ts` `ProductForm.schema.ts` `VariantForm.schema.ts` `CategoryForm.schema.ts`、CMSの各セクション用スキーマ）。新しいパスワード+確認用の共通ルールは`shared/lib/`の`new-password.ts`に置いてよい（ルールそのものの重複を避けるため。型は各schemaで`z.infer`する）。
- コンポーネント内に`z.object`を直書きしない。
- クライアントzodはUX。最終防衛はLaravelのFormRequest。ルール（桁・`123-4567`形式）はバックエンドと揃える。
- 決済フォームにはzodスキーマを持たない（カード情報はStripe Elementが握り、こちらは触れない）。
</content>
