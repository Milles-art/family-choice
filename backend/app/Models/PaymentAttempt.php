<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentAttempt extends Model
{
    protected $fillable = ['order_id', 'selcom_order_id', 'wallet_transaction_id', 'provider_created', 'provider_status', 'last_prompt_at', 'last_checked_at'];

    protected $casts = ['provider_created' => 'boolean', 'last_prompt_at' => 'datetime', 'last_checked_at' => 'datetime'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
