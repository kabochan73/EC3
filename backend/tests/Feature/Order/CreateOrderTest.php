<?php

use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;

/**
 * @return array{0: User, 1: ProductVariant}
 */
function customerWithVariant(int $stock = 10, int $price = 12_000): array
{
    $user = User::factory()->create();
    $category = Category::factory()->create(['slug' => 'tops']);
    $product = Product::factory()->for($category)->create(['price' => $price]);
    $variant = ProductVariant::factory()->for($product)->create(['size' => 'M', 'stock' => $stock]);

    return [$user, $variant];
}

function newAddressPayload(): array
{
    return [
        'recipient_name' => '田中 葵',
        'postal_code' => '150-0001',
        'prefecture' => '東京都',
        'city' => '渋谷区',
        'address_line1' => '1-2-3',
        'phone' => '09012345678',
    ];
}

it('pendingの注文を作成し在庫を引き当てる', function () {
    [$user, $variant] = customerWithVariant(stock: 10, price: 6_000);

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 2]],
            'address' => newAddressPayload(),
        ])
        ->assertCreated()
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.subtotal', 12_000)
        ->assertJsonPath('data.shipping_fee', 800)
        ->assertJsonPath('data.total', 12_800)
        ->assertJsonPath('data.items.0.quantity', 2)
        ->assertJsonPath('data.shipping_address.recipient_name', '田中 葵')
        ->assertJsonPath('data.order_number', fn ($n) => str_starts_with((string) $n, 'EC-'));

    expect($variant->fresh()->stock)->toBe(8)
        ->and($user->orders()->first()->status)->toBe(OrderStatus::Pending);
});

it('小計がしきい値以上なら送料無料になる', function () {
    [$user, $variant] = customerWithVariant(stock: 10, price: 20_000);

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'address' => newAddressPayload(),
        ])
        ->assertCreated()
        ->assertJsonPath('data.shipping_fee', 0)
        ->assertJsonPath('data.total', 20_000);
});

it('在庫不足なら422でロールバックされる', function () {
    [$user, $variant] = customerWithVariant(stock: 1);

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 5]],
            'address' => newAddressPayload(),
        ])
        ->assertStatus(422)
        ->assertJsonPath('shortages.0.variant_id', $variant->id)
        ->assertJsonPath('shortages.0.available', 1);

    expect($variant->fresh()->stock)->toBe(1)
        ->and($user->orders()->count())->toBe(0);
});

it('非公開商品が含まれると422になる', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['slug' => 'tops']);
    $product = Product::factory()->for($category)->unpublished()->create();
    $variant = ProductVariant::factory()->for($product)->create(['stock' => 10]);

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'address' => newAddressPayload(),
        ])
        ->assertStatus(422)
        ->assertJsonPath('unavailable_product_ids.0', $product->id);

    expect($user->orders()->count())->toBe(0);
});

it('クライアントが送った金額は無視しサーバーで再計算する', function () {
    [$user, $variant] = customerWithVariant(stock: 10, price: 12_000);

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'address' => newAddressPayload(),
            'subtotal' => 1,
            'total' => 1,
            'shipping_fee' => 0,
        ])
        ->assertCreated()
        ->assertJsonPath('data.subtotal', 12_000)
        ->assertJsonPath('data.total', 12_800);
});

it('保存済みの住所をidで指定できる', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['slug' => 'tops']);
    $product = Product::factory()->for($category)->create(['price' => 10_000]);
    $variant = ProductVariant::factory()->for($product)->create(['stock' => 5]);
    $address = Address::factory()->for($user)->create(['recipient_name' => '保存済み 太郎']);

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'address_id' => $address->id,
        ])
        ->assertCreated()
        ->assertJsonPath('data.shipping_address.recipient_name', '保存済み 太郎');
});

it('他人の住所idは拒否される', function () {
    [$user, $variant] = customerWithVariant();
    $theirs = Address::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'address_id' => $theirs->id,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('address_id');
});

it('save_address=trueなら新規住所を住所録に保存する', function () {
    [$user, $variant] = customerWithVariant();

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'address' => newAddressPayload(),
            'save_address' => true,
        ])
        ->assertCreated();

    expect($user->addresses()->count())->toBe(1)
        ->and($user->addresses()->first()->is_default)->toBeTrue();
});

it('指定しなければ新規住所は保存されない', function () {
    [$user, $variant] = customerWithVariant();

    $this->actingAs($user)
        ->postJson('/api/orders', [
            'items' => [['variant_id' => $variant->id, 'quantity' => 1]],
            'address' => newAddressPayload(),
        ])
        ->assertCreated();

    expect($user->addresses()->count())->toBe(0);
});

it('未ログインでは利用できない', function () {
    $this->postJson('/api/orders', [])->assertUnauthorized();
});
