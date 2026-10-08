<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['user_id', 'request_id', 'number', 'status', 'payment_status', 'delivery', 'delivery_option', 'time_slot', 'payment_method', 'payment_details', 'subtotal_cents', 'delivery_cents', 'tax_cents', 'total_cents', 'selcom_order_id', 'payment_transaction_id', 'payment_reference', 'payment_channel', 'masked_payer_phone', 'payment_url', 'payment_message', 'paid_at', 'confirmation_email_sent_at', 'confirmation_email', 'cancelled_at', 'stock_restored_at', 'cancel_reason', 'reconciliation_stopped_at'];

    protected $casts = ['delivery' => 'array', 'payment_details' => 'array', 'paid_at' => 'datetime', 'confirmation_email_sent_at' => 'datetime', 'cancelled_at' => 'datetime', 'stock_restored_at' => 'datetime', 'reconciliation_stopped_at' => 'datetime'];

    protected $hidden = ['confirmation_email_sent_at', 'confirmation_email'];

    public function toArray(): array
    {
        $data = parent::toArray();
        if ($this->confirmation_email_sent_at) {
            $data['confirmation_email_sent'] = true;
            $data['confirmation_email'] = $this->confirmation_email;
        }

        return $data;
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
