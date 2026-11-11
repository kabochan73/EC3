<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use Illuminate\Http\JsonResponse;

class SiteContentController extends Controller
{
    /** GET /api/admin/content（docs/api/admin.md）。編集フォーム用に4キー全部の生dataを返す。 */
    public function index(): JsonResponse
    {
        return response()->json(['data' => SiteContent::allWithDefaults()]);
    }
}
