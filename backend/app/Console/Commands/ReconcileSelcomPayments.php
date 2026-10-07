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
        PaymentAttempt::whereHas('order', fn ($query) => $query->where('payment_method', 'selcom')->where('payment_status', '!=', 'paid'))
            ->where(fn ($query) => $query->whereNull('provider_status')->orWhereNotIn('provider_status', ['EXPIRED', 'CANCELLED', 'USERCANCELLED']))
            ->where(fn ($query) => $query->whereNull('last_checked_at')->orWhere('last_checked_at', '<=', now()->subMinute()))
            ->orderBy('id')->chunkById(50, function ($attempts) use ($payments, &$checked) {
                foreach ($attempts as $attempt) {
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
