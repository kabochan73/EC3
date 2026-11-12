<?php

namespace App\Http\Resources\Shop;

use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 公開向けバリアント（docs/api/public.md GET /api/products/{slug}）。
 * 在庫ステータスはEnumに委譲。生のstock値は公開APIでは返さない。
 *
 * @mixin ProductVariant
 */
class ProductVariantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $status = $this->stockStatus();

        return [
            'id' => $this->id,
            'size' => $this->size,
            'color' => $this->color,
            'stock_status' => $status->value,
            'stock_label' => $status->label(),
            'selectable' => $status->selectable(),
        ];
    }
}
