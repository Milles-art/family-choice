<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ConfiguredTrustProxies extends \Illuminate\Http\Middleware\TrustProxies
{
    public function handle(Request $request, Closure $next)
    {
        // Evaluate after configuration boot, including config-cached hosts.
        $value = trim((string) config('store.trusted_proxies', ''));
        static::at($value === '*' ? '*' : array_values(array_filter(array_map('trim', explode(',', $value)))));
        return parent::handle($request, $next);
    }
}
