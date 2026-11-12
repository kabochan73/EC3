<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;

it('非adminは403になる', function () {
    $this->actingAs(User::factory()->create())
        ->getJson('/api/admin/categories')
        ->assertForbidden();
});

it('未認証は401になる', function () {
    $this->getJson('/api/admin/categories')->assertUnauthorized();
});

it('position順で商品数込みの一覧を返す', function () {
    $tops = Category::factory()->create(['slug' => 'tops', 'position' => 1]);
    Category::factory()->create(['slug' => 'bottoms', 'position' => 0]);
    Product::factory()->for($tops)->count(2)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/admin/categories')
        ->assertOk()
        ->assertJsonPath('data.0.slug', 'bottoms')
        ->assertJsonPath('data.1.slug', 'tops')
        ->assertJsonPath('data.1.products_count', 2);
});

it('カテゴリを作成すると末尾に追加される', function () {
    Category::factory()->create(['slug' => 'tops', 'position' => 0]);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson('/api/admin/categories', ['name' => 'シューズ', 'slug' => 'shoes'])
        ->assertCreated()
        ->assertJsonPath('data.slug', 'shoes')
        ->assertJsonPath('data.position', 1);
});

it('作成時に重複したslugは拒否される', function () {
    Category::factory()->create(['slug' => 'tops']);

    $this->actingAs(User::factory()->admin()->create())
        ->postJson('/api/admin/categories', ['name' => 'トップス', 'slug' => 'tops'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('slug');
});

it('更新時は自分自身のslugをそのまま維持できる', function () {
    $category = Category::factory()->create(['slug' => 'tops', 'name' => 'トップス']);

    $this->actingAs(User::factory()->admin()->create())
        ->putJson("/api/admin/categories/{$category->id}", ['name' => '上半身', 'slug' => 'tops'])
        ->assertOk()
        ->assertJsonPath('data.name', '上半身');
});

it('商品が無いカテゴリは削除できる', function () {
    $category = Category::factory()->create(['slug' => 'tmp']);

    $this->actingAs(User::factory()->admin()->create())
        ->deleteJson("/api/admin/categories/{$category->id}")
        ->assertNoContent();

    expect(Category::find($category->id))->toBeNull();
});

it('商品が残っているカテゴリの削除は409になる', function () {
    $category = Category::factory()->create(['slug' => 'tops']);
    Product::factory()->for($category)->create();

    $this->actingAs(User::factory()->admin()->create())
        ->deleteJson("/api/admin/categories/{$category->id}")
        ->assertStatus(409);

    expect(Category::find($category->id))->not->toBeNull();
});

it('カテゴリの並び順を入れ替えられる', function () {
    $a = Category::factory()->create(['slug' => 'a', 'position' => 0]);
    $b = Category::factory()->create(['slug' => 'b', 'position' => 1]);
    $c = Category::factory()->create(['slug' => 'c', 'position' => 2]);

    $this->actingAs(User::factory()->admin()->create())
        ->putJson('/api/admin/categories/reorder', ['order' => [$c->id, $a->id, $b->id]])
        ->assertOk()
        ->assertJsonPath('data.0.slug', 'c')
        ->assertJsonPath('data.1.slug', 'a');

    expect($c->fresh()->position)->toBe(0)
        ->and($b->fresh()->position)->toBe(2);
});
