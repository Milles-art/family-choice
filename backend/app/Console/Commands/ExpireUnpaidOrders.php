<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\OrderCancellation;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;

class ExpireUnpaidOrders extends Command
{
    protected $signature = 'orders:expire-unpaid';
    protected $description = 'Restore stock for safely verified expired unpaid orders';

    public function handle(OrderCancellation $cancellation): int
    {
        $hours = (int) config('store.unconfirmed_order_hours');
        Order::whereNotIn('status', ['cancelled', 'delivered'])->where('payment_status', '!=', 'paid')
            ->where(function ($query) use ($hours) {
                $query->where(fn ($q) => $q->where('payment_method', 'selcom')->whereIn('payment_status', ['failed', 'expired', 'cancelled', 'pending'])
                    ->where('created_at', '<=', now()->subMinutes(max(1, config('store.unpaid_cancel_minutes')))));
                if ($hours > 0) $query->orWhere(fn ($q) => $q->whereIn('payment_method', ['cash', 'mobile_money'])->where('status', 'pending')->where('created_at', '<=', now()->subHours($hours)));
            })->chunkById(50, function ($orders) use ($cancellation) {
                foreach ($orders as $order) {
                    try { $cancellation->cancel($order, 'Unpaid order expired', $order->payment_method !== 'selcom'); }
                    catch (ValidationException) { /* Unavailable/ambiguous provider: preserve order and stock. */ }
                }
            });
        return self::SUCCESS;
    }
}
