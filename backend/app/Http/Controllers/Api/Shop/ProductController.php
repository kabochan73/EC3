<?php

namespace App\Http\Controllers\Api\Shop;

use App\Http\Controllers\Controller;
use App\Http\Resources\Shop\ProductDetailResource;
use App\Http\Resources\Shop\ProductSummaryResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductController extends Controller
{
    /**
     * 公開商品一覧（カード表示用）。docs/api/public.md
     *
     * クエリ:
     *  - category … カテゴリslugで絞り込み
     *  - new      … "true"で作成30日以内・新着順（トップの新着セクション用）
     *  - limit    … 件数上限（1〜100）
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'category' => ['sometimes', 'string', 'exists:categories,slug'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        // ?new=true/1/yes等を許容（Request::booleanが正規化する。validateの'boolean'ルールは
        // 文字列"true"を弾くので使わない）
        $onlyNew = $request->boolean('new');

        $query = Product::query()
            ->published()
            ->with(['category', 'images', 'variants'])
            ->when(
                isset($validated['category']),
                fn ($q) => $q->inCategory($validated['category']),
            );

        if ($onlyNew) {
            $query->new()->orderByDesc('created_at')->orderByDesc('id');
        } else {
            $query->ordered();
        }

        if (isset($validated['limit'])) {
            $query->limit($validated['limit']);
        }

        return ProductSummaryResource::collection($query->get());
    }

    /**
     * 公開商品の詳細。未公開・存在しないslugは404（docs/api/public.md）。
     */
    public function show(string $slug): ProductDetailResource
    {
        $product = Product::query()
            ->published()
            ->with(['category', 'images', 'variants'])
            ->where('slug', $slug)
            ->first();

        if ($product === null) {
            throw new NotFoundHttpException('Product not found.');
        }

        // related … 同カテゴリの他の公開商品をposition順に全件（件数上限なし）
        $related = Product::query()
            ->published()
            ->with(['category', 'images', 'variants'])
            ->where('category_id', $product->category_id)
            ->whereKeyNot($product->id)
            ->ordered()
            ->get();

        $product->setRelation('relatedProducts', $related);

        return ProductDetailResource::make($product);
    }
}
