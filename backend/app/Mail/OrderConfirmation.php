<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Mail\Mailable;

class OrderConfirmation extends Mailable
{
    public function __construct(public Order $order) {}

    public function build(): self
    {
        return $this->subject('FAMILY CHOICE SUPERMARKET — order '.$this->order->number)
            ->view('mail.order-confirmation');
    }
}
