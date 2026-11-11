<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

// GD拡張はこのPHPイメージに同梱されていない（docs/infra/local-dev.md。画像リサイズはしない
// ため不要）ため、UploadedFile::fake()->image()は使えない。create()でmimeTypeを明示する。
function fakeImage(string $name = 'hero.jpg', int $kilobytes = 100): UploadedFile
{
    return UploadedFile::fake()->create($name, $kilobytes, 'image/jpeg');
}

it('画像をアップロードしてURLを返し、バケットに保存される', function () {
    Storage::fake('s3');

    $response = $this->actingAs(User::factory()->admin()->create())
        ->postJson('/api/admin/content/hero/images', ['image' => fakeImage()])
        ->assertOk()
        ->assertJsonStructure(['url']);

    $url = $response->json('url');
    expect($url)->toStartWith('/media/content/hero/');

    $key = Str::after($url, '/media/');
    Storage::disk('s3')->assertExists($key);
});

it('画像以外のファイルは422になる', function () {
    Storage::fake('s3');

    $this->actingAs(User::factory()->admin()->create())
        ->postJson('/api/admin/content/hero/images', [
            'image' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('image');
});

it('5MBを超える画像は422になる', function () {
    Storage::fake('s3');

    $this->actingAs(User::factory()->admin()->create())
        ->postJson('/api/admin/content/hero/images', ['image' => fakeImage('big.jpg', 6000)])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('image');
});

it('不正なkeyは404になる', function () {
    Storage::fake('s3');

    $this->actingAs(User::factory()->admin()->create())
        ->postJson('/api/admin/content/foo/images', ['image' => fakeImage()])
        ->assertStatus(404);
});

it('非adminは403になる', function () {
    Storage::fake('s3');

    $this->actingAs(User::factory()->create())
        ->postJson('/api/admin/content/hero/images', ['image' => fakeImage()])
        ->assertStatus(403);
});
