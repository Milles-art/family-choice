# FAMILY CHOICE SUPERMARKET — React storefront + Laravel backend

React/TypeScript storefront with a Laravel 12 database backend. The current design and local verification are documented in [REDESIGN-VERIFICATION.md](REDESIGN-VERIFICATION.md). Historical implementation notes are retained in [docs/history](docs/history).

## Included

- Redesigned homepage, information, recipe, account, cart and checkout presentation; preserved Shop catalogue, product cards, product details and shopping controls.
- All 21 supplied images as responsive WebP assets, with original image backups and locally hosted fonts. Existing hero photographs rotate every four seconds.
- All 39 original products seeded into the database.
- Cookie/session registration, login and logout; CSRF protection; authentication throttling.
- Saved customer orders, order history and owner-only order tracking.
- Optional Selcom wallet payments, disabled until configured; verified callbacks and background reconciliation.
- Queued order-confirmation emails and password recovery through Laravel’s password broker.
- Database prices and stock; checkout calculates totals on the server using integer cents.
- Transactional stock deduction; insufficient stock rolls back the whole order.
- Retry protection: the same customer/request UUID returns the existing order.
- Cash on delivery/pickup; new orders are unpaid until an administrator records payment.
- Administrator product prices/stock and order status/payment management through My Account.
- Confirmation shows the saved total even after the cart is cleared.

## Requirements

PHP 8.2 or newer with PDO, SQLite (or MySQL), mbstring, XML/DOM, tokenizer, ctype, fileinfo, curl and OpenSSL; Composer; Node.js 20 or newer; npm.

## Local setup

Run from the project root:

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

The storefront is localized for Tanzania: product prices are shown in Tanzanian shillings (TZS), deliveries use Tanzanian address wording, and checkout accepts Tanzanian mobile numbers beginning with `+255` or `0`. `.env` controls `STORE_TAX_RATE`, `STORE_DELIVERY_CENTS` and `STORE_FREE_DELIVERY_CENTS`; the supplied defaults are 18% tax, TZS 5,000 delivery and free delivery from TZS 75,000. Confirm these commercial settings with your accountant and operations team before launch. Pickup has no delivery fee. Monetary values are stored in cents internally, while the storefront displays whole TZS.

Cash payment is available immediately. Manual mobile-money confirmation remains separately configurable with merchant instructions and staff verification. Selcom automatic wallet payment is implemented but **disabled by default**; it requires HTTPS provider configuration, credentials and a successful sandbox payment before enablement. It does not collect PINs or card details. Payment polling reads stored status; callbacks and the scheduled reconciliation command confirm the provider’s order ID and exact amount before marking paid.

Order confirmations are queued. The local log/array mailer never sets `confirmation_email_sent`; that flag appears only after a real mail transport accepts the message, not as a guarantee of inbox delivery. Password recovery uses Laravel’s broker with neutral request responses and SPA reset links. See [Selcom and mail setup](docs/SELCOM-SETUP.md) and [handoff verification](docs/SELCOM-HANDOFF-VERIFICATION.md).

Email verification, cancellation/refunds, address management and server-side wishlist synchronization remain unimplemented. Wishlist selections are stored locally. Recipe/category/deal content and delivery time choices remain sample storefront content. Delivery capacity and actual dated scheduling require further work. Supplied editorial/hero images are hosted locally; product photo sources and supplier prices are unchanged. Community Impact remains removed from the active storefront and APIs.

## Tanzania launch checklist

- Appoint a data-protection contact, register as required with the PDPC, and have the supplied Privacy Notice reviewed for your business.
- Set `APP_TIMEZONE=Africa/Dar_es_Salaam`, production database credentials, HTTPS, `APP_DEBUG=false`, secure session cookies, backups and error monitoring.
- Set real supplier prices and inventory by importing the database catalog. See `backend/docs/PRODUCT_IMPORT.md`.
- Before enabling Selcom, obtain credentials, register the webhook, configure the queue/scheduler and verify sandbox success, cancellation, decline and timeout recovery. Keep the separate manual workflow disabled unless staff can verify it.

SQLite is convenient locally. Use MySQL/PostgreSQL and verify concurrent checkout behavior before live traffic; SQLite does not provide row locks like those databases. Configure real delivery settings, currency, tax, payment provider, mail, monitoring and backups before production use. Point the web server document root to `backend/public`, run `npm run build:laravel`, configure `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, HTTPS and secure session cookies; keep `.env` and application files outside public access. Never use `php artisan serve` as a production server.

## Validation

```sh
npm run typecheck
npm run lint
npm run build:laravel
cd backend
php artisan test
```

The backend suite covers authentication, server prices, totals, stock rollback, retries, pickup fees, privacy requests and audit logging, plus signed Selcom requests, payment verification/replays, ownership/throttling, password recovery and honest mail flags. Desktop/mobile browser checks and results are documented in [REDESIGN-VERIFICATION.md](REDESIGN-VERIFICATION.md).

The Laravel build copies frontend assets, images and fonts into `backend/public`. It removes obsolete hashed bundles while retaining the current build and the preceding served build's imported chunks. Browser screenshots are generated local output; original image backups and JSON verification records remain intact.

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

Additional API endpoints: `GET /api/orders/{id}/payment-status`, `POST /api/orders/{id}/payment/retry`, `POST /api/selcom/webhook`, `POST /api/forgot-password` and `POST /api/reset-password`. Only the Selcom webhook is exempt from CSRF; payment status/retry require the owning account.
