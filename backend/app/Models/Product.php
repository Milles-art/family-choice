<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'details', 'price_cents', 'stock'];

    protected $casts = ['details' => 'array'];

    public function storefront(): array
    {
        return array_merge($this->details, ['id' => $this->id, 'price' => $this->price_cents / 100, 'inStock' => $this->stock > 0, 'stock' => $this->stock]);
    }
}
