<?php

use App\Http\Controllers\PasswordController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\StoreController;
use App\Services\SelcomService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    Route::get('/csrf', fn () => response()->json(['token' => csrf_token()]));
    Route::get('/products', [StoreController::class, 'products']);
    Route::get('/settings', fn (SelcomService $selcom) => [...config('store'), 'selcom_enabled' => $selcom->enabled()]);
    Route::post('/forgot-password', [PasswordController::class, 'forgot'])->middleware('throttle:password-forgot');
    Route::post('/reset-password', [PasswordController::class, 'reset'])->middleware('throttle:password-reset');
    Route::post('/selcom/webhook', [PaymentController::class, 'webhook'])->middleware('throttle:payment-webhook');
    Route::post('/register', [StoreController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [StoreController::class, 'login'])->middleware('throttle:10,1');
    Route::middleware('auth')->group(function () {
        Route::get('/me', fn (Request $r) => response()->json($r->user()));
        Route::post('/me/erasure-request', [StoreController::class, 'requestErasure'])->middleware('throttle:3,1');
        Route::post('/logout', [StoreController::class, 'logout']);
        Route::get('/orders', [StoreController::class, 'orders']);
        Route::post('/orders', [StoreController::class, 'checkout'])->middleware('throttle:20,1');
        Route::get('/orders/{order}/payment-status', [PaymentController::class, 'status'])->middleware('throttle:payment-status');
        Route::post('/orders/{order}/payment/retry', [PaymentController::class, 'retry'])->middleware('throttle:payment-retry');
        Route::get('/admin/orders', [StoreController::class, 'adminOrders']);
        Route::patch('/admin/orders/{order}', [StoreController::class, 'updateOrder']);
        Route::patch('/admin/products/{product}', [StoreController::class, 'updateProduct']);
    });
});
Route::get('/{path?}', fn () => response()->file(public_path('index.html')))->where('path', '^(?!api(?:/|$)).*');
