<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ログイン試行のレート制限（メール + IPで5回/分）。routesでthrottle:login。
        // メールも鍵に入れるので、同じIPから別アカウントを試すのは別枠（総当たりは1アカウントずつ抑える）
        RateLimiter::for('login', function (Request $request) {
            $email = (string) $request->input('email');

            return Limit::perMinute(5)->by(mb_strtolower($email).'|'.$request->ip());
        });

        // 会員登録（IPで5回/分）
        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));

        // 注文作成（ユーザーごとに5回/分）
        RateLimiter::for('orders', fn (Request $request) => Limit::perMinute(5)->by((string) $request->user()?->id));
    }
}
