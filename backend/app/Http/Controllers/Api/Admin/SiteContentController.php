<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admin\Content\UpdateSiteContent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSiteContentRequest;
use App\Models\SiteContent;
use App\Services\StorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteContentController extends Controller
{
    /** GET /api/admin/content（docs/api/admin.md）。編集フォーム用に4キー全部の生dataを返す。 */
    public function index(): JsonResponse
    {
        return response()->json(['data' => SiteContent::allWithDefaults()]);
    }

    /** PUT /api/admin/content/{key}（docs/api/admin.md）。dataを丸ごと差し替える。 */
    public function update(
        UpdateSiteContentRequest $request,
        string $key,
        UpdateSiteContent $updateSiteContent,
    ): JsonResponse {
        $content = $updateSiteContent->execute($key, $request->validated(), $request->user());

        return response()->json(['data' => $content->data]);
    }

    /**
     * POST /api/admin/content/{key}/images（docs/api/admin.md）。
     * アップロードのみ行い、dataへの反映はしない（フロントがurlを受け取ってからPUTする2段階）。
     */
    public function uploadImage(Request $request, string $key, StorageService $storage): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $storage->put("content/{$key}", $request->file('image'));

        return response()->json(['url' => "/media/{$path}"]);
    }
}
