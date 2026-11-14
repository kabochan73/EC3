<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'order_number', 'status', 'subtotal', 'shipping_fee', 'total',
    'paid_at', 'shipped_at', 'cancelled_at',
    'ship_recipient_name', 'ship_postal_code', 'ship_prefecture', 'ship_city',
    'ship_address_line1', 'ship_address_line2', 'ship_phone',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'subtotal' => 'integer',
            'shipping_fee' => 'integer',
            'total' => 'integer',
            'paid_at' => 'datetime',
            'shipped_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /** @return Builder<Order> */
    public function scopeForUser(Builder $query, User $user): Builder
    {
        return $query->where('user_id', $user->id);
    }

    public function scopeRecentFirst(Builder $query): void
    {
        $query->orderByDesc('id');
    }

    public function getRouteKeyName(): string
    {
        return 'order_number';
    }
}
