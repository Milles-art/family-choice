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
            'Public HTTPS application URL' => ($url['scheme'] ?? '') === 'https' && !in_array(strtolower($url['host'] ?? ''), ['', 'localhost', '127.0.0.1', '::1', '[::1]'], true),
            'Queue is asynchronous' => config('queue.default') !== 'sync',
            'Real mail transport configured' => !in_array(config('mail.default'), ['log', 'array'], true),
            'Production log level' => config('logging.channels.stack') && config('logging.channels.single.level') !== 'debug',
            'Selcom configuration consistent' => !config('services.selcom.enabled') || app(\App\Services\SelcomService::class)->enabled(),
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
        $this->warn('Run a queue worker and scheduler; confirm their health on the host.');
        $this->warn('Trusted proxies: configure only actual proxy IPs/CIDRs. Check request IP/HTTPS and separate login, password-recovery and webhook limiter buckets from two devices.');

        return in_array(false, $checks, true) ? self::FAILURE : self::SUCCESS;
    }
}
