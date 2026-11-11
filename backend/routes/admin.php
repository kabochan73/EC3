<?php

use App\Http\Controllers\Api\Admin\SiteContentController;
use App\Models\SiteContent;
use Illuminate\Support\Facades\Route;

// api.phpからprefix('admin') + auth:sanctum + adminミドルウェアで読み込む
// （docs/backend/folder-structure.md）。

Route::get('/content', [SiteContentController::class, 'index']);
// {key}は4種のいずれかに制約（不一致は404。docs/backend/cms.md「不正なkeyは404」）
Route::put('/content/{key}', [SiteContentController::class, 'update'])
    ->where('key', implode('|', SiteContent::KEYS));
Route::post('/content/{key}/images', [SiteContentController::class, 'uploadImage'])
    ->where('key', implode('|', SiteContent::KEYS));
