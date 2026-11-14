<?php

namespace App\Domain\Order;

use App\Models\Order;
use RuntimeException;

/**
 * 注文番号の採番（docs/backend/database-schema.md）。形式EC-YYYYMMDD-NNNN（当日連番）。
 *
 * - 日付は日本時間。DB/アプリはUTCなのでnow()のままだとJST 0:00〜8:59の注文が前日の日付になる
 * - 当日の最大連番+1を使う。並行作成での衝突はorders.order_numberのUNIQUE制約が最終防衛線。
 *   ここでは数回、次の番号を試す
 */
final class OrderNumberGenerator
{
    private const MAX_ATTEMPTS = 20;

    public function generate(): string
    {
        $prefix = (string) config('shop.order_number_prefix');
        $date = now('Asia/Tokyo')->format('Ymd');

        $maxSequence = (int) Order::query()
            ->where('order_number', 'like', "{$prefix}-{$date}-%")
            ->pluck('order_number')
            ->map(fn (string $number) => (int) substr($number, -4))
            ->max();

        for ($sequence = $maxSequence + 1; $sequence <= $maxSequence + self::MAX_ATTEMPTS; $sequence++) {
            $candidate = sprintf('%s-%s-%04d', $prefix, $date, $sequence);

            // 読み取ってからここまでの間に、別リクエストが同じ番号を使ったかもしれない
            if (! Order::where('order_number', $candidate)->exists()) {
                return $candidate;
            }
        }

        throw new RuntimeException('注文番号の採番に失敗しました。');
    }
}
