<?php

use App\Models\User;

it('customerロールのみ一覧に表示する', function () {
    User::factory()->create(['name' => 'あおい']);
    User::factory()->create(['name' => 'れん']);
    User::factory()->admin()->create(['name' => 'ボス']); // 除外される

    $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/admin/customers')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonStructure(['data' => [['id', 'name', 'email', 'orders_count', 'joined_at']]]);
});

it('注文がまだ無いのでorders_countは常に0', function () {
    User::factory()->create(['name' => 'あおい']);

    $response = $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/admin/customers')
        ->assertOk();

    $aoi = collect($response->json('data'))->firstWhere('name', 'あおい');
    expect($aoi['orders_count'])->toBe(0);
});

it('名前またはメールアドレスで検索できる', function () {
    User::factory()->create(['name' => '田中あおい', 'email' => 'aoi@example.com']);
    User::factory()->create(['name' => '鈴木れん', 'email' => 'ren@example.jp']);

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->getJson('/api/admin/customers?q=aoi')->assertJsonCount(1, 'data');
    $this->actingAs($admin)->getJson('/api/admin/customers?q=example.jp')->assertJsonCount(1, 'data');
});

it('非adminは403になる', function () {
    $this->actingAs(User::factory()->create())
        ->getJson('/api/admin/customers')
        ->assertForbidden();
});

it('会員1人の情報を取得できる', function () {
    $customer = User::factory()->create(['name' => 'あおい', 'email' => 'aoi@example.com']);

    $this->actingAs(User::factory()->admin()->create())
        ->getJson("/api/admin/customers/{$customer->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $customer->id)
        ->assertJsonPath('data.email', 'aoi@example.com')
        ->assertJsonPath('data.orders_count', 0);
});

it('管理者のidを指定すると404になる', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->getJson("/api/admin/customers/{$admin->id}")
        ->assertNotFound();
});

it('showも非adminは403になる', function () {
    $customer = User::factory()->create();

    $this->actingAs(User::factory()->create())
        ->getJson("/api/admin/customers/{$customer->id}")
        ->assertForbidden();
});
