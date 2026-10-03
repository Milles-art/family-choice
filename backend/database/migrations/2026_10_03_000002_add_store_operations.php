<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('privacy_consented_at')->nullable()->after('is_admin');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_method')->default('cash')->after('payment_status');
            $table->json('payment_details')->nullable()->after('payment_method');
        });

        Schema::create('admin_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action');
            $table->string('subject_type');
            $table->string('subject_id');
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->timestamps();
        });

        Schema::create('privacy_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type')->default('erasure');
            $table->string('status')->default('pending');
            $table->timestamps();
            $table->unique(['user_id', 'type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('privacy_requests');
        Schema::dropIfExists('admin_audits');
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn(['payment_method', 'payment_details']));
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('privacy_consented_at'));
    }
};
