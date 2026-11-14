<?php

namespace App\Http\Resources\Order;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 注文履歴の1行（docs/api/public.md GET /api/orders）。
 *
 * @mixin Order
 */
class OrderListResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'total' => $this->total,
            // 点数 = 明細のquantity合計（コントローラでwithSumしておく。明細なしは0）
            'item_count' => (int) ($this->items_quantity_total ?? 0),
            'placed_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
