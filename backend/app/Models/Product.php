<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = ['details' => 'array'];

    public function storefront(): array
    {
        return array_merge($this->details, ['id' => $this->id, 'price' => $this->price_cents / 100, 'inStock' => $this->stock > 0, 'stock' => $this->stock]);
    }
}
