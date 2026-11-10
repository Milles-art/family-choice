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
        $status = $this->details['stockStatus'] ?? '';
        return array_merge($this->details, ['id' => $this->id, 'price' => $this->price_cents / 100, 'inStock' => $status === 'available' || $this->stock > 0, 'stock' => in_array($status, ['available', 'unverified'], true) ? null : $this->stock]);
    }
}
