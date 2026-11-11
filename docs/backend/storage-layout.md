# 画像ストレージ設計

前回（EC-Portfolio2）から変更なし。

## 方式

- 本番: Railway Storage Bucket（S3互換、private）。Railwayバケットは直リンク不可
- ローカル: RustFS（S3互換）
- Laravelは Flysystem S3ドライバ（`config/filesystems.php`の`s3`ディスク）
- `FILESYSTEM_DISK`の`'throw'`は`true`にする。初期値`false`だと、保存に失敗しても`put()`がfalseを返すだけで、`CreateProductImage`が画像の行を作ってしまう。削除の失敗は、DBの行がもう消えているので例外にせず`report()`だけ（`StorageService::deleteMany`）

## キー形式

- 商品画像: `products/{product_id}/{ulid}.{ext}`
- CMS画像: `content/{key}/{ulid}.{ext}`
- `product_images.path`はキーを保持。`url`はAPIリソースが`/media/{path}`として組み立てる（`url`カラムは持たない）

## 配信

Next.jsの`app/media/[...key]/route.ts`が`GetObject`して`Cache-Control: public, max-age=31536000, immutable`で返す（[docs/frontend/rendering-strategy.md](../frontend/rendering-strategy.md)）。ローカルはRustFS（`FILESYSTEM_DISK=s3`、エンドポイントをRustFSに、`AWS_USE_PATH_STYLE_ENDPOINT=true`）。

## `Services/StorageService`

S3互換バケット操作の薄いラッパー（put / delete / キー生成）。[docs/backend/folder-structure.md](./folder-structure.md) の「Serviceを使う正当な理由」に当てはまる数少ない箇所。

```php
final class StorageService
{
    public function put(string $prefix, UploadedFile $file): string { ... } // キーを返す
    public function delete(string $key): void { ... }
    public function deleteMany(array $keys): void { ... } // 1件失敗しても残りを続行、report()のみ
}
```

- 保存失敗は例外にする（上記の`'throw' => true`と合わせて、`CreateProductImage` Actionが保存成功を確認してから行を作る）
- 削除失敗はログに残すだけ（DBの行は既に削除済みのため、ユーザー操作としては完了している）

## テスト

- 保存が失敗したら画像の行を作らない
- 削除が失敗しても行は消え、例外は報告される（`report()`が呼ばれる）
- s3ディスクの`throw`がtrueになっている
</content>
