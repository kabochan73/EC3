<?php

use App\Models\Category;
use App\Models\Product;

it('公開商品のみをposition順で返す', function () {
    Product::factory()->create(['position' => 1, 'name' => 'B']);
    Product::factory()->create(['position' => 0, 'name' => 'A']);
    Product::factory()->unpublished()->create(['name' => '非公開']);

    $this->getJson('/api/products')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.name', 'A')
        ->assertJsonPath('data.1.name', 'B');
});

it('categoryクエリでカテゴリslug絞り込みができる', function () {
    $tops = Category::factory()->create(['slug' => 'tops']);
    $bottoms = Category::factory()->create(['slug' => 'bottoms']);
    Product::factory()->for($tops)->create(['name' => 'Tシャツ']);
    Product::factory()->for($bottoms)->create(['name' => 'パンツ']);

    $this->getJson('/api/products?category=tops')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', 'Tシャツ');
});

it('newクエリで作成30日以内の商品を新着順で返す', function () {
    $old = Product::factory()->create(['name' => '古い商品']);
    $old->forceFill(['created_at' => now()->subDays(40)])->save();
    Product::factory()->create(['name' => '新しい商品']);

    $this->getJson('/api/products?new=true')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.name', '新しい商品');
});

it('limitクエリで件数上限をかけられる', function () {
    Product::factory()->count(3)->create();

    $this->getJson('/api/products?limit=2')
        ->assertOk()
        ->assertJsonCount(2, 'data');
});

it('stock_statusはvariant合算で算出される', function () {
    $product = Product::factory()->create();
    $product->variants()->create([
        'size' => 'S', 'color' => null, 'sku' => 'SKU-1', 'stock' => 2, 'position' => 0,
    ]);
    $product->variants()->create([
        'size' => 'M', 'color' => null, 'sku' => 'SKU-2', 'stock' => 3, 'position' => 1,
    ]);

    $this->getJson('/api/products')
        ->assertOk()
        ->assertJsonPath('data.0.stock_status', 'low_stock');
});

it('存在しないカテゴリslugは422になる', function () {
    $this->getJson('/api/products?category=unknown')->assertStatus(422);
});
