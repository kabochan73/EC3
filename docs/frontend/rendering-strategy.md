# データ取得とISR

**今回の変更点**: BFFパターンを廃止し、ブラウザが直接Laravelを叩く構成に変更した（[docs/02-decisions-log.md](../02-decisions-log.md)）。認証はSanctumのセッション認証（SPA認証）。ディレクトリパスはfeature-base構成（[docs/frontend/folder-structure.md](./folder-structure.md)）に合わせて読み替える。

## アーキテクチャ（BFF廃止後）

ブラウザが直接Laravelを叩く。経路は3系統＋キャッシュ無効化専用の1系統:

| データ | 経路 | 実装 |
|---|---|---|
| 読み取り（商品・カテゴリ・CMS） | Server Component → feature内の関数 → `apiServerFetch`（サーバー専用、**ISRタグ付き**）→ Laravel | Cookie不要 |
| 個人のデータの読み取り（マイページ・住所録・注文・決済ページ・管理画面） | Server Component → `requireAuth()` / `requireAdmin()` → `apiServerFetch`（Cookie転送＋`Origin`ヘッダ付与、`no-store`）→ Laravel | [後述](#server-componentからのlaravel呼び出し) |
| 書き込み（認証・注文・住所・プロフィール・管理画面の更新） | Client Component → `apiClientFetch`（`credentials:'include'` + CSRF）→ Laravel **直接** | BFFは経由しない |
| キャッシュ無効化のみ | Client Component → `POST /api/revalidate`（Next.js自身。admin確認後`revalidateTag()`） | 認証を中継するものではない薄いRoute Handler |

```
ブラウザ
  ├─ (Server Component)  ──→ apiServerFetch(tags) ─────────→ Laravel  （商品・カテゴリ・CMS。個人データはCookie転送+Origin付与）
  ├─ apiClientFetch(path)  ─────────────────────────→ Laravel  （ログイン・保存・削除などの書き込み。直接）
  │     └ credentials:'include' + X-XSRF-TOKEN（必要なら先に GET /sanctum/csrf-cookie）
  └─ POST /api/revalidate  ──→ app/api/revalidate/route.ts ──→ revalidateTag()  （更新成功後にブラウザから呼ぶ）
```

### Server ComponentからのLaravel呼び出し

Node.jsのfetchは`Origin`ヘッダを自動付与しないため、`EnsureFrontendRequestsAreStateful::fromFrontend()`がfalseになりSanctumのステートフル判定が効かない（[docs/backend/auth.md](../backend/auth.md)）。`shared/lib/api-server.ts`がCookie転送に加えて`Origin`ヘッダを明示的にfrontendのURL（`FRONTEND_ORIGIN`環境変数）に設定することで解決する:

```ts
// shared/lib/api-server.ts （Server Component専用）
import { cookies } from 'next/headers';

const API = process.env.API_URL!;
const ORIGIN = process.env.FRONTEND_ORIGIN!;

export async function apiServerFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const jar = await cookies();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...init.headers, Accept: 'application/json', Cookie: jar.toString(), Origin: ORIGIN },
    cache: init.cache ?? 'no-store',
  });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
  return res.json();
}
```

公開データ（商品・カテゴリ・CMS）の取得はCookie・Originとも不要なので、ISRタグ付きfetchはこのヘルパーのオプション（`Cookie`/`Origin`ヘッダを付けない呼び方）で変わらず動く。

## ISRタグ設計

`shared/lib/revalidate.ts`にタグ名を集約:

```ts
export const tags = {
  products: 'products',                       // 商品一覧・カード表示全般
  product: (slug: string) => `product:${slug}`,
  categories: 'categories',
  content: 'content',                         // CMS（トップのHero/Concept/Lookbook/About）
} as const;
```

`apiServerFetch`の第2引数でタグと再検証間隔を渡す:

| 関数 | fetchオプション |
|---|---|
| `getCategories()` | `{ next: { tags: [tags.categories], revalidate: 3600 } }` |
| `getProducts({category?})` | `{ next: { tags: [tags.products], revalidate: 600 } }` |
| `getProduct(slug)` | `{ next: { tags: [tags.product(slug), tags.products], revalidate: 600 } }` |
| `getContent()` | `{ next: { tags: [tags.content], revalidate: 3600 } }` |

- `revalidate`は保険（何もしなくても最終的に新しくなる）。**正はオンデマンド無効化**。
- 個人化データ（`/account` `/cart` `/checkout` `/admin`配下の取得）は`cache: 'no-store'`固定。タグは付けない。

## オンデマンド無効化（`revalidateTag`）

更新操作そのものはClient Componentがブラウザから直接Laravelに送る。成功したら、ブラウザが続けて`POST /api/revalidate`（`app/api/revalidate/route.ts`）を呼び、このRoute Handlerが対象タグを無効化する:

```ts
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { apiServerFetch } from '@/shared/lib/api-server';

const ALLOWED = new Set(['products', 'categories', 'content']); // + `product:${slug}`はプレフィックス許可

export async function POST(req: Request) {
  const me = await apiServerFetch<{ data: { role: string } }>('/api/me').catch(() => null);
  if (me?.data.role !== 'admin') return new Response(null, { status: 403 });

  const { tags } = await req.json();
  for (const tag of tags as string[]) {
    if (ALLOWED.has(tag) || tag.startsWith('product:')) revalidateTag(tag);
  }
  return new Response(null, { status: 204 });
}
```

このRoute Handlerは認証の中継（BFF）ではなく、キャッシュ無効化という狭い役割のみを持つ。呼び出し元ごとに送るタグ:

| 操作（Laravel呼び出し後にブラウザが送るタグ） | 無効化するタグ |
|---|---|
| 商品の作成・更新・削除 | `products` ＋ `categories` ＋ `product:{slug}`（slugを変えたら変更前のslugも） |
| バリアント・画像の更新 | `products` ＋ `product:{slug}` |
| 注文ステータス変更（cancelledになったとき） | `products` ＋ 明細の商品の`product:{slug}`（在庫が戻って売り切れが解けるため） |
| カテゴリの作成・更新・削除 | `categories` ＋ `products` |
| CMSコンテンツの更新 | `content` |

管理画面の操作フローの例:
```tsx
await apiClientFetch(`/api/admin/products/${id}`, { method: 'PUT', body });
await fetch('/api/revalidate', { method: 'POST', body: JSON.stringify({ tags: ['products', `product:${slug}`] }) });
router.refresh();
```

## 書き込み・個人化

- Client Componentが`apiClientFetch(path)`でLaravelに**直接**書き込みリクエストを送る（`shared/lib/api-client.ts`。[docs/backend/auth.md](../backend/auth.md)のCSRFフロー参照）。
- 更新成功後、必要なら`POST /api/revalidate`を呼んでキャッシュを無効化し、`router.refresh()`でページを再描画する。
- `@tanstack/react-query`を使うのは、ログイン状態の`AccountLink`、カートの在庫再検証、決済ステータスのポーリングの3つだけ。
- **`/admin`はTanStack Queryを使わない**。ルールは「読み取り = Server Component、操作 = Client Component」:
  - `page.tsx`はasync Server Component。`requireAdmin()` → `apiServerFetch`（Cookie転送＋Origin付与、`no-store`）で取得 → 描画
  - 検索・絞り込み・ページングはURLの`searchParams`で持つ（クライアントstateを持たない）
  - フォーム・ボタンだけ`"use client"`。`apiClientFetch('/api/admin/...')`で直接更新 → 成功後`POST /api/revalidate` → `router.refresh()`でサーバーが再描画
  - 理由: 権限チェックが描画より先に済む / URLだけで画面状態が再現できる（BFFの有無に関わらず成立するルール）

## Laravelの422をフォームに出す

Laravelの`{ message, errors }`レスポンスをそのまま使う（`apiClientFetch`は中継せず直接返す）。フォームは`errors`をreact-hook-formの`setError`にマッピング（`shared/lib/form-errors.ts`）。

## ページごとのServer / Client Component

**ルール: `page.tsx`と`layout.tsx`は全部Server Component（SC）。Client Component（CC）は画面の中の「操作する部品」だけ。**

CCにするのは次のどれかに当てはまるときだけ:
1. ブラウザにしかないデータを使う（カート = localStorage）
2. ユーザーの操作で画面が変わる（フォーム、ボタン、サイズ選択、グラフの日別⇔月別）
3. ブラウザから定期的に取り直す（決済完了のポーリング）
4. 時間経過で自動的に表示が変わる（Heroのスライドショー。`setInterval`でクライアント側のstateを更新する）

読み取りはSCが行い、CCは**操作したら`router.refresh()`でサーバーに描き直してもらう**。CCが自分で一覧を取り直すことはしない。

**ストア**

| ページ | page.tsx | サーバーで取るデータ | CCの部品 |
|---|---|---|---|
| `/` | SC（ISR） | CMS・カテゴリ・商品 | `Hero`（スライドショーの自動切り替え） |
| `/products/[slug]` | SC（ISR） | 商品詳細・関連商品 | `VariantSelector`（サイズ・色の選択+カート追加） |
| `/cart` | SC | なし | `CartView`（中身は全部localStorageなのでCC） |
| `/login` `/register` | SC | なし | フォーム |
| `/forgot-password` | SC | なし | フォーム |
| `/reset-password` | SC | `searchParams`のtoken / email | フォーム（token / emailはpropsで受け取る） |
| `/account` | SC | ログインユーザー | `LogoutButton` |
| `/account/orders`、`/[number]` | SC | 注文一覧・詳細 | なし |
| `/account/addresses` | SC | 住所一覧 | `AddressBook`（追加・編集・削除・★ → `router.refresh()`） |
| `/account/profile` | SC | ログインユーザー | `ProfileForm` / `PasswordForm` |
| `/checkout` | SC | 住所一覧 | `CheckoutClient`（カートを読むため） |
| `/checkout/payment` | SC | 注文+**PaymentIntent（client_secret）** | `PaymentForm`（Stripeの入力欄はブラウザで動く） |
| `/checkout/complete` | SC | 注文、`searchParams`の`redirect_status` | `CheckoutComplete`（paidまでポーリング→カートを空に） |

**管理画面**

| ページ | page.tsx | CCの部品 |
|---|---|---|
| `/admin` | SC（stats） | なし |
| `/admin/categories` | SC | `CategoryManager` |
| `/admin/products`、`/new`、`/[id]` | SC | `ProductForm` / `ProductImagesManager` / `VariantsManager` |
| `/admin/orders`、`/[number]` | SC | `OrderStatusActions` |
| `/admin/customers`、`/[id]` | SC | なし |
| `/admin/content` | SC | 4セクションの編集フォーム |

**全体で使うCC**: `QueryProvider` / `CartHydration` / ヘッダーの`CartCount`・`AccountLink`（ページをISRで全員に同じHTMLとして配るため、ログイン状態はブラウザ側で取る）/ `AdminNav`（現在のページの強調表示）

**同じデータを取る処理をSCとCCに二重に持たない**。操作後の再取得は`router.refresh()`に統一する。URLのパラメータはSCの`searchParams`で読んで props で渡す。
</content>
