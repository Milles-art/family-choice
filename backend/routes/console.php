<?php

use App\Models\User;
use App\Models\Product;
use Illuminate\Support\Facades\Artisan;

Artisan::command('freshcart:admin {email}', function () {
    $user = User::where('email', $this->argument('email'))->first();
    if (! $user) {
        $this->error('Register this account in the storefront first.');

        return 1;
    }
    $user->forceFill(['is_admin' => true])->save();
    $this->info('Administrator access granted.');
});

Artisan::command('freshcart:products:import {path : JSON catalog file with prices in whole TSh}', function () {
    $path = base_path($this->argument('path'));
    if (! is_file($path)) {
        $this->error('Catalog file not found: '.$path);

        return 1;
    }

    $products = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
    if (! is_array($products)) {
        $this->error('The catalog must be a JSON array.');

        return 1;
    }

    foreach ($products as $item) {
        if (! is_array($item) || ! isset($item['id'], $item['name'], $item['price']) || ! is_numeric($item['price']) || $item['price'] < 1) {
            $this->error('Each product requires an id, name and whole-TSh price of at least 1.');

            return 1;
        }
    }

    foreach ($products as $item) {
        Product::updateOrCreate(
            ['id' => $item['id']],
            ['details' => $item, 'price_cents' => (int) round($item['price'] * 100), 'stock' => $item['stock'] ?? 100]
        );
    }

    $this->info(count($products).' products imported.');
})->purpose('Import a Tanzania Shilling catalog without overwriting source code');
