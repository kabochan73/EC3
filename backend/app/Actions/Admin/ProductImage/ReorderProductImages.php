<?php

namespace App\Actions\Admin\ProductImage;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ReorderProductImages
{
    /**
     * 渡されたimage id配列の順にpositionを0,1,2,...で振り直す。
     * その商品の画像idをすべて・過不足なく含んでいること。
     *
     * @param  list<int>  $orderedIds
     */
    public function execute(Product $product, array $orderedIds): void
    {
        $own = $product->images()->pluck('id')->all();

        sort($own);
        $given = $orderedIds;
        sort($given);

        if ($own !== $given) {
            throw ValidationException::withMessages([
                'order' => ['この商品の画像IDをすべて指定してください。'],
            ]);
        }

        DB::transaction(function () use ($orderedIds) {
            foreach ($orderedIds as $position => $id) {
                ProductImage::whereKey($id)->update(['position' => $position]);
            }
        });
    }
}
