<?php

namespace App\Console\Commands;

use App\Models\PaymentAttempt;
use App\Services\OrderPayments;
use App\Services\SelcomException;
use App\Services\SelcomService;
use Illuminate\Console\Command;

class ReconcileSelcomPayments extends Command
{
    protected $signature = 'selcom:reconcile';

    protected $description = 'Verify outstanding Selcom orders when callbacks are delayed or lost';

    public function handle(SelcomService $selcom, OrderPayments $payments): int
    {
        if (! $selcom->enabled()) {
            $this->info('Selcom is disabled; no requests sent.');

            return self::SUCCESS;
        }
        $checked = 0;
        PaymentAttempt::whereHas('order', fn ($query) => $query->where('payment_method', 'selcom')->where('payment_status', '!=', 'paid')->where('status', '!=', 'cancelled'))
            ->orderBy('id')->chunkById(50, function ($attempts) use ($payments, &$checked) {
                foreach ($attempts as $attempt) {
                    $age = $attempt->created_at->diffInMinutes(now());
                    if ($age >= max(1, (int) config('services.selcom.reconcile_hours', 48)) * 60) {
                        $changed = \App\Models\Order::whereKey($attempt->order_id)->whereNull('reconciliation_stopped_at')->update(['reconciliation_stopped_at' => now()]);
                        if ($changed) \Illuminate\Support\Facades\Log::warning('Payment reconciliation stopped; staff review needed', ['order_id' => $attempt->order_id]);
                        continue;
                    }
                    $interval = $age < 15 ? 1 : ($age < 360 ? 10 : 60);
                    if ($attempt->last_checked_at && $attempt->last_checked_at->gt(now()->subMinutes($interval))) continue;
                    try {
                        $payments->verify($attempt);
                    } catch (SelcomException) {
                        // Keep the saved status. Back off without leaking provider data.
                        $attempt->update(['last_checked_at' => now()]);
                    }
                    $checked++;
                }
            });
        $this->info('Checked '.$checked.' outstanding payment attempts.');

        return self::SUCCESS;
    }
}
