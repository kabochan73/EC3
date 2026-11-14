<?php

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;

function addressPayload(array $overrides = []): array
{
    return array_merge([
        'recipient_name' => '田中 葵',
        'postal_code' => '150-0001',
        'prefecture' => '東京都',
        'city' => '渋谷区神宮前',
        'address_line1' => '1-2-3',
        'address_line2' => 'コーポ101',
        'phone' => '09012345678',
    ], $overrides);
}

it('本人の住所一覧をdefaultを先頭にして返す', function () {
    $user = User::factory()->create();
    Address::factory()->for($user)->create(['recipient_name' => 'B']);
    Address::factory()->for($user)->default()->create(['recipient_name' => 'A']);
    Address::factory()->create(); // 別ユーザー

    $this->actingAs($user)
        ->getJson('/api/addresses')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.recipient_name', 'A')
        ->assertJsonPath('data.0.is_default', true);
});

it('最初の1件は自動的にdefaultになる', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/addresses', addressPayload())
        ->assertCreated()
        ->assertJsonPath('data.is_default', true);
});

it('is_default=trueで作成すると新しい方がdefaultになり、他は外れる', function () {
    $user = User::factory()->create();
    $old = Address::factory()->for($user)->default()->create();

    $this->actingAs($user)
        ->postJson('/api/addresses', addressPayload(['is_default' => true]))
        ->assertCreated()
        ->assertJsonPath('data.is_default', true);

    expect($old->fresh()->is_default)->toBeFalse()
        ->and(Address::where('user_id', $user->id)->where('is_default', true)->count())->toBe(1);
});

it('郵便番号の形式が不正だと422になる', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/addresses', addressPayload(['postal_code' => '1500001']))
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('postal_code');
});

it('住所を更新できる', function () {
    $user = User::factory()->create();
    $address = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->putJson("/api/addresses/{$address->id}", addressPayload(['recipient_name' => '更新後']))
        ->assertOk()
        ->assertJsonPath('data.recipient_name', '更新後');
});

it('専用エンドポイントで住所をdefaultに設定できる', function () {
    $user = User::factory()->create();
    $a = Address::factory()->for($user)->default()->create();
    $b = Address::factory()->for($user)->create();

    $this->actingAs($user)
        ->postJson("/api/addresses/{$b->id}/default")
        ->assertOk()
        ->assertJsonPath('data.is_default', true);

    expect($a->fresh()->is_default)->toBeFalse();
});

it('defaultの住所を削除すると別の住所がdefaultに昇格する', function () {
    $user = User::factory()->create();
    $default = Address::factory()->for($user)->default()->create();
    $other = Address::factory()->for($user)->create();

    $this->actingAs($user)->deleteJson("/api/addresses/{$default->id}")->assertNoContent();

    expect($other->fresh()->is_default)->toBeTrue();
});

it('他人の住所への更新・削除・default設定は404になる', function () {
    $me = User::factory()->create();
    $theirs = Address::factory()->create();

    $this->actingAs($me)->putJson("/api/addresses/{$theirs->id}", addressPayload())->assertNotFound();
    $this->actingAs($me)->deleteJson("/api/addresses/{$theirs->id}")->assertNotFound();
    $this->actingAs($me)->postJson("/api/addresses/{$theirs->id}/default")->assertNotFound();
});

it('未ログインでは利用できない', function () {
    $this->getJson('/api/addresses')->assertUnauthorized();
    $this->postJson('/api/addresses', addressPayload())->assertUnauthorized();
});

it('2件目のdefaultはDBの部分UNIQUE制約が拒否する', function () {
    // Actionを通さずに2件目のdefaultを入れようとしても、部分UNIQUEインデックス
    // addresses_one_default_per_userが拒否する（DB制約は最後の防衛線）
    $user = User::factory()->create();
    Address::factory()->for($user)->default()->create();

    // テストはRefreshDatabaseのトランザクション内で動く。PostgreSQLは中で1回エラーが出ると
    // 以降のSQLを全部拒否するので、失敗させる部分だけDB::transaction（= セーブポイント）で包む
    expect(fn () => DB::transaction(fn () => Address::factory()->for($user)->default()->create()))
        ->toThrow(UniqueConstraintViolationException::class);

    // 別のユーザーならdefaultを持てる
    Address::factory()->default()->create();
    expect(Address::where('is_default', true)->count())->toBe(2);
});
