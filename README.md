# FreshCart Tanzania — React storefront + Laravel backend

The original React/TypeScript storefront now uses a Laravel 12 backend with a database. This is the first connected version, ready for local setup and further development. It is not deployed.

## Included

- Original storefront design, categories, recipes and product images.
- All 39 original products seeded into the database.
- Cookie/session registration, login and logout; CSRF protection; authentication throttling.
- Saved customer orders and order history.
- Database prices and stock; checkout calculates totals on the server using integer cents.
- Transactional stock deduction; insufficient stock rolls back the whole order.
- Retry protection: the same customer/request UUID returns the existing order.
- Cash on delivery/pickup; new orders are unpaid until an administrator records payment.
- Administrator product prices/stock and order status/payment management through My Account.
- Confirmation shows the saved total even after the cart is cleared.

## Requirements

PHP 8.2 or newer with PDO, SQLite (or MySQL), mbstring, XML/DOM, tokenizer, ctype, fileinfo, curl and OpenSSL; Composer; Node.js 20 or newer; npm.

## Local setup

Run from the extracted `freshcart` folder:

```sh
npm ci
npm run build:laravel
cd backend
composer install
```

Copy `backend/.env.example` to `backend/.env` (Windows: `copy .env.example .env`; macOS/Linux: `cp .env.example .env`). Then, from `backend`:

```sh
php artisan key:generate
php artisan migrate --seed --force
php artisan serve
```

Open http://localhost:8000. Create your own account in **My Account**. The ZIP deliberately contains no users, passwords, application key or populated database.

For editing React, keep Laravel running on port 8000 and run `npm run dev` from the root folder in a second terminal. Vite proxies `/api` to Laravel. Open the URL printed by Vite. Use the same hostname consistently (`localhost` or `127.0.0.1`) when signing in.

## Enable your administrator account

Register your account through the storefront, then run from `backend`:

```sh
php artisan freshcart:admin your-email@example.com
```

Sign in again, open **My Account → Manage store**, and edit product prices, inventory, order status and payment status. Public registration cannot create administrators.

## Settings and launch work

The storefront is localized for Tanzania: product prices are shown in Tanzanian shillings (TSh), deliveries use Tanzanian address wording, and checkout accepts Tanzanian mobile numbers beginning with `+255` or `0`. `.env` controls `STORE_TAX_RATE`, `STORE_DELIVERY_CENTS` and `STORE_FREE_DELIVERY_CENTS`; the supplied defaults are 18% tax, TSh 5,000 delivery and free delivery from TSh 75,000. Confirm these commercial settings with your accountant and operations team before launch. Pickup has no delivery fee. Monetary values are stored in cents internally, while the storefront displays whole TSh.

Cash payment is available immediately. Mobile money has a safe manual-confirmation workflow, disabled by default: enable it only after configuring your merchant paybill instructions and staff verification process. It is not an automated payment gateway yet—do not enable it until provider onboarding and signed webhook verification are complete. No card details are collected. No confirmation email is claimed or sent. Password recovery, email verification, notification delivery, cancellation/refunds, address management and favorites persistence are not implemented in this first version. The original rewards displays remain sample UI; reward points are not earned from orders. Recipe/category/deal content and delivery time choices remain sample storefront content. Delivery capacity and actual dated scheduling require further work. Images still use external Pexels URLs.

## Tanzania launch checklist

- Appoint a data-protection contact, register as required with the PDPC, and have the supplied Privacy Notice reviewed for your business.
- Set `APP_TIMEZONE=Africa/Dar_es_Salaam`, production database credentials, HTTPS, `APP_DEBUG=false`, secure session cookies, backups and error monitoring.
- Set real supplier prices and inventory by importing the database catalog. See `backend/docs/PRODUCT_IMPORT.md`.
- Before enabling mobile money, complete merchant onboarding with your chosen provider and replace manual confirmation with a signed, idempotent provider webhook.

SQLite is convenient locally. Use MySQL/PostgreSQL and verify concurrent checkout behavior before live traffic; SQLite does not provide row locks like those databases. Configure real delivery settings, currency, tax, payment provider, mail, monitoring and backups before production use. Point the web server document root to `backend/public`, run `npm run build:laravel`, configure `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, HTTPS and secure session cookies; keep `.env` and application files outside public access. Never use `php artisan serve` as a production server.

## Validation

```sh
npm run typecheck
npm run lint
npm run build:laravel
cd backend
php artisan test
```

The backend suite has 12 store feature tests plus the framework's unit smoke test (13 total), covering authentication, server prices, totals, stock rollback, retries, pickup fees, validation, mobile-money safeguards, privacy requests, audit logging and admin access. Browser visual testing was unavailable in this workspace; inspect desktop/mobile layouts after setup.

## API

All endpoints are same-origin session endpoints under `/api`. Fetch `/api/csrf` and send its `token` as `X-CSRF-TOKEN` before mutations; refresh the token after login, registration and logout. Protected routes require the session cookie.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/products`, `/settings` | Catalog and checkout settings |
| GET | `/csrf` | CSRF token |
| POST | `/register`, `/login`, `/logout` | Customer session |
| GET | `/me` | Signed-in customer |
| GET / POST | `/orders` | Customer order history / checkout |
| POST | `/me/erasure-request` | Customer account-data erasure request |
| GET | `/admin/orders` | Administrator order list |
| PATCH | `/admin/orders/{id}` | Order/payment status |
| PATCH | `/admin/products/{id}` | Price in cents / stock |
