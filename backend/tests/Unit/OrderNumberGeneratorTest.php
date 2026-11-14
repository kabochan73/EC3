<?php

use App\Domain\Order\OrderNumberGenerator;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

// 採番はDBの当日分を見るのでRefreshDatabaseを使う。
// 時刻はすべて日本時間で指定する（採番の日付はJST）

uses(RefreshDatabase::class);

function travelToJst(string $datetime): void
{
    Carbon::setTestNow(Carbon::parse($datetime, 'Asia/Tokyo'));
}

it('その日最初の注文はEC-YYYYMMDD-0001になる', function () {
    travelToJst('2026-09-08 10:00:00');

    expect((new OrderNumberGenerator)->generate())->toBe('EC-20260908-0001');
});

it('当日の連番をインクリメントする', function () {
    travelToJst('2026-09-08 10:00:00');
    $user = User::factory()->create();
    Order::factory()->for($user)->create(['order_number' => 'EC-20260908-0001']);
    Order::factory()->for($user)->create(['order_number' => 'EC-20260908-0002']);

    expect((new OrderNumberGenerator)->generate())->toBe('EC-20260908-0003');
});

it('日付が変わると連番がリセットされる', function () {
    $user = User::factory()->create();
    travelToJst('2026-09-08 23:59:00');
    Order::factory()->for($user)->create(['order_number' => 'EC-20260908-0007']);

    travelToJst('2026-09-09 00:01:00');

    expect((new OrderNumberGenerator)->generate())->toBe('EC-20260909-0001');
});

it('UTCではまだ前日でも日本時間の日付を使う', function () {
    // JST 2026-09-09 08:30 = UTC 2026-09-08 23:30
    travelToJst('2026-09-09 08:30:00');

    expect(now()->utc()->format('Ymd'))->toBe('20260908')
        ->and((new OrderNumberGenerator)->generate())->toBe('EC-20260909-0001');
});

it('連番に欠番があっても最大値の次から採番する', function () {
    travelToJst('2026-09-08 10:00:00');
    $user = User::factory()->create();
    // 連番が飛んでいる（0001が無く0002だけ）状況でも衝突しない番号を返す
    Order::factory()->for($user)->create(['order_number' => 'EC-20260908-0002']);

    expect((new OrderNumberGenerator)->generate())->toBe('EC-20260908-0003');
});

afterEach(fn () => Carbon::setTestNow());
