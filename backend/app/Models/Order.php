<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $guarded = [];

    protected $casts = ['delivery' => 'array', 'payment_details' => 'array'];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
