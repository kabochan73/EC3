<?php

use App\Models\SiteContent;
use Database\Seeders\SiteContentSeeder;

it('行が無いキーはallWithDefaultsでdefaultsを返す', function () {
    $contents = SiteContent::allWithDefaults();

    expect($contents)->toHaveKeys(['hero', 'concept', 'lookbook', 'about']);
    expect($contents['hero']['images'])->toBe([]);
});

it('DBに保存済みのキーはallWithDefaultsでその値を返す', function () {
    SiteContent::create(['key' => 'concept', 'data' => ['body' => 'カスタム本文']]);

    $contents = SiteContent::allWithDefaults();

    expect($contents['concept'])->toBe(['body' => 'カスタム本文']);
    expect($contents['hero']['headline'])->toBe(SiteContent::defaults('hero')['headline']);
});

it('SiteContentSeederは4キーを冪等に作成する', function () {
    $this->seed(SiteContentSeeder::class);
    $this->seed(SiteContentSeeder::class);

    expect(SiteContent::count())->toBe(4);
    expect(SiteContent::pluck('key')->sort()->values()->all())
        ->toBe(['about', 'concept', 'hero', 'lookbook']);
});

it('SiteContentSeederは既存の行を上書きしない', function () {
    SiteContent::create(['key' => 'concept', 'data' => ['body' => '管理画面で編集済み']]);

    $this->seed(SiteContentSeeder::class);

    expect(SiteContent::where('key', 'concept')->first()->data)
        ->toBe(['body' => '管理画面で編集済み']);
});
