<?php

namespace App\Http\Controllers\Api\Shop;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use Illuminate\Http\JsonResponse;

class SiteContentController extends Controller
{
    /** GET /api/content（docs/backend/cms.md）。4キー全部を、無いものはdefaultsで埋めて返す。 */
    public function index(): JsonResponse
    {
        return response()->json(['data' => SiteContent::allWithDefaults()]);
    }
}
