<?php

use App\Domain\Order\ShippingFeeCalculator;

// config('shop'): shipping_fee = 800 / free_shipping_threshold = 20000

it('しきい値未満は定額の送料がかかる', function () {
    $calculator = new ShippingFeeCalculator;

    expect($calculator->for(0))->toBe(800)
        ->and($calculator->for(19_999))->toBe(800);
});

it('しきい値以上は送料無料になる', function () {
    $calculator = new ShippingFeeCalculator;

    expect($calculator->for(20_000))->toBe(0)
        ->and($calculator->for(20_001))->toBe(0)
        ->and($calculator->for(999_999))->toBe(0);
});
