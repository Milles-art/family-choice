<?php

namespace App\Providers;

use App\Models\Order;
use Illuminate\Auth\Notifications\ResetPassword;
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
        RateLimiter::for('payment-retry', fn (Request $request) => Limit::perMinute(3)->by($request->user()->id.':'.($request->route('order') instanceof Order ? $request->route('order')->id : $request->route('order'))));
        RateLimiter::for('payment-status', fn (Request $request) => Limit::perMinute(30)->by((string) $request->user()->id));
        RateLimiter::for('payment-webhook', fn (Request $request) => Limit::perMinute(60)->by($request->ip()));
        RateLimiter::for('password-forgot', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        RateLimiter::for('password-reset', fn (Request $request) => Limit::perMinute(5)->by($request->ip()));
        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim(config('app.url'), '/').'/reset-password?'.http_build_query([
            'token' => $token, 'email' => $user->getEmailForPasswordReset(),
        ]));
    }
}
