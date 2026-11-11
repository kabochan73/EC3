<?php

use App\Models\SiteContent;
use App\Models\User;

it('heroを更新でき、updated_byがセットされる', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->putJson('/api/admin/content/hero', [
            'headline' => '新しい見出し',
            'tagline' => '新しいタグライン',
            'images' => [['url' => '/media/content/hero/01.jpg', 'alt' => null]],
        ])
        ->assertOk()
        ->assertJsonPath('data.headline', '新しい見出し');

    $content = SiteContent::where('key', 'hero')->first();
    expect($content->updated_by)->toBe($admin->id);
});

it('conceptはbodyが必須', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->putJson('/api/admin/content/concept', [])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('body');
});

it('heroはheadlineとimages.*.urlが必須', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->putJson('/api/admin/content/hero', [
            'tagline' => 'タグライン',
            'images' => [['alt' => 'no url here']],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['headline', 'images.0.url']);
});

it('不正なkeyは404になる', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->putJson('/api/admin/content/foo', ['body' => 'x'])
        ->assertStatus(404);
});

it('非adminは403になる', function () {
    $this->actingAs(User::factory()->create())
        ->putJson('/api/admin/content/concept', ['body' => 'x'])
        ->assertStatus(403);
});

it('既存のdataを完全に差し替える', function () {
    SiteContent::create(['key' => 'lookbook', 'data' => ['images' => [['url' => '/old.jpg', 'alt' => null]]]]);

    $this->actingAs(User::factory()->admin()->create())
        ->putJson('/api/admin/content/lookbook', [
            'images' => [['url' => '/new.jpg', 'alt' => '新しい画像']],
        ])
        ->assertOk();

    $content = SiteContent::where('key', 'lookbook')->first();
    expect($content->data['images'])->toHaveCount(1);
    expect($content->data['images'][0]['url'])->toBe('/new.jpg');
    expect($content->data['images'][0]['alt'])->toBe('新しい画像');
});
