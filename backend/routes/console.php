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
