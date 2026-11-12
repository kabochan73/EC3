<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;

function someProduct(): Product
{
    return Product::factory()->for(Category::factory()->create())->create();
}

it('バリアントを作成するとpositionが自動付与される', function () {
    $product = someProduct();
    ProductVariant::factory()->for($product)->create(['size' => 'S', 'position' => 0]);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson("/api/admin/products/{$product->id}/variants", [
            'size' => 'M', 'color' => null, 'sku' => 'EC-TP-M', 'stock' => 12,
        ])
        ->assertCreated()
        ->assertJsonPath('data.size', 'M')
        ->assertJsonPath('data.stock', 12)
        ->assertJsonPath('data.position', 1);
});

it('size+colorがnullで重複する組み合わせは拒否される', function () {
    $product = someProduct();
    ProductVariant::factory()->for($product)->create(['size' => 'M', 'color' => null]);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson("/api/admin/products/{$product->id}/variants", [
            'size' => 'M', 'color' => null, 'sku' => 'EC-TP-M2', 'stock' => 1,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('size');
});

it('同じsizeでも色が違えば作成できる', function () {
    $product = someProduct();
    ProductVariant::factory()->for($product)->create(['size' => 'M', 'color' => '黒']);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson("/api/admin/products/{$product->id}/variants", [
            'size' => 'M', 'color' => '白', 'sku' => 'EC-TP-M-WHT', 'stock' => 3,
        ])
        ->assertCreated();
});

it('重複したskuは拒否される', function () {
    $product = someProduct();
    ProductVariant::factory()->for($product)->create(['sku' => 'DUP-SKU']);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson("/api/admin/products/{$product->id}/variants", [
            'size' => 'L', 'color' => null, 'sku' => 'DUP-SKU', 'stock' => 1,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('sku');
});

it('stockとskuは更新できるがsizeは変更されない', function () {
    $product = someProduct();
    $variant = ProductVariant::factory()->for($product)->create(['size' => 'S', 'sku' => 'OLD', 'stock' => 5]);

    $this->actingAs(User::factory()->admin()->create())
        ->putJson("/api/admin/variants/{$variant->id}", [
            'size' => 'L', // 無視される
            'color' => '紺', 'sku' => 'NEW', 'stock' => 20,
        ])
        ->assertOk()
        ->assertJsonPath('data.size', 'S')
        ->assertJsonPath('data.sku', 'NEW')
        ->assertJsonPath('data.stock', 20);
});

it('更新後の色が兄弟バリアントと衝突する場合は拒否される', function () {
    $product = someProduct();
    ProductVariant::factory()->for($product)->create(['size' => 'M', 'color' => '黒']);
    $target = ProductVariant::factory()->for($product)->create(['size' => 'M', 'color' => '白']);

    $this->actingAs(User::factory()->admin()->create())
        ->putJson("/api/admin/variants/{$target->id}", [
            'color' => '黒', 'sku' => $target->sku, 'stock' => 1,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('color');
});

it('バリアントを削除できる', function () {
    $product = someProduct();
    $variant = ProductVariant::factory()->for($product)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->deleteJson("/api/admin/variants/{$variant->id}")
        ->assertNoContent();

    expect(ProductVariant::find($variant->id))->toBeNull();
});

it('商品詳細APIにimagesとvariantsが含まれる', function () {
    $product = someProduct();
    ProductVariant::factory()->for($product)->create(['size' => 'S', 'position' => 0]);
    ProductVariant::factory()->for($product)->create(['size' => 'M', 'position' => 1]);

    $this->actingAs(User::factory()->admin()->create())
        ->getJson("/api/admin/products/{$product->id}")
        ->assertOk()
        ->assertJsonCount(2, 'data.variants')
        ->assertJsonPath('data.variants.0.size', 'S')
        ->assertJsonStructure(['data' => ['variants' => [['id', 'size', 'color', 'sku', 'stock', 'position']], 'images']]);
});

it('非adminは403になる', function () {
    $product = someProduct();

    $this->actingAs(User::factory()->create())
        ->postJson("/api/admin/products/{$product->id}/variants", [
            'size' => 'M', 'sku' => 'X', 'stock' => 1,
        ])
        ->assertForbidden();
});
