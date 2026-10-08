# Hosting FAMILY CHOICE SUPERMARKET

The storefront can be tested privately, but public order-taking requires the business-data and infrastructure checks below. No deployment has been performed.

## Before accepting real orders

- Confirm and import supplier-approved TSh prices, pack sizes, stock and product photographs. The old sample catalogue has been removed; the live catalogue is empty.
- Confirm delivery coverage, charges, available times and pickup arrangements. The current time-slot labels are static preferences, not a capacity-controlled scheduling system.
- Confirm the public phone and email. The existing email uses `familychoicesupermarket.co.tz`, while the supplied website domain is `familychoiceminimarket.co.tz`; a working inbox on the new domain has not been confirmed.
- Confirm the tax treatment and cash collection process. Selcom verification is implemented but must remain disabled until real credentials and sandbox flows are verified; manual mobile money remains a separate staff-confirmation workflow.
- Arrange account recovery, staff access, order monitoring and handling of privacy/erasure requests. Password recovery and queued confirmation emails require a real mail transport and worker.

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

## Security hardening settings

Use `.env.production.example` as a checklist, supplying private credentials on the server. Keep the application key stable. Review the additive `2026_10_08_000005_add_order_cancellation.php` migration on staging before deploying; it adds cancellation/restock timestamps, reason and a reconciliation-stop marker. It was not applied to any real database during this work. Existing administrator accounts need owner-reviewed email verification before the hardened admin API permits access.

Create the owner account first: `php artisan freshcart:admin:create owner@example.com "Owner Name"`. The password prompt is hidden and requires at least 14 characters. Use a unique password manager-generated password. Never register this email through the public form. Existing-account promotion requires `freshcart:admin email --existing` and explicit confirmation after reviewing account details. Customer email verification remains a future option; checkout does not require it.

`TRUSTED_PROXIES` defaults empty: forwarded headers are ignored. Supply comma-separated proxy IPs/CIDRs, using the current [Cloudflare published IP ranges](https://www.cloudflare.com/ips/) for Cloudflare or the actual load-balancer addresses supplied by the host. Firewall direct origin access where applicable. `*` is acceptable only when the host guarantees the application can be reached solely through its controlled proxy. Configuration is read after Laravel boots, so config caching works. On the real host verify `$request->ip()` and secure-request detection, then log in from two different devices and check that login, forgot-password and Selcom webhook rate-limit buckets distinguish them. Do not expose a public debug-IP endpoint. `ADMIN_ALLOWED_IPS` is an optional comma-separated IP/CIDR allowlist (empty disables it); it is effective only when proxy trust is correct. Admin routes require verified administrator status and permit 60 requests/minute per administrator/IP. Login allows 10/minute per lowercase email/IP plus 60/minute per IP; registration allows 5/minute per email/IP plus 30/minute per IP. Registration still reveals an existing email through validation; this is documented existing behaviour, not changed here.

`STORE_MAX_OPEN_ORDERS=3` caps open unpaid orders under the customer row lock; retried request IDs still return the saved order. Customer cancellations are owner-only, 3/minute, and limited to pending unpaid orders. Admin cancellation uses the same service. Cancellation releases reserved stock once; cancelled orders cannot be reopened or request another payment. Selcom cancellations verify all saved attempts using signed provider status calls, matching order ID and exact amount. Verification failures or unknown statuses leave the order untouched. A later verified paid callback keeps the cancelled fulfilment state, records payment, and flags staff review/refund. Staff must actively monitor and resolve these flags; an automatic refund API is not implemented.

Run the scheduler every minute and a supervised database queue worker. `orders:expire-unpaid` runs every 5 minutes with overlap prevention; `STORE_UNPAID_CANCEL_MINUTES=45` applies to verified unpaid Selcom orders. `STORE_UNCONFIRMED_ORDER_HOURS=0` disables cash/manual expiry; enabling it cancels still-pending unconfirmed orders after the selected hours. Confirm this policy with operations first. Reconciliation runs every minute but each attempt is checked only every minute for its first 15 minutes, every 10 minutes until 6 hours, then hourly until `SELCOM_RECONCILE_HOURS=48`. Paid/cancelled orders are skipped; beyond the limit, one order-only warning/marker requests manual review. Cancellation and reconciliation use a shared cache/database connection; workers must use the same configured cache store.

`STORE_CSP_MODE=off|report-only|enforce` defaults report-only. The policy permits local scripts/fonts, contained product photos from images.pexels.com, existing Lottie assets and the pinned Lottie WASM URLs on jsDelivr/unpkg. WASM compilation is allowed without general JavaScript eval. Existing React style attributes require `style-src 'unsafe-inline'`; scripts do not permit unsafe-inline. Blob workers are allowed for Lottie. WhatsApp links and Selcom top-level redirects need no extra script/frame permissions. Review browser CSP events on staging, then use enforce. A report endpoint is not configured: collect browser violations during testing or add a controlled reporting service. Development Vite HMR is outside this production policy.

`STORE_HSTS=true` sends `max-age=15552000` only for secure requests, without includeSubDomains or preload. Turn it on only after HTTPS works on the real domain and proxy HTTPS detection is correct. Static Apache responses use the guarded mod_headers block in `public/.htaccess`. For Nginx, place matching directives in the HTTPS server/static location and verify both a static asset and an application response:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
```

Permissions-Policy disables camera, microphone, geolocation and browser Payment Request; Selcom wallet payment does not require those browser capabilities. Production password registration/reset requires at least eight characters and performs a three-second breached-password range lookup: only five SHA-1 prefix characters are sent, never the password. Lookup failure allows registration/reset rather than blocking customers. The new Privacy Notice explains Selcom data sharing and masked payment-phone storage; the owner must obtain legal review of this wording.

Run `store:preflight` after setting HTTPS, database, non-debug logging, SMTP, asynchronous queue, proxies and payment configuration. It is read-only and cannot prove workers/scheduler, TLS, firewall, real payments or refund operations work. Those require real-host and Selcom sandbox tests. Full dependency audit results and local verification are recorded in `docs/SECURITY-HARDENING.md`.
