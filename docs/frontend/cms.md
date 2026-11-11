# 軽量CMS（frontend）

backend側は [docs/backend/cms.md](../backend/cms.md) 参照。実装は`features/public/catalog/`（公開側）と`features/admin/content/`（管理側）（[docs/frontend/folder-structure.md](./folder-structure.md)）。

**今回の変更点**: Heroを単一画像から、複数画像が自動で切り替わるスライドショーに変更した（[docs/02-decisions-log.md](../02-decisions-log.md)）。

## 公開側

公開側の取得関数（例: `getContent()`）:

```ts
export async function getContent(): Promise<SiteContent> {
  const res = await apiServerFetch<ApiResource<SiteContent>>('/api/content', {
    next: { tags: [tags.content], revalidate: 3600 },
  });
  return res.data;
}
```

トップページ（Server Component、`features/public/catalog`配下のコンポーネントを組み合わせる）:
```tsx
const [content, products, categories] = await Promise.all([getContent(), getProducts(), getCategories()]);
// <Hero headline={content.hero.headline} tagline={content.hero.tagline} images={content.hero.images} />
// <BrandConcept body={content.concept.body} />
// <Lookbook images={content.lookbook.images} /> <CategoryGrid ... /> <AboutSection blocks={content.about.blocks} />
```

`Hero`は画像配列を受け取り、一定間隔（例: 5秒）でopacityフェードしながら自動的に切り替えるスライドショー（手動ナビゲーションは持たない。[docs/01-overview.md](../01-overview.md)のデザイン方針「アニメーションはopacityと画像差し替えのみ」に準拠）。`setInterval`でクライアント側の状態を更新する必要があるため、`Hero`自体はClient Component（[docs/frontend/rendering-strategy.md](./rendering-strategy.md)）。headline/taglineは全スライド共通で1つだけ。

各コンポーネントは値が空文字/空配列/nullでも壊れないこと（`images`が空配列 → `bg-mist`プレースホルダを1枚表示、`images`が1枚のみならフェードなしで固定表示、`concept.body`空→セクションごと出さない、など）。

## 管理側（`/admin/content`）

- page（Server Component）が4セクションを並べる。各セクションは独立したClient Component（`features/admin/content/components/HeroSection`など）で、それぞれ自分の「保存」を持つ。
- 入力は`useState`で持ち、保存は`useContentSave(key, schema)`フック（`features/admin/content/hooks/`）（zodで確かめる→`apiClientFetch`で`PUT /api/admin/content/{key}`をLaravelに直接送信→エラーor「保存しました」）。スキーマは`features/admin/content/components/*.schema.ts`。
- 画像フィールド（`ContentImageUpload`）: プレビュー+Upload / Replace / Remove → `apiClientFetch`で`POST /api/admin/content/{key}/images`をLaravelに直接送信 → 返ったURLをstateに入れる（保存するまでdataには入らない）。
- Hero / Lookbook / Aboutは配列。行の追加・削除・▲▼の並べ替え（`shared/lib/array.ts`の`moveItem`）。Heroの管理画面編集UIはLookbookと同じ構造（headline/taglineのテキスト入力2つ＋画像の配列編集）。
- 「保存」成功後、`POST /api/revalidate`（`{ tags: ['content'] }`）を呼ぶ → セクションの下に「保存しました。トップページに反映されています。」
- 保存後にトップページを別タブで開くと即反映されていることを確認できる（ISRオンデマンド無効化のデモ）。
</content>
