<?php

use App\Http\Controllers\Api\Admin\SiteContentController;
use Illuminate\Support\Facades\Route;

// api.phpからprefix('admin') + auth:sanctum + adminミドルウェアで読み込む
// （docs/backend/folder-structure.md）。

Route::get('/content', [SiteContentController::class, 'index']);
