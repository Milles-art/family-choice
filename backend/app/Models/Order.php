<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $guarded = [];

    protected $casts = ['delivery' => 'array'];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
