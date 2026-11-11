<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admin\Content\UpdateSiteContent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSiteContentRequest;
use App\Models\SiteContent;
use Illuminate\Http\JsonResponse;

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
}
