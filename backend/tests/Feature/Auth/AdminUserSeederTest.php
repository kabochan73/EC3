<?php

use App\Enums\UserRole;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;

it('config/admin.phpの認証情報でadminユーザーを作成する', function () {
    $this->seed(AdminUserSeeder::class);

    $admin = User::where('email', config('admin.email'))->first();

    expect($admin)->not->toBeNull();
    expect($admin->role)->toBe(UserRole::Admin);
});

it('再実行してもユーザーが重複しない（冪等）', function () {
    $this->seed(AdminUserSeeder::class);
    $this->seed(AdminUserSeeder::class);

    $count = User::where('email', config('admin.email'))->count();

    expect($count)->toBe(1);
});
