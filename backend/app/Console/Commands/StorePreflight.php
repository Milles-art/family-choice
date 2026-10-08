<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class StorePreflight extends Command
{
    protected $signature = 'store:preflight';
    protected $description = 'Read-only checks for production store configuration; does not expose secrets or change data';

    public function handle(): int
    {
        $url = parse_url((string) config('app.url'));
        $checks = [
            'Production environment' => app()->environment('production'),
            'Debug disabled' => config('app.debug') === false,
            'Application key configured' => filled(config('app.key')),
            'Correct HTTPS application URL' => ($url['scheme'] ?? '') === 'https' && ($url['host'] ?? '') === 'familychoiceminimarket.co.tz',
            'Secure session cookie' => config('session.secure') === true,
            'HttpOnly session cookie' => config('session.http_only') === true,
            'SameSite session protection' => in_array(config('session.same_site'), ['lax', 'strict'], true),
            'Production database supports checkout row locking' => in_array(config('database.default'), ['mysql', 'pgsql'], true),
            'TZS currency' => config('store.currency') === 'TZS',
            'Delivery charges are non-negative' => config('store.delivery_cents') >= 0 && config('store.free_delivery_cents') >= 0,
            'Tax rate is within 0–100%' => config('store.tax_rate') >= 0 && config('store.tax_rate') <= 1,
            'Production storefront built' => is_file(public_path('index.html')),
        ];
        foreach ($checks as $label => $pass) {
            $this->line(($pass ? 'PASS' : 'FAIL').' '.$label);
        }
        $this->warn('Configuration checks cannot verify DNS/TLS, real delivery coverage, prices, backups, payment operations or concurrent checkout on the host.');
        if (config('store.mobile_money_enabled')) {
            $this->warn('Mobile money uses manual staff confirmation. No automatic payment gateway/webhook is implemented.');
        }

        return in_array(false, $checks, true) ? self::FAILURE : self::SUCCESS;
    }
}
