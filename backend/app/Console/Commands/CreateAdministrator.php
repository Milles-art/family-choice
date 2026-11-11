<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdministrator extends Command
{
    protected $signature = 'freshcart:admin:create {email} {name}';
    protected $description = 'Create a verified administrator using a hidden password prompt';

    public function handle(): int
    {
        $password = $this->secret('Password (minimum 14 characters)');
        $data = ['email' => strtolower($this->argument('email')), 'name' => $this->argument('name'), 'password' => $password];
        if (Validator::make($data, ['email' => 'required|email|unique:users', 'name' => 'required|string|max:100', 'password' => 'required|string|min:14|max:128'])->fails()) {
            $this->error('Invalid account details, existing email, or password shorter than 14 characters.');
            return self::FAILURE;
        }
        $user = new User(['email' => $data['email'], 'name' => $data['name'], 'password' => Hash::make($password)]);
        $user->forceFill(['is_admin' => true, 'email_verified_at' => now()])->save();
        $this->info('Verified administrator created.');
        return self::SUCCESS;
    }
}
