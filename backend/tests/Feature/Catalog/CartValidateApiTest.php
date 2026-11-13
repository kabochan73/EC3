<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;

function aVariant(array $overrides = []): ProductVariant
{
    $product = Product::factory()->for(Category::factory()->create())->create();

    return ProductVariant::factory()->for($product)->create($overrides);
}

it('在庫・価格・商品情報をvariant_idsで渡した順に返す', function () {
    $variantA = aVariant(['size' => 'S', 'stock' => 3]);
    $variantB = aVariant(['size' => 'M', 'stock' => 8]);

    $this->getJson("/api/cart/validate?variant_ids[]={$variantB->id}&variant_ids[]={$variantA->id}")
        ->assertOk()
        ->assertJsonPath('data.0.variant_id', $variantB->id)
        ->assertJsonPath('data.1.variant_id', $variantA->id);
});

it('存在しないvariant_idはavailable falseのみ返す', function () {
    $this->getJson('/api/cart/validate?variant_ids[]=999999')
        ->assertOk()
        ->assertJsonPath('data.0', ['variant_id' => 999999, 'available' => false]);
});

it('商品が非公開のvariantはavailable falseになる', function () {
    $product = Product::factory()->unpublished()->create();
    $variant = ProductVariant::factory()->for($product)->create();

    $this->getJson("/api/cart/validate?variant_ids[]={$variant->id}")
        ->assertOk()
        ->assertJsonPath('data.0.available', false);
});

it('max_quantityは在庫と上限（10）の小さい方になる', function () {
    $low = aVariant(['stock' => 3]);
    $high = aVariant(['stock' => 50]);

    $response = $this->getJson("/api/cart/validate?variant_ids[]={$low->id}&variant_ids[]={$high->id}")
        ->assertOk();

    $response->assertJsonPath('data.0.max_quantity', 3);
    $response->assertJsonPath('data.1.max_quantity', 10);
});

it('商品画像のposition0をimage_urlとして返す', function () {
    $variant = aVariant();
    $variant->product->images()->create(['path' => 'products/1/a.jpg', 'alt' => '', 'position' => 0]);

    $this->getJson("/api/cart/validate?variant_ids[]={$variant->id}")
        ->assertOk()
        ->assertJsonPath('data.0.image_url', '/media/products/1/a.jpg');
});

it('variant_idsが無いと422になる', function () {
    $this->getJson('/api/cart/validate')->assertStatus(422);
});

it('variant_idsが101件だと422になる', function () {
    $ids = collect(range(1, 101))->map(fn ($i) => "variant_ids[]={$i}")->implode('&');

    $this->getJson("/api/cart/validate?{$ids}")->assertStatus(422);
});
