# 軽量CMS（backend）

frontend側は [docs/frontend/cms.md](../frontend/cms.md) 参照。

**今回の変更点**: Heroを単一画像から、複数画像が自動で切り替わる**スライドショー**に変更した（[docs/02-decisions-log.md](../02-decisions-log.md)）。headline/taglineは全スライド共通で1つのまま、画像だけ複数枚持つ。

## 目的

トップページの世界観パート（Hero / BrandConcept / Lookbook / About）を、コードを触らず管理画面から編集できるようにする。これは**ISRが一番効くシナリオ**（「編集したら即反映したいが、毎リクエストAPIを叩きたくない」）なので、`revalidateTag`とセットで実装する（[docs/frontend/rendering-strategy.md](../frontend/rendering-strategy.md)）。

**スコープを絞る**: 編集できるのは上記4セクションのテキストと画像のみ。ページ追加・ブロックの自由配置・リッチテキストエディタ・多言語・下書き/公開ワークフロー・バージョン履歴は**やらない**。フォームでJSONを編集する感覚の最小CMS。

## データモデル（`site_contents`。[docs/backend/database-schema.md](./database-schema.md)）

| key | dataの形 |
|---|---|
| `hero` | `{ "headline": string, "tagline": string, "images": [ { "url": string, "alt": string \| null } ] }`（自動切り替えのスライドショー。5〜6枚想定、0でも可。`lookbook`と同形。altを空で保存するとnullになる点も同様） |
| `concept` | `{ "body": string }`（改行区切りの短い文。3〜4行） |
| `lookbook` | `{ "images": [ { "url": string, "alt": string \| null } ] }`（5〜6枚想定、0でも可）。altを空で保存するとLaravelの`ConvertEmptyStringsToNull`がnullにするので、フロントのzod・型もnullを許す |
| `about` | `{ "blocks": [ { "label": string, "heading": string, "body": string, "image_url": string \| null } ] }`（3ブロック想定） |

- `data`は`jsonb`。Modelで`'data' => 'array'`キャスト。
- 画像は`image_url`に`/media/content/{key}/{ulid}.ext`を格納（商品画像と同じbucket / プロキシ。[docs/backend/storage-layout.md](./storage-layout.md)）。
- `updated_by`に最後に編集したadminの`user_id`。

## Seeder（`SiteContentSeeder`）

プレースホルダ文言を初期値にする（英語のブランド世界観文 + 画像なし`images: []`）。マイグレーション直後でもトップページが成立する。

`db:seed`時に`firstOrCreate(['key' => ...], ['data' => ...])`で冪等に（行が既にあれば何もしない = 管理画面で編集した内容をseedで上書きしない）。

## API

### 公開: `GET /api/content`

```json
{ "data": {
  "hero": { "headline": "...", "tagline": "...", "images": [ { "url": "/media/content/hero/01J..jpg", "alt": "..." } ] },
  "concept": { "body": "...\n..." },
  "lookbook": { "images": [ { "url": "/media/content/lookbook/01J..jpg", "alt": "..." } ] },
  "about": { "blocks": [ { "label": "Since 2026", "heading": "...", "body": "...", "image_url": null } ] }
} }
```

- 4キーを必ず全部返す。DBに行が無いキーは`SiteContent::defaults($key)`（`SiteContentSeeder`と同じ定数）で埋める。
- `SiteContentResource`（orコントローラで組み立て）。`image_url`は`path`から`/media/`を前置。
- **ISRタグ`content`**（[docs/frontend/rendering-strategy.md](../frontend/rendering-strategy.md)）。

### 管理: `GET /api/admin/content`

全4キーの生`data`（編集フォーム用。デフォルト補完はする）。

### 管理: `PUT /api/admin/content/{key}`

body = そのキーのスキーマのJSON（`data`全体を差し替え）。`UpdateSiteContent` Action:
1. `key`が4種のいずれかでなければ404
2. FormRequest（`UpdateSiteContentRequest`）が`key`ごとにrulesを出し分け（`switch ($this->route('key'))`）
3. `updateOrCreate(['key' => $key], ['data' => $validated, 'updated_by' => $user->id])`
4. → 200更新後の`data`

### 管理: `POST /api/admin/content/{key}/images`

multipart（`image`、5MB上限、`image`バリデーション）。`StorageService::put("content/{$key}", $file)` → `{ "url": "/media/content/hero/01J..jpg" }`を返す。フロントはこのURLを該当フィールドにセットしてから`PUT`する（画像アップロードとdata保存は2段階）。

孤児画像（アップロードしたが`PUT`されなかった画像）の掃除はしない（少量・privateなので許容）。

## テスト

- `GET /api/content`が行の無いキーもデフォルトで埋めて返す
- `PUT /api/admin/content/hero`のrules（`headline`必須、`images`は配列・各要素の`url`必須）
- 非adminは403
- 不正な`key`（`foo`）は404
- `PUT`後に`updated_by`がセットされる
</content>
