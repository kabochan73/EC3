<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * 在庫不足（docs/backend/database-schema.md 注文作成トランザクション / docs/api/public.md POST /api/orders）。
 * Actionはthrowするだけ。HTTPへの変換はここ。
 */
final class InsufficientStockException extends Exception
{
    /**
     * @param  list<array{variant_id:int, available:int}>  $shortages
     */
    public function __construct(public readonly array $shortages)
    {
        parent::__construct('Insufficient stock for one or more items.');
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => '在庫が不足している商品があります。',
            'errors' => ['items' => ['一部の商品の在庫が不足しています。']],
            'shortages' => $this->shortages,
        ], 422);
    }
}
