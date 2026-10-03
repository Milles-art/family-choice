# FreshCart — React storefront + Laravel backend

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

The original sample USD prices and dollar display are retained. `.env` controls `STORE_TAX_RATE`, `STORE_DELIVERY_CENTS` and `STORE_FREE_DELIVERY_CENTS`. The default 8% tax and $3.99 delivery fee are sample values from the original project, not locally verified business rules. Pickup has no delivery fee. The `STORE_CURRENCY` field records the intended currency; changing it alone does not convert product prices or replace dollar symbols. Currency localization needs a separate storefront update.

Card and mobile-money payments are not integrated. No card details are collected. No confirmation email is claimed or sent. Password recovery, email verification, notification delivery, cancellation/refunds, address management and favorites persistence are not implemented in this first version. The original rewards displays remain sample UI; reward points are not earned from orders. Recipe/category/deal content and delivery time choices remain sample storefront content. Delivery capacity and actual dated scheduling require further work. Images still use external Pexels URLs.

SQLite is convenient locally. Use MySQL/PostgreSQL and verify concurrent checkout behavior before live traffic; SQLite does not provide row locks like those databases. Configure real delivery settings, currency, tax, payment provider, mail, monitoring and backups before production use. Point the web server document root to `backend/public`, run `npm run build:laravel`, configure `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, HTTPS and secure session cookies; keep `.env` and application files outside public access. Never use `php artisan serve` as a production server.

## Validation

```sh
npm run typecheck
npm run lint
npm run build:laravel
cd backend
php artisan test
```

The backend suite has 10 store feature tests plus the framework's unit smoke test (11 total), covering authentication, server prices, totals, stock rollback, retries, pickup fees, validation, order privacy and admin access. Browser visual testing was unavailable in this workspace; inspect desktop/mobile layouts after setup.

## API

All endpoints are same-origin session endpoints under `/api`. Fetch `/api/csrf` and send its `token` as `X-CSRF-TOKEN` before mutations; refresh the token after login, registration and logout. Protected routes require the session cookie.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/products`, `/settings` | Catalog and checkout settings |
| GET | `/csrf` | CSRF token |
| POST | `/register`, `/login`, `/logout` | Customer session |
| GET | `/me` | Signed-in customer |
| GET / POST | `/orders` | Customer order history / cash checkout |
| GET | `/admin/orders` | Administrator order list |
| PATCH | `/admin/orders/{id}` | Order/payment status |
| PATCH | `/admin/products/{id}` | Price in cents / stock |
