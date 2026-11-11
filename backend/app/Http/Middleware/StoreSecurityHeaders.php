<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StoreSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        $mode = config('store.csp_mode', 'report-only');
        if (in_array($mode, ['report-only', 'enforce'], true)) {
            // React uses style attributes; Lottie may use a blob worker. External
            // links/payment navigation need no script/frame source permission.
            $policy = "default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.pexels.com; font-src 'self'; connect-src 'self' https://assets-v2.lottiefiles.com https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web@0.80.0/dist/dotlottie-player.wasm https://unpkg.com/@lottiefiles/dotlottie-web@0.80.0/dist/dotlottie-player.wasm; worker-src 'self' blob:";
            $response->headers->set($mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only', $policy);
        }
        if ($request->isSecure() && config('store.hsts')) $response->headers->set('Strict-Transport-Security', 'max-age=15552000');
        if ($request->is('api/*')) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        return $response;
    }
}
