<?php

namespace App\Services;

use App\Models\Order;
use App\Models\PaymentAttempt;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderPayments
{
    public function __construct(private SelcomService $selcom) {}

    public static function status(string $value): string
    {
        return match (strtoupper($value)) {
            'PAID', 'COMPLETED' => 'paid',
            'FAILED', 'REJECTED', 'DECLINED' => 'failed',
            'CANCELLED', 'USERCANCELLED', 'CANCELED', 'CANCEL' => 'cancelled',
            'EXPIRED' => 'expired',
            default => 'pending',
        };
    }

    public function initiate(Order $order, string $network, string $phone): void
    {
        Cache::lock('order-payment:'.$order->id, 90)->get(function () use ($order, $network, $phone) {
            // Persist the external request identity before network I/O. A repeated
            // checkout request returns this saved order without another wallet push.
            $attempt = DB::transaction(function () use ($order, $network, $phone) {
                $current = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
                if ($current->selcom_order_id || $current->payment_status === 'paid') {
                    return null;
                }

                return $this->newAttempt($current, $network, $phone);
            });
            if ($attempt) {
                $this->createAndPush($order->fresh(), $attempt, $phone);
            }
        });
    }

    private function newAttempt(Order $order, string $network, string $phone): PaymentAttempt
    {
        $attempt = PaymentAttempt::create(['order_id' => $order->id, 'selcom_order_id' => 'FC'.Str::upper(Str::random(24))]);
        $order->update(['selcom_order_id' => $attempt->selcom_order_id, 'payment_status' => 'pending',
            'payment_channel' => $network, 'masked_payer_phone' => substr($phone, 0, 3).'*****'.substr($phone, -4),
            'payment_details' => ['provider' => $network], 'payment_url' => null, 'payment_message' => null]);

        return $attempt;
    }

    private function createAndPush(Order $order, PaymentAttempt $attempt, string $phone): void
    {
        try {
            $response = $this->selcom->createOrder($order, $attempt, $phone);
            if ((string) $response['resultcode'] !== '000' || strtoupper($response['result']) !== 'SUCCESS') {
                // A rejected create might be an already-existing ID. Reconcile
                // rather than marking paid/issuing another create automatically.
                throw new SelcomException('Payment setup could not be confirmed. Check tracking or contact the store before retrying.');
            }
            $attempt->update(['provider_created' => true]);
            $order->update(['payment_url' => SelcomService::paymentUrl($response)]);
            $this->push($order, $attempt, $phone);
        } catch (SelcomException $exception) {
            $this->message($order, $exception->getMessage());
        }
    }

    private function push(Order $order, PaymentAttempt $attempt, string $phone): void
    {
        $attempt->update(['wallet_transaction_id' => 'FC'.Str::upper(Str::random(24)), 'last_prompt_at' => now()]);
        $response = $this->selcom->walletPayment($attempt, $phone);
        if (! in_array(strtoupper($response['result']), ['SUCCESS', 'PENDING', 'INPROGRESS'], true)) {
            $this->message($order, 'The payment prompt could not be confirmed. Check tracking before retrying.');
        } else {
            $this->message($order, 'Payment requested. Waiting for verified payment confirmation.');
        }
        // Even SUCCESS here confirms a request, not a received payment.
    }

    private function message(Order $order, string $message): void
    {
        Order::whereKey($order->id)->where('payment_status', '!=', 'paid')->update(['payment_message' => $message]);
    }

    public function verify(PaymentAttempt $attempt): string
    {
        $response = $this->selcom->orderStatus($attempt);
        $data = $response['data'][0] ?? null;
        $order = $attempt->order;
        if ((string) $response['resultcode'] !== '000' || strtoupper($response['result']) !== 'SUCCESS'
            || ! is_array($data) || ($data['order_id'] ?? null) !== $attempt->selcom_order_id
            || SelcomService::amountCents($data['amount'] ?? null) !== (int) $order->total_cents
            || (isset($data['currency']) && $data['currency'] !== 'TZS')
            || ! is_string($data['payment_status'] ?? null)) {
            throw new SelcomException('Payment verification did not match this order. Contact the store before retrying.');
        }
        $status = self::status($data['payment_status']);
        if ($status === 'paid' && (! is_string($data['reference'] ?? null) || $data['reference'] === ''
            || ! is_string($data['transid'] ?? null) || $data['transid'] === '')) {
            throw new SelcomException('Payment verification is incomplete. Contact the store.');
        }
        DB::transaction(function () use ($attempt, $data, $status) {
            $current = Order::whereKey($attempt->order_id)->lockForUpdate()->firstOrFail();
            $attempt->update(['provider_created' => true, 'provider_status' => strtoupper($data['payment_status']), 'last_checked_at' => now()]);
            if ($current->payment_status === 'paid') {
                return; // Terminal and replay-safe, including older attempt callbacks.
            }
            if ($current->selcom_order_id !== $attempt->selcom_order_id && $status !== 'paid') {
                return; // An old failed callback cannot overwrite a newer attempt.
            }
            $changes = ['payment_status' => $status, 'payment_message' => match ($status) {
                'paid' => 'Payment received and verified.',
                'failed' => 'Payment declined. You may retry after checking your wallet.',
                'cancelled' => 'Payment cancelled.',
                'expired' => 'Payment request expired.',
                default => 'Waiting for verified payment confirmation.',
            }];
            if ($status === 'paid') {
                $changes += ['paid_at' => now(), 'payment_reference' => substr($data['reference'], 0, 100),
                    'payment_transaction_id' => substr($data['transid'], 0, 100),
                    'payment_channel' => substr((string) ($data['channel'] ?? $current->payment_channel), 0, 50), 'payment_url' => null];
            }
            $current->update($changes);
        });

        return $status;
    }

    public function retry(Order $order, string $network, string $phone): void
    {
        $acquired = Cache::lock('order-payment:'.$order->id, 90)->get(function () use ($order, $network, $phone) {
            $order->refresh();
            if ($order->payment_status === 'paid') {
                throw ValidationException::withMessages(['payment' => 'This order is already paid.']);
            }
            $attempt = PaymentAttempt::where('order_id', $order->id)->where('selcom_order_id', $order->selcom_order_id)->first();
            if (! $attempt && ! $order->selcom_order_id) {
                // Recovery after a process stopped between saving the order and
                // allocating its first provider ID; no external request existed.
                $attempt = DB::transaction(function () use ($order, $network, $phone) {
                    $current = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
                    if ($current->payment_status === 'paid') {
                        throw ValidationException::withMessages(['payment' => 'This order is already paid.']);
                    }

                    return $this->newAttempt($current, $network, $phone);
                });
                $this->createAndPush($order->fresh(), $attempt, $phone);

                return true;
            }
            if (! $attempt) {
                throw new SelcomException('Payment setup needs review. Contact the store with your order number.');
            }
            // Check the previous request first, including after a timeout. No
            // blind network retries and no new order while payment is ambiguous.
            $status = $this->verify($attempt);
            if ($status === 'paid') {
                throw ValidationException::withMessages(['payment' => 'Payment has already been received. Refresh tracking.']);
            }
            $attempt->refresh();
            if ($status === 'pending' && ! $attempt->last_prompt_at) {
                // A confirmed provider order whose first wallet request never
                // started is safe to prompt. A sent/ambiguous prompt is not.
                $this->push($order, $attempt, $phone);

                return true;
            }
            if ($attempt->last_prompt_at?->gt(now()->subSeconds(45))) {
                throw ValidationException::withMessages(['payment' => 'Wait at least 45 seconds before requesting another prompt.']);
            }
            if ($status === 'pending' || ! in_array($attempt->provider_status, ['REJECTED', 'FAILED', 'DECLINED', 'CANCELLED', 'USERCANCELLED', 'CANCELED', 'CANCEL', 'EXPIRED'], true)) {
                throw ValidationException::withMessages(['payment' => 'The previous request is still pending. Check your phone and tracking before retrying.']);
            }
            if (in_array($status, ['expired', 'cancelled'], true)) {
                $attempt = DB::transaction(function () use ($order, $network, $phone) {
                    $current = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
                    if ($current->payment_status === 'paid') {
                        throw ValidationException::withMessages(['payment' => 'This order is already paid.']);
                    }

                    return $this->newAttempt($current, $network, $phone);
                });
                $this->createAndPush($order->fresh(), $attempt, $phone);
            } else {
                Order::whereKey($order->id)->where('payment_status', '!=', 'paid')->update([
                    'payment_status' => 'pending', 'payment_channel' => $network,
                    'masked_payer_phone' => substr($phone, 0, 3).'*****'.substr($phone, -4), 'payment_details' => json_encode(['provider' => $network]),
                ]);
                $this->push($order, $attempt, $phone);
            }

            return true;
        });
        if (! $acquired) {
            throw ValidationException::withMessages(['payment' => 'A payment request is already being checked. Try again shortly.']);
        }
    }
}
