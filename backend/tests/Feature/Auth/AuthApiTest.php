<?php

use App\Enums\UserRole;
use App\Models\User;
use Tests\TestCase;

// statefulApi()はOrigin/Refererヘッダがfrontend（docs/backend/auth.md）と一致する
// リクエストのみセッションを張る。実ブラウザは常にOriginを送るのでテストでも明示する。
function fromFrontend(): TestCase
{
    return test()->withHeaders(['Origin' => 'http://localhost:3000']);
}

it('有効な情報で会員登録でき、セッションが確立される', function () {
    fromFrontend()->postJson('/api/register', [
        'name' => 'Aoi Tanaka',
        'email' => 'aoi@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
    ])
        ->assertCreated()
        ->assertJsonPath('data.email', 'aoi@example.com')
        ->assertJsonPath('data.role', 'customer')
        ->assertJsonStructure(['data' => ['id', 'name', 'email', 'role']]);

    $this->assertAuthenticated();

    $user = User::where('email', 'aoi@example.com')->firstOrFail();
    expect($user->role)->toBe(UserRole::Customer);
});

it('重複したメールアドレスでは登録できない', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/register', [
        'name' => 'X',
        'email' => 'taken@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('email');
});

it('確認が一致しない・短すぎるパスワードでは登録できない', function () {
    $this->postJson('/api/register', [
        'name' => 'X', 'email' => 'x@example.com',
        'password' => 'short', 'password_confirmation' => 'nope',
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('password');
});

it('正しい認証情報でログインできる', function () {
    User::factory()->create(['email' => 'me@example.com', 'password' => bcrypt('correct-horse')]);

    fromFrontend()->postJson('/api/login', ['email' => 'me@example.com', 'password' => 'correct-horse'])
        ->assertOk()
        ->assertJsonPath('data.email', 'me@example.com');

    $this->assertAuthenticated();
});

it('パスワードが違うとログインは拒否される', function () {
    User::factory()->create(['email' => 'me@example.com', 'password' => bcrypt('correct-horse')]);

    $this->postJson('/api/login', ['email' => 'me@example.com', 'password' => 'wrong'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('email');

    $this->assertGuest();
});

it('存在しないメールアドレスでもアカウントの有無を漏らさない', function () {
    $this->postJson('/api/login', ['email' => 'ghost@example.com', 'password' => 'whatever'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('email');
});

it('ログイン失敗を繰り返すとthrottleされる', function () {
    User::factory()->create(['email' => 'me@example.com', 'password' => bcrypt('correct-horse')]);

    foreach (range(1, 5) as $ignored) {
        $this->postJson('/api/login', ['email' => 'me@example.com', 'password' => 'wrong'])
            ->assertStatus(422);
    }

    $this->postJson('/api/login', ['email' => 'me@example.com', 'password' => 'wrong'])
        ->assertStatus(429);
});

it('会員登録を繰り返すとIP単位でthrottleされる', function () {
    foreach (range(1, 5) as $i) {
        fromFrontend()->postJson('/api/register', [
            'name' => "User {$i}",
            'email' => "user{$i}@example.com",
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();
    }

    fromFrontend()->postJson('/api/register', [
        'name' => 'User 6',
        'email' => 'user6@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])->assertStatus(429);
});

it('ログイン済みユーザーの情報を/api/meで取得できる', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('data.id', $user->id);
});

it('未ログインで/api/meにアクセスすると401になる', function () {
    $this->getJson('/api/me')->assertUnauthorized();
});

it('ログアウトするとセッションが無効化される', function () {
    $user = User::factory()->create();

    fromFrontend()->actingAs($user)->postJson('/api/logout')->assertNoContent();

    // auth:sanctumのRequestGuardはリクエスト内で一度解決したユーザーをキャッシュするため、
    // この後にデフォルトguard（sanctum）でcheckすると古いキャッシュを見てしまう。
    // ログアウトが実際に操作するwebガードを直接確認する（本番は毎回新しいリクエストなので影響しない）。
    $this->assertGuest('web');
});
