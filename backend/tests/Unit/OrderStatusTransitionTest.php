<?php

use App\Enums\OrderStatus;

// 注文ステータスのstate machine（docs/backend/database-schema.md）。
// 許可する遷移だけを列挙し、5×5 = 25通りの組み合わせ全部を検証する
// （「禁止する遷移」を手で列挙すると漏れがあっても気づけないため、
//  許可リスト以外を自動で全部「禁止」として確かめる）。

const ALLOWED_ORDER_TRANSITIONS = [
    ['pending', 'paid'],
    ['pending', 'cancelled'],
    ['paid', 'shipped'],
    ['paid', 'cancelled'],
    ['shipped', 'completed'],
    ['shipped', 'cancelled'],
];

dataset('全ステータスの組み合わせ', function () {
    foreach (OrderStatus::cases() as $from) {
        foreach (OrderStatus::cases() as $to) {
            yield "{$from->value} → {$to->value}" => [$from, $to];
        }
    }
});

it('ドキュメント通りの遷移だけを許可する', function (OrderStatus $from, OrderStatus $to) {
    $allowed = in_array([$from->value, $to->value], ALLOWED_ORDER_TRANSITIONS, true);

    expect($from->canTransitionTo($to))->toBe($allowed);
})->with('全ステータスの組み合わせ');

it('completedとcancelledは終端状態', function () {
    expect(OrderStatus::Completed->isTerminal())->toBeTrue()
        ->and(OrderStatus::Cancelled->isTerminal())->toBeTrue()
        ->and(OrderStatus::Pending->isTerminal())->toBeFalse()
        ->and(OrderStatus::Paid->isTerminal())->toBeFalse()
        ->and(OrderStatus::Shipped->isTerminal())->toBeFalse();
});
