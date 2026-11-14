<?php

namespace App\Domain\Order;

/**
 * 送料の計算（docs/backend/database-schema.md）。
 * Eloquent非依存の純粋ロジック。注文作成時とPaymentIntent作成時の両方で使う。
 */
final class ShippingFeeCalculator
{
    public function for(int $subtotal): int
    {
        return $subtotal >= (int) config('shop.free_shipping_threshold')
            ? 0
            : (int) config('shop.shipping_fee');
    }
}
