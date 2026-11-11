<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * パスワード変更（docs/api/public.md PUT /api/me/password）。
 * 現パスワードの確認はUpdatePasswordRequest（current_passwordルール）が行う。
 */
final class UpdatePassword
{
    public function execute(User $user, string $newPassword): void
    {
        $user->password = Hash::make($newPassword);
        $user->save();
    }
}
