<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PaymentAttempt;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderCancellation
{
    public function __construct(private OrderPayments $payments) {}

    public function cancel(Order $order, string $reason, bool $pendingOnly = false): Order
    {
        $result = Cache::lock('order-payment:'.$order->id, 90)->get(function () use ($order, $reason, $pendingOnly) {
            // Verify before the transaction: a verified payment must persist even
            // when cancellation is then refused. Serialize with payment retries.
            $order->refresh();
            if ($order->status === 'cancelled') return $order;
            if ($order->payment_method === 'selcom') {
                $attempts = PaymentAttempt::where('order_id', $order->id)->get();
                if ($attempts->isEmpty()) $this->refuse('Payment verification is unavailable. Try again later.');
                foreach ($attempts as $attempt) {
                    try { $status = $this->payments->verify($attempt); }
                    catch (SelcomException) { $this->refuse('Payment could not be verified. The order has not been cancelled; try again later.'); }
                    if ($status === 'paid') $this->refuse('Payment has been received. Contact the store about this order.');
                }
            }
            return DB::transaction(function () use ($order, $reason, $pendingOnly) {
                $current = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
                if ($current->status === 'cancelled') return $current;
                if ($current->payment_status === 'paid' || $current->status === 'delivered') $this->refuse('Paid or delivered orders cannot be cancelled.');
                if ($pendingOnly && $current->status !== 'pending') $this->refuse('Only pending orders can be cancelled from your account.');
                if (!$current->stock_restored_at) {
                    foreach ($current->items()->orderBy('product_id')->get() as $item) {
                        $product = Product::whereKey($item->product_id)->lockForUpdate()->firstOrFail();
                        $product->increment('stock', $item->quantity);
                    }
                }
                $current->update(['status' => 'cancelled', 'cancelled_at' => now(), 'stock_restored_at' => now(), 'cancel_reason' => mb_substr($reason, 0, 100)]);
                return $current;
            }, 3);
        });
        if (!$result) $this->refuse('A payment request is being checked. Try again shortly.');
        return $result;
    }

    private function refuse(string $message): never
    {
        throw ValidationException::withMessages(['order' => $message]);
    }
}
