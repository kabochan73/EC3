<?php

namespace App\Http\Controllers\Api\Shop;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * カート再検証（docs/api/public.md GET /api/cart/validate）。
     * 公開APIは生の在庫数を返さない方針の唯一の例外。max_quantity経由で
     * 「在庫が上限（cart_max_quantity_per_line）未満のときだけ」実在庫が分かる。
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'variant_ids' => ['required', 'array', 'min:1', 'max:100'],
            'variant_ids.*' => ['integer'],
        ]);

        $variants = ProductVariant::query()
            ->with('product.images')
            ->whereIn('id', $validated['variant_ids'])
            ->get()
            ->keyBy('id');

        $data = collect($validated['variant_ids'])->map(function (int $variantId) use ($variants) {
            $variant = $variants->get($variantId);

            if ($variant === null || ! $variant->product->is_published) {
                return ['variant_id' => $variantId, 'available' => false];
            }

            return [
                'variant_id' => $variant->id,
                'available' => true,
                'price' => $variant->product->price,
                'stock_status' => $variant->stockStatus()->value,
                'max_quantity' => min($variant->stock, (int) config('shop.cart_max_quantity_per_line')),
                'product_name' => $variant->product->name,
                'product_slug' => $variant->product->slug,
                'size' => $variant->size,
                'color' => $variant->color,
                'image_url' => $variant->product->images->first()?->url(),
            ];
        });

        return response()->json(['data' => $data->values()]);
    }
}
