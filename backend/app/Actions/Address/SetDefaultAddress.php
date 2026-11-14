<?php

namespace App\Actions\Address;

use App\Models\Address;
use Illuminate\Support\Facades\DB;

/**
 * 住所をデフォルトに設定（docs/api/public.md POST /api/addresses/{id}/default）。
 */
final class SetDefaultAddress
{
    public function execute(Address $address): Address
    {
        return DB::transaction(function () use ($address) {
            Address::where('user_id', $address->user_id)
                ->whereKeyNot($address->id)
                ->update(['is_default' => false]);

            $address->forceFill(['is_default' => true])->save();

            return $address;
        });
    }
}
