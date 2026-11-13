<?php

namespace App\Http\Resources\Admin;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 管理向け会員（docs/api/admin.md）。閲覧のみ。
 *
 * order_countはフェーズ7で注文（Order）を実装するまでは常に0。
 * 実装後はコントローラ側でwithCount('orders')し、$this->orders_countを使う。
 *
 * @mixin User
 */
class CustomerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'orders_count' => 0,
            'joined_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
