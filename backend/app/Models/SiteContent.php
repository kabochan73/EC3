<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

/**
 * トップページの編集可能コンテンツ（docs/backend/cms.md）。
 */
#[Fillable(['key', 'data', 'updated_by'])]
class SiteContent extends Model
{
    public const KEYS = ['hero', 'concept', 'lookbook', 'about'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'data' => 'array',
        ];
    }

    /**
     * DBに行が無いキーのプレースホルダ初期値。SiteContentSeederと同じ値。
     *
     * @return array<string, mixed>
     */
    public static function defaults(string $key): array
    {
        return match ($key) {
            'hero' => [
                'headline' => 'MINIMAL. TIMELESS.',
                'tagline' => 'Essentials for everyday wear.',
                'images' => [],
            ],
            'concept' => [
                'body' => "Quality over quantity.\nDesigned to last beyond seasons.",
            ],
            'lookbook' => [
                'images' => [],
            ],
            'about' => [
                'blocks' => [],
            ],
            default => throw new InvalidArgumentException("Unknown content key: {$key}"),
        };
    }

    /**
     * 4キー全部を、DBに行が無いものはdefaults()で埋めて返す
     * （docs/backend/cms.md GET /api/content・GET /api/admin/content）。
     *
     * @return array<string, mixed>
     */
    public static function allWithDefaults(): array
    {
        $rows = static::whereIn('key', self::KEYS)->pluck('data', 'key');

        return collect(self::KEYS)
            ->mapWithKeys(fn (string $key) => [$key => $rows->get($key) ?? self::defaults($key)])
            ->all();
    }
}
