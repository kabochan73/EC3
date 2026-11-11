<?php

namespace Database\Seeders;

use App\Models\SiteContent;
use Illuminate\Database\Seeder;

class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        // 行が既にあれば何もしない（管理画面で編集した内容をseedで上書きしない。docs/backend/cms.md）。
        foreach (SiteContent::KEYS as $key) {
            SiteContent::firstOrCreate(['key' => $key], ['data' => SiteContent::defaults($key)]);
        }
    }
}
