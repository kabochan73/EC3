<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // 管理者1人。認証情報はconfig/admin.php（＝.env）から。冪等（emailでupdateOrCreate）。
        User::updateOrCreate(
            ['email' => config('admin.email')],
            [
                'name' => config('admin.name'),
                'password' => Hash::make(config('admin.password')),
                'role' => UserRole::Admin,
            ],
        );
    }
}
