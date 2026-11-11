<?php

use App\Models\SiteContent;
use App\Models\User;

it('adminは4キー全部をデフォルトで補完して取得できる', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/admin/content')
        ->assertOk()
        ->assertJsonStructure(['data' => ['hero', 'concept', 'lookbook', 'about']]);
});

it('保存済みのキーはその値を返す', function () {
    SiteContent::create(['key' => 'concept', 'data' => ['body' => 'カスタム本文']]);

    $this->actingAs(User::factory()->admin()->create())
        ->getJson('/api/admin/content')
        ->assertOk()
        ->assertJsonPath('data.concept.body', 'カスタム本文');
});

it('非adminは403になる', function () {
    $this->actingAs(User::factory()->create())
        ->getJson('/api/admin/content')
        ->assertStatus(403);
});

it('未認証は401になる', function () {
    $this->getJson('/api/admin/content')->assertUnauthorized();
});

it('Acceptヘッダが無い未認証リクエストでも500にならずJSONの401を返す', function () {
    // Authenticateミドルウェアはexpects JSONでない場合route('login')へのリダイレクトを
    // 試みるが、APIのみのアプリにはnamed route 'login'が無く500になる罠がある
    // （bootstrap/app.phpのredirectGuestsToで回避）。
    $this->get('/api/admin/content')->assertUnauthorized();
});
