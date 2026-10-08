<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedInteger('contribution_cents')->default(0)->after('tax_cents');
        });

        Schema::create('impact_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('enabled')->default(true);
            $table->json('fixed_amounts_cents');
            $table->unsignedInteger('round_up_increment_cents')->default(100000);
            $table->boolean('matching_enabled')->default(false);
            $table->boolean('recurring_sponsorship_enabled')->default(false);
            $table->string('recurring_provider')->nullable();
            $table->timestamps();
        });

        Schema::create('community_partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('community_campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->nullable()->constrained('community_partners')->nullOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('image')->nullable();
            $table->string('type')->default('normal');
            $table->date('starts_at');
            $table->date('ends_at')->nullable();
            $table->boolean('active')->default(false);
            $table->unsignedInteger('monetary_target_cents')->nullable();
            $table->unsignedInteger('distribution_target')->nullable();
            $table->json('accepted_contribution_types')->nullable();
            $table->timestamps();
        });

        Schema::create('community_food_boxes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->json('contents');
            $table->unsignedInteger('price_cents');
            $table->unsignedInteger('available_quantity')->default(0);
            $table->boolean('active')->default(false);
            $table->string('fulfillment_method')->default('program_stock');
            $table->json('stock_dependency')->nullable();
            $table->timestamps();
        });

        Schema::create('community_contributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained('community_campaigns')->nullOnDelete();
            $table->foreignId('food_box_id')->nullable()->constrained('community_food_boxes')->nullOnDelete();
            $table->string('kind');
            $table->unsignedInteger('amount_cents');
            $table->unsignedInteger('food_box_quantity')->default(0);
            $table->string('payment_status')->default('pledged');
            $table->string('fulfillment_status')->default('unallocated');
            $table->string('payment_method')->nullable();
            $table->string('acknowledgment_number')->unique();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->index(['campaign_id', 'payment_status']);
            $table->index(['user_id', 'created_at']);
        });

        Schema::create('community_distributions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->nullable()->constrained('community_campaigns')->nullOnDelete();
            $table->foreignId('partner_id')->nullable()->constrained('community_partners')->nullOnDelete();
            $table->string('description');
            $table->unsignedInteger('food_boxes_distributed')->default(0);
            $table->unsignedInteger('meals_distributed')->default(0);
            $table->unsignedInteger('households_reached')->default(0);
            $table->unsignedInteger('food_rescued_grams')->default(0);
            $table->string('status')->default('recorded');
            $table->string('evidence_path')->nullable();
            $table->timestamp('distributed_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });

        Schema::create('contribution_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contribution_id')->constrained('community_contributions')->cascadeOnDelete();
            $table->foreignId('distribution_id')->nullable()->constrained('community_distributions')->nullOnDelete();
            $table->unsignedInteger('amount_cents')->default(0);
            $table->unsignedInteger('food_box_quantity')->default(0);
            $table->timestamps();
            $table->unique(['contribution_id', 'distribution_id']);
        });

        Schema::create('contribution_refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contribution_id')->constrained('community_contributions')->cascadeOnDelete();
            $table->unsignedInteger('amount_cents');
            $table->string('reason');
            $table->foreignId('recorded_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('food_vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->nullable()->constrained('community_partners')->nullOnDelete();
            $table->string('code_hash')->unique();
            $table->unsignedInteger('initial_cents');
            $table->unsignedInteger('balance_cents');
            $table->json('permitted_product_ids')->nullable();
            $table->string('beneficiary_reference')->nullable();
            $table->timestamp('expires_at');
            $table->timestamp('redeemed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('voucher_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('voucher_id')->constrained('food_vouchers')->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('amount_cents');
            $table->uuid('request_id')->unique();
            $table->timestamps();
        });

        Schema::create('surplus_food_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->nullable()->constrained('community_partners')->nullOnDelete();
            $table->string('product_name');
            $table->string('batch_reference')->nullable();
            $table->unsignedInteger('quantity');
            $table->string('unit');
            $table->string('storage_requirements')->nullable();
            $table->date('best_before_at')->nullable();
            $table->date('use_by_at')->nullable();
            $table->timestamp('collected_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('distributed_at')->nullable();
            $table->string('status')->default('recorded');
            $table->timestamps();
        });

        Schema::create('matching_commitments', function (Blueprint $table) {
            $table->id();
            $table->string('sponsor_name');
            $table->foreignId('campaign_id')->nullable()->constrained('community_campaigns')->nullOnDelete();
            $table->unsignedInteger('limit_cents');
            $table->unsignedInteger('received_cents')->default(0);
            $table->string('status')->default('pledged');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matching_commitments');
        Schema::dropIfExists('surplus_food_batches');
        Schema::dropIfExists('voucher_redemptions');
        Schema::dropIfExists('food_vouchers');
        Schema::dropIfExists('contribution_refunds');
        Schema::dropIfExists('contribution_allocations');
        Schema::dropIfExists('community_distributions');
        Schema::dropIfExists('community_contributions');
        Schema::dropIfExists('community_food_boxes');
        Schema::dropIfExists('community_campaigns');
        Schema::dropIfExists('community_partners');
        Schema::dropIfExists('impact_settings');
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn('contribution_cents'));
    }
};
