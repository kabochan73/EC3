<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('氏名を更新できる', function () {
    $user = User::factory()->create(['name' => 'Old', 'email' => 'keep@example.com']);

    $this->actingAs($user)
        ->putJson('/api/me', ['name' => 'New Name', 'email' => 'keep@example.com'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New Name');
});

it('メールアドレスを更新できる', function () {
    $user = User::factory()->create(['email' => 'before@example.com']);

    $this->actingAs($user)
        ->putJson('/api/me', ['name' => $user->name, 'email' => 'after@example.com'])
        ->assertOk()
        ->assertJsonPath('data.email', 'after@example.com');

    expect($user->fresh()->email)->toBe('after@example.com');
});

it('他人が使っているメールアドレスには更新できない', function () {
    User::factory()->create(['email' => 'taken@example.com']);
    $user = User::factory()->create(['email' => 'mine@example.com']);

    $this->actingAs($user)
        ->putJson('/api/me', ['name' => $user->name, 'email' => 'taken@example.com'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('email');
});

it('自分自身の現在のメールアドレスはそのまま維持できる', function () {
    $user = User::factory()->create(['email' => 'same@example.com']);

    $this->actingAs($user)
        ->putJson('/api/me', ['name' => 'Renamed', 'email' => 'same@example.com'])
        ->assertOk();
});

it('現在のパスワードが正しければパスワードを変更できる', function () {
    $user = User::factory()->create(['password' => Hash::make('old-password')]);

    $this->actingAs($user)
        ->putJson('/api/me/password', [
            'current_password' => 'old-password',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertNoContent();

    expect(Hash::check('brand-new-password', $user->fresh()->password))->toBeTrue();
});

it('現在のパスワードが違うと変更できない', function () {
    $user = User::factory()->create(['password' => Hash::make('old-password')]);

    $this->actingAs($user)
        ->putJson('/api/me/password', [
            'current_password' => 'not-it',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('current_password');
});

it('現在と同じパスワードには変更できない', function () {
    $user = User::factory()->create(['password' => Hash::make('same-password')]);

    $this->actingAs($user)
        ->putJson('/api/me/password', [
            'current_password' => 'same-password',
            'password' => 'same-password',
            'password_confirmation' => 'same-password',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('password');
});

it('未ログインではプロフィールAPIを利用できない', function () {
    $this->putJson('/api/me', ['name' => 'X', 'email' => 'x@example.com'])->assertUnauthorized();
    $this->putJson('/api/me/password', [])->assertUnauthorized();
});
