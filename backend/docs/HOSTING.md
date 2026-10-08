# Hosting FAMILY CHOICE SUPERMARKET

The storefront can be tested privately, but public order-taking requires the business-data and infrastructure checks below. No deployment has been performed.

## Before accepting real orders

- Confirm and import supplier-approved TSh prices, pack sizes, stock and product photographs. The local API and seed catalogue disagree; do not change currency labels or multiply amounts to guess a correction.
- Confirm delivery coverage, charges, available times and pickup arrangements. The current time-slot labels are static preferences, not a capacity-controlled scheduling system.
- Confirm the public phone and email. The existing email uses `familychoicesupermarket.co.tz`, while the supplied website domain is `familychoiceminimarket.co.tz`; a working inbox on the new domain has not been confirmed.
- Confirm the tax treatment and cash collection process. Mobile money is optional and uses staff confirmation; no payment gateway or verified webhook exists.
- Arrange account recovery, staff access, order monitoring and handling of privacy/erasure requests. Password reset and order emails are not implemented.

## Host configuration

1. Use a PHP >= 8.2 host with Laravel's required extensions and Composer. Point the web root to **backend/public**, never the repository root. Keep `.env`, database files, source, backups and verification artifacts outside public access.
2. Configure DNS and HTTPS for `familychoiceminimarket.co.tz`. Configure server redirects and certificate renewal. Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://familychoiceminimarket.co.tz`, the exact brand in `APP_NAME`, and `SESSION_SECURE_COOKIE=true`. Preserve the application key when moving existing encrypted/session data.
3. Use MySQL/PostgreSQL for the intended transactional checkout. Verify simultaneous purchases of the last stock item on the actual host; SQLite testing does not verify production row locks.
4. Set verified store fees/tax and database credentials in the host environment. Configure storage/cache directory permissions, mail when implemented, logs, retention, monitoring and backups. Restore a backup into a separate environment to prove recovery.
5. Build with `npm ci` and `npm run build:laravel`, and install backend production packages with `composer install --no-dev --optimize-autoloader`. Vite's development server and `php artisan serve` are local tools, not production servers.
6. Review pending migrations against a backed-up staging copy. No migration or seed command was run against the application database during this audit. Do not blindly seed or overwrite the existing catalogue. Historical removed-feature tables remain preserved.
7. Run `php artisan store:preflight`. This is read-only and prints no secret values. Its result checks configuration, not business accuracy or internet deployment.
8. Complete staging smoke checks for registration, login, cart, wishlist, checkout, order history, admin stock/payment updates, reload routes, HTTPS, secure cookies, CSRF rejection, authentication/authorization and error responses with debug disabled. Confirm backups, logs and health monitoring. Cache configuration/routes on the host after environment setup.

## Dependency and security limits

The audit applied compatible npm updates. Remaining development/build advisories require a planned Vite/Tailwind migration; no forced breaking upgrade was applied. Keep build/development tools restricted to trusted input and loopback/private access. The served production bundle does not run Vite or Tailwind tooling.

Application responses now set content-sniffing, frame and referrer protections; API responses are private and not cacheable. Configure matching protections for static files in the actual web server. HTTPS/HSTS, proxy trust, firewall rules, database protection, TLS and public-server settings must be checked on that host.

Source: [Laravel deployment documentation](https://laravel.com/framework/docs/12.x/deployment), checked 7 October 2026. This document is a launch procedure, not proof that the host is configured.
