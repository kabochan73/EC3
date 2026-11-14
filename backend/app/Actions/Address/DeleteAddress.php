<?php

namespace App\Actions\Address;

use App\Models\Address;
use Illuminate\Support\Facades\DB;

/**
 * 住所の削除（docs/api/public.md DELETE /api/addresses/{id}）。
 * defaultを消したら、残っていれば直近の1件を新しいdefaultに昇格させる。
 */
final class DeleteAddress
{
    public function execute(Address $address): void
    {
        DB::transaction(function () use ($address) {
            $wasDefault = $address->is_default;
            $userId = $address->user_id;

            $address->delete();

            if ($wasDefault) {
                $next = Address::where('user_id', $userId)->orderByDesc('id')->first();
                $next?->forceFill(['is_default' => true])->save();
            }
        });
    }
}
