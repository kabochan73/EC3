<?php

namespace App\Actions\Admin\Product;

use App\Models\Product;
use App\Services\StorageService;

/**
 * 商品削除（docs/api/admin.md）。
 * order_items.product_idはSET NULL（注文履歴のスナップショットは残る）。
 * product_images / product_variantsはCASCADE。バケット上の画像実体も掃除する。
 *
 * 先にDBの行を消し、成功してからバケットを消す（失敗しても「誰も参照しないファイル」が残るだけで、
 * 「行はあるのにファイルが無い = 画像切れ」にはならない）。
 */
final class DeleteProduct
{
    public function __construct(private readonly StorageService $storage) {}

    public function execute(Product $product): void
    {
        $keys = $product->images()->pluck('path')->all();

        $product->delete();

        $this->storage->deleteMany($keys);
    }
}
