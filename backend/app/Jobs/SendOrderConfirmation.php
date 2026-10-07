<?php

namespace App\Jobs;

use App\Mail\OrderConfirmation;
use App\Models\Order;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Mail;

class SendOrderConfirmation implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 30;

    public function __construct(public int $orderId) {}

    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function middleware(): array
    {
        return [(new WithoutOverlapping('confirmation-email:'.$this->orderId))->expireAfter(90)->releaseAfter(15)];
    }

    public function handle(): void
    {
        $order = Order::with('items')->find($this->orderId);
        if (! $order || $order->confirmation_email_sent_at) {
            return;
        }
        $user = User::find($order->user_id);
        if (! $user) {
            return;
        }
        $mailer = config('mail.default');
        $sent = Mail::mailer($mailer)->to($user->email)->send(new OrderConfirmation($order));
        // Log/array and composites with log fallback cannot prove dispatch.
        // A successful transport handoff is not a promise of inbox delivery.
        if ($sent !== null && in_array(config('mail.mailers.'.$mailer.'.transport'), ['smtp', 'sendmail', 'ses', 'ses-v2', 'postmark', 'resend', 'mailgun'], true)) {
            $order->update(['confirmation_email_sent_at' => now(), 'confirmation_email' => $user->email]);
        }
    }
}
