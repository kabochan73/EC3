<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('s3');
});

function aProduct(): Product
{
    return Product::factory()->for(Category::factory()->create())->create();
}

it('画像をアップロードしてオブジェクト保存と行作成がされる', function () {
    $product = aProduct();

    $res = $this->actingAs(User::factory()->admin()->create())
        ->postJson("/api/admin/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->create('front.jpg', 200, 'image/jpeg'),
            'alt' => '正面',
        ])
        ->assertCreated()
        ->assertJsonPath('data.position', 0)
        ->assertJsonPath('data.alt', '正面');

    $image = $product->images()->first();
    expect($image)->not->toBeNull();
    Storage::disk('s3')->assertExists($image->path);
    expect($res->json('data.url'))->toBe('/media/'.$image->path);
});

it('既存の画像の後ろに追加される', function () {
    $product = aProduct();
    ProductImage::factory()->for($product)->create(['position' => 0]);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson("/api/admin/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->create('back.jpg', 200, 'image/jpeg'),
        ])
        ->assertCreated()
        ->assertJsonPath('data.position', 1);
});

it('画像以外のファイルは422になる', function () {
    $product = aProduct();

    $this->actingAs(User::factory()->admin()->create())
        ->postJson("/api/admin/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('image');
});

it('並び順を入れ替えられ、一部だけ渡すと422になる', function () {
    $product = aProduct();
    $a = ProductImage::factory()->for($product)->create(['position' => 0]);
    $b = ProductImage::factory()->for($product)->create(['position' => 1]);
    $c = ProductImage::factory()->for($product)->create(['position' => 2]);

    $this->actingAs(User::factory()->admin()->create())
        ->putJson("/api/admin/products/{$product->id}/images/reorder", ['order' => [$c->id, $a->id, $b->id]])
        ->assertOk()
        ->assertJsonPath('data.0.id', $c->id);

    expect($c->fresh()->position)->toBe(0)
        ->and($b->fresh()->position)->toBe(2);

    $this->actingAs(User::factory()->admin()->create())
        ->putJson("/api/admin/products/{$product->id}/images/reorder", ['order' => [$a->id, $b->id]])
        ->assertStatus(422);
});

it('他の商品の画像が混ざった並び替えは422になる', function () {
    $product = aProduct();
    $mine = ProductImage::factory()->for($product)->create(['position' => 0]);
    $other = ProductImage::factory()->for(aProduct())->create();

    $this->actingAs(User::factory()->admin()->create())
        ->putJson("/api/admin/products/{$product->id}/images/reorder", ['order' => [$mine->id, $other->id]])
        ->assertStatus(422);
});

it('画像を削除するとオブジェクトも削除される', function () {
    $product = aProduct();
    Storage::disk('s3')->put('products/1/keep.jpg', 'x');
    $image = ProductImage::factory()->for($product)->create(['path' => 'products/1/keep.jpg']);

    $this->actingAs(User::factory()->admin()->create())
        ->deleteJson("/api/admin/product-images/{$image->id}")
        ->assertNoContent();

    expect(ProductImage::find($image->id))->toBeNull();
    Storage::disk('s3')->assertMissing('products/1/keep.jpg');
});

it('非adminは403になる', function () {
    $product = aProduct();

    $this->actingAs(User::factory()->create())
        ->postJson("/api/admin/products/{$product->id}/images", [
            'image' => UploadedFile::fake()->create('x.jpg', 200, 'image/jpeg'),
        ])
        ->assertForbidden();
});
