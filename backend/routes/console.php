<?php

use App\Models\User;
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
