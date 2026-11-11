<?php

use App\Models\SiteContent;

it('4キー全部をデフォルトで補完して返す', function () {
    $this->getJson('/api/content')
        ->assertOk()
        ->assertJsonStructure(['data' => ['hero', 'concept', 'lookbook', 'about']])
        ->assertJsonPath('data.hero.images', []);
});

it('保存済みのキーはその値を返す', function () {
    SiteContent::create(['key' => 'concept', 'data' => ['body' => 'カスタム本文']]);

    $this->getJson('/api/content')
        ->assertOk()
        ->assertJsonPath('data.concept.body', 'カスタム本文');
});
