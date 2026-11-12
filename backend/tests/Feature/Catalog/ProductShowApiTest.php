<?php

use App\Models\Category;
use App\Models\Product;

it('公開商品の詳細を返す', function () {
    $category = Category::factory()->create(['name' => 'トップス', 'slug' => 'tops']);
    $product = Product::factory()->for($category)->create(['name' => 'Tシャツ', 'slug' => 't-shirt']);
    $product->images()->create(['path' => 'products/1/a.jpg', 'alt' => '', 'position' => 0]);
    $product->variants()->create([
        'size' => 'S', 'color' => '白', 'sku' => 'SKU-1', 'stock' => 2, 'position' => 0,
    ]);
    $product->variants()->create([
        'size' => 'M', 'color' => null, 'sku' => 'SKU-2', 'stock' => 3, 'position' => 1,
    ]);

    $this->getJson("/api/products/{$product->slug}")
        ->assertOk()
        ->assertJsonPath('data.name', 'Tシャツ')
        ->assertJsonPath('data.slug', 't-shirt')
        ->assertJsonPath('data.category.slug', 'tops')
        ->assertJsonCount(1, 'data.images')
        ->assertJsonCount(2, 'data.variants')
        ->assertJsonPath('data.colors', ['白']);
});

it('未公開商品のslugは404になる', function () {
    $product = Product::factory()->unpublished()->create(['slug' => 'hidden-item']);

    $this->getJson("/api/products/{$product->slug}")->assertNotFound();
});

it('存在しないslugは404になる', function () {
    $this->getJson('/api/products/not-exists')->assertNotFound();
});

it('relatedは同カテゴリの他の公開商品をposition順で返し自分自身は含まない', function () {
    $category = Category::factory()->create();
    $other = Category::factory()->create();

    $product = Product::factory()->for($category)->create(['position' => 1]);
    $relatedA = Product::factory()->for($category)->create(['position' => 0, 'name' => 'A']);
    $relatedB = Product::factory()->for($category)->create(['position' => 2, 'name' => 'B']);
    Product::factory()->for($category)->unpublished()->create(['position' => 0]);
    Product::factory()->for($other)->create();

    $this->getJson("/api/products/{$product->slug}")
        ->assertOk()
        ->assertJsonCount(2, 'data.related')
        ->assertJsonPath('data.related.0.name', 'A')
        ->assertJsonPath('data.related.1.name', 'B');
});
