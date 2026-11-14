<?php

namespace App\Actions\Address;

use App\Models\Address;
use Illuminate\Support\Facades\DB;

/**
 * 住所の更新（docs/api/public.md PUT /api/addresses/{id}）。
 * is_default=trueにした場合は同ユーザーの他をfalse化。
 * 既にdefaultの住所をis_default=falseで更新しても外さない（defaultは必ず1件残す）。
 *
 * CreateAddressと同じく「先に他を外す→この住所をdefaultにして保存」の順
 * （部分UNIQUEインデックスaddresses_one_default_per_userに違反しないため）。
 */
final class UpdateAddress
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function execute(Address $address, array $attributes): Address
    {
        return DB::transaction(function () use ($address, $attributes) {
            $promote = ($attributes['is_default'] ?? false) && ! $address->is_default;

            unset($attributes['is_default']);
            $address->fill($attributes);

            if ($promote) {
                Address::where('user_id', $address->user_id)
                    ->whereKeyNot($address->id)
                    ->update(['is_default' => false]);

                $address->is_default = true;
            }

            $address->save();

            return $address;
        });
    }
}
