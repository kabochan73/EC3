<?php

use App\Enums\UserRole;
use App\Models\User;

it('デフォルトではcustomerロールになる', function () {
    $user = User::factory()->create();

    expect($user->role)->toBe(UserRole::Customer);
});

it('adminファクトリステートでadminロールになる', function () {
    $user = User::factory()->admin()->create();

    expect($user->role)->toBe(UserRole::Admin);
});
