<?php

use App\Enums\StockStatus;

it('在庫0はsold_out', function () {
    expect(StockStatus::fromStock(0))->toBe(StockStatus::SoldOut);
});

it('在庫がlow_stock_threshold以下はlow_stock', function () {
    expect(StockStatus::fromStock(config('shop.low_stock_threshold')))->toBe(StockStatus::LowStock);
    expect(StockStatus::fromStock(1))->toBe(StockStatus::LowStock);
});

it('在庫がlow_stock_thresholdを超えるとin_stock', function () {
    expect(StockStatus::fromStock(config('shop.low_stock_threshold') + 1))->toBe(StockStatus::InStock);
});

it('sold_outだけselectableがfalse', function () {
    expect(StockStatus::SoldOut->selectable())->toBeFalse();
    expect(StockStatus::LowStock->selectable())->toBeTrue();
    expect(StockStatus::InStock->selectable())->toBeTrue();
});
