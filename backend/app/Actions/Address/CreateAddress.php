<?php

namespace App\Actions\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * 住所の新規作成（docs/api/public.md POST /api/addresses）。
 * 最初の1件、またはis_default=true指定なら、その1件だけをdefaultにする。
 *
 * 順番が大事: 先に既存のdefaultを外してから新しい住所をdefaultで作る。
 * addressesには「defaultはユーザーごとに1件」の部分UNIQUEインデックスがあるので、
 * 逆順（作ってから外す）だと作った瞬間に2件になりDBに拒否される。
 */
final class CreateAddress
{
    /**
     * @param  array<string, mixed>  $attributes
     */
    public function execute(User $user, array $attributes): Address
    {
        return DB::transaction(function () use ($user, $attributes) {
            $makeDefault = ($attributes['is_default'] ?? false) || $user->addresses()->doesntExist();

            if ($makeDefault) {
                $user->addresses()->where('is_default', true)->update(['is_default' => false]);
            }

            return $user->addresses()->create([
                ...$attributes,
                'is_default' => $makeDefault,
            ]);
        });
    }
}
