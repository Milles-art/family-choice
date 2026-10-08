<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('stock_restored_at')->nullable();
            $table->string('cancel_reason', 100)->nullable();
            $table->timestamp('reconciliation_stopped_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn(['cancelled_at', 'stock_restored_at', 'cancel_reason', 'reconciliation_stopped_at']));
    }
};
