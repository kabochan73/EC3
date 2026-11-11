<?php

use App\Http\Controllers\Api\Account\ProfileController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Shop\SiteContentController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// ヘルスチェック。APIが起きているか・DBに繋がっているかを1発で確認する用。
Route::get('/health', function () {
    try {
        DB::connection()->getPdo();
        $db = 'ok';
    } catch (Throwable) {
        $db = 'error';
    }

    return response()->json([
        'status' => 'ok',
        'app' => config('app.name'),
        'database' => $db,
        'time' => now()->toIso8601String(),
    ]);
});

// --- 公開 ---
Route::get('/content', [SiteContentController::class, 'index']);

// --- 認証（公開） ---
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// --- 認証必須 ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/me', [ProfileController::class, 'show']);
    Route::put('/me', [ProfileController::class, 'update']);
    Route::put('/me/password', [ProfileController::class, 'updatePassword']);
});
