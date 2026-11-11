<?php

use App\Models\User;
use App\Models\Product;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Schedule::command('selcom:reconcile')->everyMinute()->withoutOverlapping(15);
Schedule::command('orders:expire-unpaid')->everyFiveMinutes()->withoutOverlapping(15);

Artisan::command('freshcart:admin {email} {--existing}', function () {
    if (!$this->option('existing')) {
        $this->error('Use freshcart:admin:create for a new account. Promotion requires --existing and owner confirmation.');
        return 1;
    }
    $user = User::where('email', $this->argument('email'))->first();
    if (! $user) {
        $this->error('Existing account not found. Use freshcart:admin:create.');

        return 1;
    }
    $this->line('Account: '.$user->name.'; created: '.$user->created_at.'; orders: '.\App\Models\Order::where('user_id', $user->id)->count());
    if ($user->privacy_consented_at) $this->warn('This account was created through public registration. Verify the owner before promotion.');
    if (!$this->confirm('Have you verified this account belongs to the intended administrator?', false)) return 1;
    $user->forceFill(['is_admin' => true, 'email_verified_at' => now()])->save();
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

    $ids = [];
    foreach ($products as $item) {
        if (! is_array($item) || ! isset($item['id'], $item['name'], $item['price']) || ! is_numeric($item['price']) || ! is_finite((float) $item['price']) || $item['price'] < 1 || isset($ids[$item['id']]) || (isset($item['stock']) && (!is_int($item['stock']) || $item['stock'] < 0))) {
            $this->error('Each product requires an id, name and whole-TSh price of at least 1.');

            return 1;
        }
        $ids[$item['id']] = true;
        if (str_starts_with($item['id'], 'FC-') && (!preg_match('~^/images/products/[a-z0-9-]+\.webp$~', $item['image'] ?? '') || (!is_file(public_path(ltrim($item['image'] ?? '', '/'))) && !is_file(base_path('../public'.($item['image'] ?? '')))))) {
            $this->error('Missing or invalid supplied WebP: '.$item['id']);
            return 1;
        }
    }

    \Illuminate\Support\Facades\DB::transaction(function () use ($products) {
        foreach ($products as $item) {
            $existing = Product::whereKey($item['id'])->lockForUpdate()->first();
            // A later confirmed inventory must survive a rerun of an older source.
            if (in_array($item['stockStatus'] ?? '', ['unverified', 'available'], true) && ($existing?->details['stockStatus'] ?? '') === 'confirmed') {
                foreach (['stockStatus', 'orderable', 'priceType'] as $field) $item[$field] = $existing->details[$field] ?? $item[$field] ?? null;
                $item['stock'] = $existing->stock;
                $item['price'] = $existing->price_cents / 100;
            }
            Product::updateOrCreate(['id' => $item['id']], ['details' => $item, 'price_cents' => (int) round($item['price'] * 100), 'stock' => $item['stock'] ?? $existing?->stock ?? 0]);
        }
    });

    $this->info(count($products).' products imported.');
})->purpose('Import a Tanzania Shilling catalog without overwriting source code');
