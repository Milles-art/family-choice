# Security hardening handoff — 8 October 2026

Implemented on `codex/security-hardening`. Visual styling is preserved; new cancellation and review states reuse existing classes. No deployment, real database migrations, seeds, secret changes or destructive Git operations were performed.

## Completed

- A1: transactional order cancellation locks orders/products, restores stock once, blocks paid/delivered cancellation and reopening, verifies Selcom before cancellation, supports owner/admin cancellation and scheduled expiry, records late verified payment for staff review, blocks further payment requests and caps open unpaid orders without breaking request-ID retries. Checkout totals and existing Selcom signed ID/amount verification remain server-owned.
- A2: trusted proxy IP/CIDR configuration defaults to no trust and works with cached Laravel configuration. Spoofed forwarded headers are ignored without a trusted proxy. Hosting/preflight instructions cover real-device IP, HTTPS and rate-limit verification.
- A3: payment reconciliation skips paid/cancelled orders, backs off by attempt age and stops outbound checks after the configured window, recording one order-only warning/marker for manual review.
- A4: hidden-password admin creation, explicit existing-account promotion/confirmation, verified administrator API access, admin throttle and optional IP/CIDR restrictions. Public customer email verification remains unchanged.
- B1: Permissions-Policy, configurable off/report-only/enforced CSP, HTTPS-only opt-in HSTS, Apache static header block and Nginx instructions. CSP permits only required local assets, existing Pexels photos, Lottie asset origin and pinned WASM URLs. React style attributes and WASM compilation are explicitly permitted; general JS eval/inline scripts are not.
- B2/B3: production/local templates, read-only preflight updates, explicit model fillable lists and public settings whitelist.
- B4/B5: separate email/IP plus IP login/registration limits; production breached-password checks with fail-open network errors and no password logging; Selcom disclosure and masked payment-phone wording in Privacy Notice. Owner legal review is required.
- B6/C: Composer and production npm audit CI steps; compatible Vite 6.4.4/plugin updates remove Vite/esbuild advisories. The existing resend cooldown is already 45 seconds and is covered by an automated assertion.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build:laravel`: passed using Vite 6.4.4.
- `node scripts/launch-copy-check.mjs`: passed 33 checks across 8 pages at 390/1440px, no uncaught JS errors.
- `cd backend && php artisan test`: passed **55 tests, 504 assertions** using SQLite in memory and fake provider/mail/queue operations.
- `node scripts/security-browser-check.mjs`: passed CSP-enforced browser checks for home, shop, privacy and cart; confirmed cancellation UI and admin late-payment flags/disabled controls. API mutations in this browser check are intercepted fixtures, never real orders.
- `node scripts/build-backend.test.mjs`: passed the build-copy regression.
- Test coverage includes stock replay, paid/delivered refusal, cancellation ownership/throttle, ambiguous/unavailable provider verification, expiry and disabled cash expiry, late paid callbacks, open-order limits/retries, each reconciliation age band, admin creation/verification/IP/throttle, login/register limiter isolation, trusted proxy and spoofed headers, settings whitelist, fillable restrictions, CSP modes/HTTPS-only HSTS, production breached-password rule/failure, static-header configuration, templates, cooldown, scheduler and preflight.

## Exact dependency audit results

Composer `composer audit --format=json`, exit 0:

```json
{"advisories":[],"abandoned":[],"filter":[]}
```

Before updates, full npm audit: **9 vulnerabilities (3 moderate, 6 high)**. After updates, full npm audit: **7 vulnerabilities (2 moderate, 5 high)**. Both before/after `npm audit --omit=dev` runs: **0 vulnerabilities**, exit 0. Full npm audit exits nonzero because these development findings remain:

- High: braces, chokidar, fast-glob, micromatch, tailwindcss.
- Moderate: postcss-nested, postcss-selector-parser.

The audit's offered fix is a Tailwind 4.3.3 major migration. Tailwind 3.4.19 is the latest available 3.x version checked; 3.4.20 is unavailable. A forced major upgrade was not applied because it changes the PostCSS/build integration and could change the required visual design. Plan a separately validated Tailwind migration before treating the build environment as fully remediated. Do not expose development/build tooling to untrusted input or the public internet. Vite/esbuild findings are resolved. Machine-readable local audit output is under ignored `artifacts/security-*.json`.

## Migration added, not applied

`backend/database/migrations/2026_10_08_000005_add_order_cancellation.php` adds nullable `cancelled_at`, `stock_restored_at`, `cancel_reason` (100 characters) and `reconciliation_stopped_at` to orders. Tests exercise it only in disposable SQLite memory. The local MySQL schema has not been changed. Cancellation/reconciliation code must not be enabled on a populated host until the reviewed migration is applied there by the migration account.

## Owner steps

1. Review this branch, the Privacy Notice with legal counsel, cancellation/expiry policy and remaining build-tool advisories. Resolve the Tailwind advisories through a separately tested migration.
2. Back up the staging database and verify restoration. Review all pending migrations, then use a schema-privileged migration account to run `cd backend && php artisan migrate --force` on staging. Do not run seed/fresh/reset commands. Verify cancellation and stock under concurrent staging checkout traffic before production.
3. Configure the private production `.env` using `.env.production.example`; set real HTTPS APP_URL, retain APP_KEY, use restricted MySQL runtime credentials, SMTP, secure sessions, warning logs, database queue/cache and verified delivery/tax settings. Never commit a populated `.env`.
4. Set actual `TRUSTED_PROXIES` IPs/CIDRs; use Cloudflare's current published ranges when applicable. Restrict direct origin access. Verify real request IP/HTTPS and separate login/forgot/webhook buckets from two devices before enabling `ADMIN_ALLOWED_IPS`.
5. Create the owner via `php artisan freshcart:admin:create owner@example.com "Owner Name"`. Use a unique password of at least 14 characters. Existing accounts require `freshcart:admin email --existing` plus verified owner confirmation. Do not register the administrator email through the public form.
6. Supervise `php artisan queue:work --tries=3`. Schedule `php artisan schedule:run` once per minute using the host scheduler. Confirm worker/scheduler health and shared cache before enabling expiry/reconciliation. Review `STORE_MAX_OPEN_ORDERS`, `STORE_UNPAID_CANCEL_MINUTES`, `STORE_UNCONFIRMED_ORDER_HOURS` and `SELCOM_RECONCILE_HOURS`. Cash expiry defaults disabled.
7. Keep Selcom disabled until sandbox verification of success, failure, timeout, retries, cancellation, expired attempts, webhook replay, older-attempt callbacks and late payment after cancellation. Confirm provider cancellation semantics with Selcom; an unpaid/pending status is a verified status snapshot, not a provider-side cancellation/refund request. Establish staff monitoring/refund procedures for `needs_review` flags.
8. Check CSP report-only events on staging, including real product image sources and animations, then enable enforcement. Enable HSTS only after real-domain HTTPS works. Verify Apache/Nginx headers on static files and application routes. Run `php artisan store:preflight`; resolve failures and manually check its infrastructure reminders.
9. Re-run frontend/backend/build/browser/audit checks before release. Build the frontend on the deployment machine; generated bundles are not committed. This branch was not deployed or pushed automatically.

Without the real host and Selcom sandbox, public TLS/proxy/firewall behaviour, worker/scheduler supervision, deliverability, live wallet callbacks, actual cancellation/refund settlement and concurrent checkout performance could not be verified. Local CSP browser checks are not proof of every future supplier image/payment redirect on the live host. This work is not a guarantee of complete security or legal compliance.

## Every changed file

Source/config/docs/tests created or changed in this task:

```text
.github/workflows/ci.yml
README.md
backend/.env.example
backend/.env.production.example
backend/app/Console/Commands/CreateAdministrator.php
backend/app/Console/Commands/ExpireUnpaidOrders.php
backend/app/Console/Commands/ReconcileSelcomPayments.php
backend/app/Console/Commands/StorePreflight.php
backend/app/Http/Controllers/PasswordController.php
backend/app/Http/Controllers/PaymentController.php
backend/app/Http/Controllers/StoreController.php
backend/app/Http/Middleware/ConfiguredTrustProxies.php
backend/app/Http/Middleware/StoreSecurityHeaders.php
backend/app/Models/Order.php
backend/app/Models/OrderItem.php
backend/app/Models/PaymentAttempt.php
backend/app/Models/Product.php
backend/app/Providers/AppServiceProvider.php
backend/app/Services/BreachedPasswordVerifier.php
backend/app/Services/OrderCancellation.php
backend/app/Services/OrderPayments.php
backend/bootstrap/app.php
backend/config/services.php
backend/config/store.php
backend/database/migrations/2026_10_08_000005_add_order_cancellation.php
backend/docs/HOSTING.md
backend/public/.htaccess
backend/routes/console.php
backend/routes/web.php
backend/tests/Feature/HardeningTest.php
docs/SECURITY-HARDENING.md
package-lock.json
package.json
scripts/security-browser-check.mjs
src/api.ts
src/components/AccountPage.tsx
src/components/PrivacyPage.tsx
src/components/TrackOrderPage.tsx
```

The previously local `scripts/launch-copy-check.mjs` and `scripts/build-backend.test.mjs` are included for reproducible verification without changing their existing logic. Production build regenerated `backend/public/index.html`, hashed bundles and copied public assets; those generated outputs/local test artifacts are not part of the security source commits. Unrelated historical artifacts/scripts and private configuration were preserved.
