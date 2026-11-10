# FAMILY CHOICE SUPERMARKET — cPanel launch

Account: `afyabgzo`. Domain: `familychoiceminimarket.co.tz`. Existing domain root: `/home/afyabgzo/familychoiceminimarket.co.tz`. Leave `afyaguard.org` and `/public_html` untouched.

## 1. Upload privately

In cPanel File Manager, open `/home/afyabgzo`, upload the provided `family-choice-cpanel-*.zip`, and extract it there. The application will be `/home/afyabgzo/family-choice/backend`. If `family-choice` already exists, stop and use a new release folder; do not overwrite an existing site blindly. The archive contains built frontend assets, all 247 matched WebPs, Laravel code/migrations/catalogue, and production-only PHP dependencies. It contains no credentials, database, local users, orders, or logs. Node.js and Composer are not required on the host to serve this package.

Keep the domain document root unchanged until the following setup and checks are complete. Delete or move the uploaded ZIP outside all public domain roots after extraction.

## 2. Create the separate database and private configuration

Use MySQL Database Wizard to create a new database and user, granting privileges only for that database. Record the full cPanel-prefixed names and keep the password private. Do not reuse another website's database.

Enable File Manager's “Show Hidden Files”. Copy `backend/.env.cpanel.example` to `backend/.env`, then edit the copy privately. The cPanel template uses the owner's supplied database and username, both `afyabgzo_familychoice`, and defaults to MySQL host `localhost`; confirm that hostname if connection fails. Enter the database password privately. Set real SMTP details and sender mailbox. `APP_URL` is already `https://familychoiceminimarket.co.tz`; production debug is off and sessions require HTTPS. Keep Selcom/manual mobile money disabled until payment setup is tested. Review the delivery and tax values with the owner before accepting orders. Preserve an existing production APP_KEY if replacing a live installation; generate a key only for this new installation.

Do not upload the development `.env`. Do not paste database, email, or payment secrets into chat. Set `.env` permissions to 600 where compatible with the account's PHP handler. Only `storage` and `bootstrap/cache` need PHP write access; never use 777.

## 3. One-time SSH setup

Use cPanel Terminal or SSH. The owner verified PHP 8.5.11 CLI at `/usr/local/bin/php` on server241. The commands below use `php`, which resolves to that binary in the current Terminal. Composer was not found on PATH; the release already includes production dependencies and does not require a Composer install on the host.

```sh
cd /home/afyabgzo/family-choice/backend
php -v
php -m
php vendor/composer/platform_check.php
php artisan --version
```

Required extensions include PDO with MySQL, mbstring, cURL, DOM/XML, Fileinfo, OpenSSL, Ctype, Tokenizer, and Session. Ask hosting support for the PHP CLI path if the shell PHP differs. Then, only against the new empty supermarket database:

```sh
php artisan key:generate --force
php artisan migrate --force
php artisan freshcart:products:import database/catalog/family-choice-products.json
php artisan freshcart:admin:create YOUR_OWNER_EMAIL "Owner Name"
php artisan optimize
php artisan migrate:status
php artisan store:preflight
```

Replace `YOUR_OWNER_EMAIL` with the actual administrator email. The admin command prompts privately for a password. It does not promote a customer account silently. Do not use `migrate:fresh`, `db:wipe`, or `db:seed`. All migrations, including cancellation/payment tracking, must be applied on the new database. Resolve preflight failures before accepting orders. The catalogue import expects 247 unique products and preserves the three duplicate aliases.

## 4. Background processing using cPanel Cron Jobs

The confirmed PHP CLI path is `/usr/local/bin/php`. Add separate every-minute jobs (`* * * * *`). Shared hosting may impose longer minimum intervals; ask the provider if that applies. Logs below are private and require retention/rotation.

```sh
cd /home/afyabgzo/family-choice/backend && /usr/local/bin/php artisan schedule:run >> storage/logs/scheduler-cron.log 2>&1
cd /home/afyabgzo/family-choice/backend && /usr/bin/flock -n storage/framework/queue-worker.lock /usr/local/bin/php artisan queue:work --stop-when-empty --max-time=50 --timeout=40 --tries=3 >> storage/logs/queue-cron.log 2>&1
```

Verify `flock` exists at that path before adding the queue job. If unavailable, ask the host for a supported worker/locking method. Do not start overlapping workers without confirming the queue's reservation/retry settings. A short-lived cron worker can introduce up to a minute of email delay; it is not an always-running supervised worker. Send a password-reset email and a staging order confirmation, inspect queued/failed jobs, and confirm both cron jobs actually run. Review unpaid-order expiry policy before leaving the scheduler active.

## 5. Point the domain to the ready application

Back up the current addon-domain files first if they contain anything. In cPanel Domains → Manage `familychoiceminimarket.co.tz`, set Document Root to:

`/home/afyabgzo/family-choice/backend/public`

cPanel may ask for a path relative to home: `family-choice/backend/public`. If the provider prevents custom roots outside `public_html`, ask support to set this root; do not move the whole Laravel backend into a public directory. Confirm the domain and `www` DNS point to this hosting account, verify their SSL certificates, then enable Force HTTPS Redirect for this addon domain only. Do not change the primary domain root.

The public directory includes Laravel's index.php and .htaccess; the generated index.html serves the React app through Laravel routing. Check that `/api/products` returns JSON, `/shop` reloads correctly, and `/up` works. Confirm `.env`, `/vendor`, `/storage/logs`, and database files are inaccessible through HTTP. Enable HSTS only after HTTPS works, and CSP enforcement after checking real-host browser reports.

## 6. Final live checks

Verify browsing, all product images, 24-item pagination, phone/desktop layouts, categories/search/sort, cart/wishlist, account registration/login/password reset, an authorised test cash/pickup order, its email and admin fulfilment/cancellation. Verify secure cookies, static/application response headers, delivery/tax totals, staff access, and backups including a restoration into a separate environment. Test real payment-provider success/failure/timeouts/webhooks before enabling online payment collection. Inventory is owner-confirmed available without numeric counts; automatic numeric stock limits apply once actual counts are entered.

Set up database/file backups and private error/failed-job monitoring. Recheck production dependency advisories before launch. The local package validation does not prove public TLS, cron/SMTP delivery, MySQL permissions, payment settlement, or hosting capacity. No live deployment or host database changes were performed while preparing this package.

References: [Laravel deployment](https://laravel.com/framework/docs/12.x/deployment), [cPanel Cron Jobs](https://docs.cpanel.net/cpanel/advanced/cron-jobs/), [cPanel addon document roots](https://support.cpanel.net/hc/en-us/articles/360057802373-How-do-I-change-the-document-root-for-an-Addon-Domain-or-Subdomain).
