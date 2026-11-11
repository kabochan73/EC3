<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * - AdminUserSeeder … 管理者アカウント1人
     *
     * カテゴリ・CMS・商品のシーダーはそれぞれの機能を作るフェーズで追加する。
     * 冪等（updateOrCreate）。ダミー顧客は手動投入する。
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
        ]);
    }
}
