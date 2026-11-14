<?php

namespace App\Models;

use Database\Factories\AddressFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'recipient_name', 'postal_code', 'prefecture', 'city',
    'address_line1', 'address_line2', 'phone', 'is_default',
])]
class Address extends Model
{
    /** @use HasFactory<AddressFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** デフォルトを先頭に、以降は新しい順 */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderByDesc('is_default')->orderByDesc('id');
    }

    /** ordersのship_*スナップショット列にコピーする形へ */
    public function toShipmentSnapshot(): array
    {
        return [
            'ship_recipient_name' => $this->recipient_name,
            'ship_postal_code' => $this->postal_code,
            'ship_prefecture' => $this->prefecture,
            'ship_city' => $this->city,
            'ship_address_line1' => $this->address_line1,
            'ship_address_line2' => $this->address_line2,
            'ship_phone' => $this->phone,
        ];
    }
}
