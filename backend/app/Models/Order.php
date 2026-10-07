<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $guarded = [];

    protected $casts = ['delivery' => 'array', 'payment_details' => 'array', 'paid_at' => 'datetime', 'confirmation_email_sent_at' => 'datetime'];

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
