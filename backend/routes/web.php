<?php

use App\Http\Controllers\PasswordController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\StoreController;
use App\Http\Controllers\StorefrontController;
use App\Services\SelcomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    Route::get('/csrf', fn () => response()->json(['token' => csrf_token()]));
    Route::get('/products', [StoreController::class, 'products']);
    Route::get('/settings', fn (SelcomService $selcom) => [...\Illuminate\Support\Arr::only(config('store'), ['currency', 'tax_rate', 'delivery_cents', 'free_delivery_cents', 'mobile_money_enabled', 'mobile_money_instructions']), 'selcom_enabled' => $selcom->enabled()]);
    Route::post('/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:password-forgot');
    Route::post('/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:password-reset');
    Route::post('/selcom/webhook', [PaymentController::class, 'webhook'])->middleware('throttle:payment-webhook');
    Route::post('/register', [StoreController::class, 'register'])->middleware('throttle:registration');
    Route::post('/login', [StoreController::class, 'login'])->middleware('throttle:login');
    Route::middleware('auth')->group(function () {
        Route::get('/me', fn (Request $r) => response()->json($r->user()));
        Route::post('/me/erasure-request', [StoreController::class, 'requestErasure'])->middleware('throttle:3,1');
        Route::post('/logout', [StoreController::class, 'logout']);
        Route::get('/orders', [StoreController::class, 'orders']);
        Route::post('/orders', [StoreController::class, 'checkout'])->middleware('throttle:20,1');
        Route::post('/orders/{order}/cancel', [StoreController::class, 'cancelOrder'])->middleware('throttle:order-cancel');
        Route::get('/orders/{order}/payment-status', [PaymentController::class, 'status'])->middleware('throttle:payment-status');
        Route::post('/orders/{order}/payment/retry', [PaymentController::class, 'retry'])->middleware('throttle:payment-retry');
        Route::get('/admin/orders', [StoreController::class, 'adminOrders'])->middleware('throttle:admin');
        Route::patch('/admin/orders/{order}', [StoreController::class, 'updateOrder'])->middleware('throttle:admin');
        Route::patch('/admin/products/{product}', [StoreController::class, 'updateProduct'])->middleware('throttle:admin');
    });
});
Route::get('/sitemap.xml', [StorefrontController::class, 'sitemap']);
Route::get('/{path?}', [StorefrontController::class, 'page'])->where('path', '^(?!api(?:/|$)).*');
