<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentAttempt extends Model
{
    protected $guarded = [];

    protected $casts = ['provider_created' => 'boolean', 'last_prompt_at' => 'datetime', 'last_checked_at' => 'datetime'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
