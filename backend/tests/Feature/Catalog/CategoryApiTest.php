<?php

use App\Models\Category;

it('position順でカテゴリ一覧を返す', function () {
    Category::factory()->create(['name' => 'Outerwear', 'slug' => 'outerwear', 'position' => 2]);
    Category::factory()->create(['name' => 'Tops', 'slug' => 'tops', 'position' => 0]);
    Category::factory()->create(['name' => 'Bottoms', 'slug' => 'bottoms', 'position' => 1]);

    $this->getJson('/api/categories')
        ->assertOk()
        ->assertJsonPath('data.0.slug', 'tops')
        ->assertJsonPath('data.1.slug', 'bottoms')
        ->assertJsonPath('data.2.slug', 'outerwear')
        ->assertJsonStructure(['data' => [['id', 'name', 'slug']]]);
});

it('カテゴリが0件でも空配列を返す', function () {
    $this->getJson('/api/categories')
        ->assertOk()
        ->assertJson(['data' => []]);
});
