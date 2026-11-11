<?php

namespace App\Http\Controllers\Api\Auth;

use App\Actions\Auth\AuthenticateUser;
use App\Actions\Auth\RegisterUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\Account\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, RegisterUser $registerUser): JsonResponse
    {
        $user = $registerUser->execute(
            name: $request->string('name')->toString(),
            email: $request->string('email')->toString(),
            password: $request->string('password')->toString(),
        );

        return $this->loginResponse($request, $user, 201);
    }

    public function login(LoginRequest $request, AuthenticateUser $authenticateUser): JsonResponse
    {
        $user = $authenticateUser->execute(
            email: $request->string('email')->toString(),
            password: $request->string('password')->toString(),
        );

        return $this->loginResponse($request, $user, 200);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(status: 204);
    }

    /** ログインセッションを確立し、Set-CookieでecpのセッションCookieを発行する。 */
    private function loginResponse(Request $request, User $user, int $status): JsonResponse
    {
        Auth::login($user);
        $request->session()->regenerate();

        return UserResource::make($user)->response()->setStatusCode($status);
    }
}
