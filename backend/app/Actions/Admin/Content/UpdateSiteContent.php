<?php

namespace App\Actions\Admin\Content;

use App\Models\SiteContent;
use App\Models\User;

/**
 * CMSコンテンツの更新（docs/api/admin.md PUT /api/admin/content/{key}）。
 * dataを丸ごと差し替え、updated_byに現在のadminを記録する。
 */
final class UpdateSiteContent
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(string $key, array $data, User $admin): SiteContent
    {
        return SiteContent::updateOrCreate(
            ['key' => $key],
            ['data' => $data, 'updated_by' => $admin->id],
        );
    }
}
