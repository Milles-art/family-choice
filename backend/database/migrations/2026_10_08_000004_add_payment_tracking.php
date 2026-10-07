<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('selcom_order_id', 64)->nullable()->unique();
            $table->string('payment_transaction_id', 100)->nullable();
            $table->string('payment_reference', 100)->nullable();
            $table->string('payment_channel', 50)->nullable();
            $table->string('masked_payer_phone', 20)->nullable();
            $table->text('payment_url')->nullable();
            $table->string('payment_message')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('confirmation_email_sent_at')->nullable();
            $table->string('confirmation_email')->nullable();
        });
        // Retain provider IDs across expiry retries so late callbacks can be verified.
        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('selcom_order_id', 64)->unique();
            $table->string('wallet_transaction_id', 64)->nullable();
            $table->boolean('provider_created')->default(false);
            $table->string('provider_status', 30)->nullable();
            $table->timestamp('last_prompt_at')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_attempts');
        Schema::table('orders', function (Blueprint $table) {
            $table->dropUnique(['selcom_order_id']);
            $table->dropColumn(['selcom_order_id', 'payment_transaction_id', 'payment_reference', 'payment_channel', 'masked_payer_phone', 'payment_url', 'payment_message', 'paid_at', 'confirmation_email_sent_at', 'confirmation_email']);
        });
    }
};
