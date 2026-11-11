# デザイン参考

## 方針（前回から不変）

Balenciaga公式サイトを参照した硬質なミニマル・モノトーン。

- 配色は4色のみ: `--color-ink #000` / `--color-paper #fff` / `--color-mist #f4f4f4` / `--color-graphite #767676`
- **ダークモードなし**。`app/layout.tsx`のスキャフォールド（`dark:`クラス等）は掃除する。
- 全大文字・字間広め（tracking）・極端な余白・区切りは原則ボーダー（影を使わない）。
- フォントはGeist Sans（スキャフォールド既定）。等幅は外す。
- アニメーションは`opacity`と画像差し替えのみ。

Tailwind v4のCSS-first方式で`globals.css`にトークンを定義する。

## 画像と「NO IMAGE」

- 画像が無ければ`bg-mist`に`NO IMAGE`（`text-graphite`・全大文字・字間広め）を表示する。
- 一覧カードのホバー差し替えは2枚目の画像がある時だけ。
- 画像配信は`/media/[...key]/route.ts`（`@aws-sdk/client-s3`の`GetObjectCommand`、ローカルのRustFSは`forcePathStyle: true`）。`next/image`のloaderはデフォルト（同一オリジン`/media/...`）。
- 商品のseedは画像なし（本番の画像は管理画面からアップロードする）。CMSも画像を持てる。

## 画像の扱い（フェーズ3着手時に決定）

前回（EC-Portfolio2）は商品・CMSの画像を一切用意せず、`bg-mist`のグレーボックスのまま完成させた（トップのHero/Lookbook/Aboutも画像ゼロ）。今回も同じ方針で進める（[docs/02-decisions-log.md](../02-decisions-log.md)）。管理画面からの画像アップロード機能自体は実装するが、実画像の用意はしない。
</content>
