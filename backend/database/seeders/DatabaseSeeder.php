<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (json_decode(file_get_contents(__DIR__.'/data/products.json'), true) as $p) {
            Product::firstOrCreate(['id' => $p['id']], ['details' => $p, 'price_cents' => (int) round($p['price'] * 100), 'stock' => 100]);
        }
    }
}
