<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

function productPayload(Category $category, array $overrides = []): array
{
    return array_merge([
        'category_id' => $category->id,
        'name' => 'ボクシーTシャツ',
        'slug' => 'boxy-tee',
        'price' => 12_000,
        'description' => '無駄をそぎ落とした定番。',
        'material' => '本体 綿100%',
        'care' => '洗濯機可',
        'origin' => '日本',
        'product_code' => 'EC-TP0001',
        'size_chart' => null,
        'is_published' => true,
    ], $overrides);
}

it('非adminは403になる', function () {
    $this->actingAs(User::factory()->create())
        ->getJson('/api/admin/products')
        ->assertForbidden();
});

it('未公開も含めて在庫合計付きで一覧を返す', function () {
    $category = Category::factory()->create(['slug' => 'tops']);
    $published = Product::factory()->for($category)->create(['name' => '表示中', 'position' => 0]);
    ProductVariant::factory()->for($published)->create(['size' => 'S', 'stock' => 4]);
    ProductVariant::factory()->for($published)->create(['size' => 'M', 'stock' => 6]);
    Product::factory()->for($category)->unpublished()->create(['name' => '非公開', 'position' => 1]);

    $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/admin/products')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.total_stock', 10)
        ->assertJsonPath('data.0.variant_count', 2);
});

it('名前の部分一致検索とカテゴリ絞り込みができる', function () {
    $tops = Category::factory()->create(['slug' => 'tops']);
    $bottoms = Category::factory()->create(['slug' => 'bottoms']);
    Product::factory()->for($tops)->create(['name' => 'リネンシャツ']);
    Product::factory()->for($tops)->create(['name' => 'ウールセーター']);
    Product::factory()->for($bottoms)->create(['name' => 'リネンパンツ']);

    $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/admin/products?q=リネン')
        ->assertOk()
        ->assertJsonCount(2, 'data');

    $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/admin/products?category=bottoms')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('商品を作成すると末尾のpositionになる', function () {
    $category = Category::factory()->create(['slug' => 'tops']);
    Product::factory()->for($category)->create(['position' => 5]);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson('/api/admin/products', productPayload($category))
        ->assertCreated()
        ->assertJsonPath('data.slug', 'boxy-tee')
        ->assertJsonPath('data.position', 6);
});

it('重複したslugは拒否される', function () {
    $category = Category::factory()->create(['slug' => 'tops']);
    Product::factory()->for($category)->create(['slug' => 'boxy-tee']);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson('/api/admin/products', productPayload($category, ['slug' => 'boxy-tee']))
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('slug');
});

it('存在しないcategory_idは拒否される', function () {
    $category = Category::factory()->create(['slug' => 'tops']);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson('/api/admin/products', productPayload($category, ['category_id' => 99999]))
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('category_id');
});

it('編集フォーム用に生の値を返す', function () {
    $category = Category::factory()->create(['slug' => 'tops']);
    $product = Product::factory()->for($category)->create(['is_published' => false]);

    $this->actingAs(User::factory()->admin()->create())
        ->getJson("/api/admin/products/{$product->id}")
        ->assertOk()
        ->assertJsonPath('data.category_id', $category->id)
        ->assertJsonPath('data.is_published', false);
});

it('商品を更新できる', function () {
    $category = Category::factory()->create(['slug' => 'tops']);
    $product = Product::factory()->for($category)->create(['slug' => 'boxy-tee', 'name' => '旧名称']);

    $this->actingAs(User::factory()->admin()->create())
        ->putJson("/api/admin/products/{$product->id}", productPayload($category, ['name' => '新名称']))
        ->assertOk()
        ->assertJsonPath('data.name', '新名称');
});

it('商品を削除するとバケットの画像も削除される', function () {
    Storage::fake('s3');

    $category = Category::factory()->create(['slug' => 'tops']);
    $product = Product::factory()->for($category)->create();
    $image = $product->images()->create(['path' => "products/{$product->id}/a.jpg", 'alt' => '', 'position' => 0]);
    Storage::disk('s3')->put($image->path, 'dummy');

    $this->actingAs(User::factory()->admin()->create())
        ->deleteJson("/api/admin/products/{$product->id}")
        ->assertNoContent();

    expect(Product::find($product->id))->toBeNull();
    Storage::disk('s3')->assertMissing($image->path);
});
