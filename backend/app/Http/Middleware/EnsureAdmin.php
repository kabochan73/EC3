<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * 認証済みだがadminでなければ403（docs/backend/auth.md）。
 * 認証自体（401）はauth:sanctumが担当するため、このミドルウェアはそれより後に並べる。
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_if($request->user()?->role !== UserRole::Admin, 403);

        return $next($request);
    }
}
