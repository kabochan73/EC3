<?php

use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\Admin\ProductImageController;
use App\Http\Controllers\Api\Admin\SiteContentController;
use App\Http\Controllers\Api\Admin\VariantController;
use App\Models\SiteContent;
use Illuminate\Support\Facades\Route;

// api.phpからprefix('admin') + auth:sanctum + adminミドルウェアで読み込む
// （docs/backend/folder-structure.md）。

// reorderは静的パスなのでapiResourceの{category}より先に登録する（後だと"reorder"がidとして解釈される）
Route::put('/categories/reorder', [CategoryController::class, 'reorder']);
Route::apiResource('categories', CategoryController::class)->except(['show']);

// --- 商品（基本情報。未公開も含む） ---
Route::apiResource('products', ProductController::class);

// --- 商品画像（URLの形がapiResourceの規約と合わないので手書き。reorderは静的パス） ---
Route::post('/products/{product}/images', [ProductImageController::class, 'store']);
Route::put('/products/{product}/images/reorder', [ProductImageController::class, 'reorder']);
Route::delete('/product-images/{productImage}', [ProductImageController::class, 'destroy']);

// --- バリアント（サイズ×色）---
// shallow: 作成は「どの商品か」が要るので/products/{product}/variants、
// 作成後はidだけで特定できるので/variants/{variant}
Route::apiResource('products.variants', VariantController::class)
    ->shallow()
    ->only(['store', 'update', 'destroy']);

Route::get('/content', [SiteContentController::class, 'index']);
// {key}は4種のいずれかに制約（不一致は404。docs/backend/cms.md「不正なkeyは404」）
Route::put('/content/{key}', [SiteContentController::class, 'update'])
    ->where('key', implode('|', SiteContent::KEYS));
Route::post('/content/{key}/images', [SiteContentController::class, 'uploadImage'])
    ->where('key', implode('|', SiteContent::KEYS));
