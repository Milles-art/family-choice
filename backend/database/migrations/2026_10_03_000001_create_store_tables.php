<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->boolean('is_admin')->default(false));
        Schema::create('products', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->json('details');
            $t->unsignedInteger('price_cents');
            $t->unsignedInteger('stock')->default(100);
            $t->timestamps();
        });
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained();
            $t->uuid('request_id');
            $t->string('number')->unique();
            $t->string('status')->default('pending');
            $t->string('payment_status')->default('unpaid');
            $t->json('delivery');
            $t->string('delivery_option');
            $t->string('time_slot');
            $t->unsignedInteger('subtotal_cents');
            $t->unsignedInteger('delivery_cents');
            $t->unsignedInteger('tax_cents');
            $t->unsignedInteger('total_cents');
            $t->timestamps();
            $t->unique(['user_id', 'request_id']);
        });
        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->string('product_id');
            $t->foreign('product_id')->references('id')->on('products');
            $t->string('name');
            $t->string('image');
            $t->unsignedInteger('quantity');
            $t->unsignedInteger('price_cents');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('products');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('is_admin'));
    }
};
