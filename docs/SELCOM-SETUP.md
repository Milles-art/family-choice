# Selcom and mail setup

The frontend contract is implemented without new dependencies. Selcom remains off until the owner completes provider onboarding and sandbox testing. No live payment or deployment was performed. Sources: [Selcom API reference](https://developers.selcommobile.com/) and [Selcom’s signing client](https://github.com/selcompaytechltd/selcom-apigw-client-nodejs/blob/main/index.js).

## Backend configuration

Preserve the existing `backend/.env`. Set the following there, never in Vite variables or committed source:

```dotenv
SELCOM_ENABLED=false
SELCOM_BASE_URL=
SELCOM_VENDOR=
SELCOM_API_KEY=
SELCOM_API_SECRET=
```

Use the HTTPS API origin supplied by Selcom, without `/v1/checkout`. The public settings flag is true only if the enable flag and every value are present and the base URL is HTTPS without URL credentials. This checks configuration presence, not credential validity. Signing uses HS256 and ordered Signed-Fields, with 5-second connection / 15-second request limits and redirects disabled. Logs omit provider payloads, credentials and full payer numbers.

Before enabling the feature, back up the application database and review/apply the additive migration with `php artisan migrate`. **This task did not migrate or seed the existing database.** Do not use `migrate:fresh`. Use MySQL/PostgreSQL with a shared database/Redis cache for production row and payment locks; verify concurrent checkout on that host.

Set `APP_URL=https://familychoiceminimarket.co.tz`, then register `https://familychoiceminimarket.co.tz/api/selcom/webhook` with Selcom. The webhook payload supplies only a lookup ID. A signed outbound status request must return the same saved ID and exact TZS amount before marking paid. Completed responses must contain a transaction ID and reference. The create/wallet response alone never marks paid. No fulfillment state is advanced automatically by a payment event.

Provider order IDs are persisted before requests; request UUID retries do not repeat checkout or wallet pushes. Retry checks remote status first, enforces 45 seconds between prompts and is limited to three requests per account/order/minute. A verified declined request can be retried; a verified expired/cancelled order gets a new provider ID, retaining old IDs for late callbacks. A still-pending/ambiguous request is blocked rather than charging twice. If create timed out and the provider cannot return its status, staff must reconcile the saved ID with Selcom before further payment. There are no automatic retries of mutating provider requests.

The frontend polls stored status every four seconds while waiting. Configure the Laravel scheduler so missed callbacks are recovered independently:

```sh
# Run from backend; on the production host run schedule:run each minute.
php artisan schedule:run
# Explicit read-only verification of outstanding provider orders:
php artisan selcom:reconcile
```

Selcom routes payments using the wallet number; the selected network is recorded for the UI and the verified provider channel is saved on payment. Test all supported wallets with Selcom, signed headers, amount precision, hosted URLs, replay, decline, expiry, interrupted requests and callbacks **in the sandbox** before setting `SELCOM_ENABLED=true` for live credentials. Do not substitute live credentials for a sandbox test. Rebuild Laravel configuration cache after changing production config.

## Mail and queue

Keep `MAIL_MAILER=log` locally. Reset links/order emails then appear in protected Laravel logs and are not delivered. Log/array mail and composite transports that can fall back to log never set the public confirmation flag.

Production needs a verified sender and working SMTP configuration:

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtps
MAIL_HOST=
MAIL_PORT=465
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="FAMILY CHOICE SUPERMARKET"
QUEUE_CONNECTION=database
```

Use the scheme/port required by your mail provider (the example is implicit TLS; STARTTLS commonly uses `MAIL_SCHEME=smtp` and port 587). Do not put secrets into `.env.example`. Configure a supervised worker from `backend`:

```sh
php artisan queue:work --tries=3 --timeout=60
php artisan queue:failed
```

An order-confirmation job is dispatched after the order is saved. It skips previously sent orders, serializes sends per order, retries transport failures, and sets confirmation flags only after a supported real transport returns successfully. The flag means transport acceptance, not inbox delivery. SMTP timeouts are bounded. Queued jobs that are stalled or failed keep the flag absent; monitor/retry failed jobs. If dispatch itself fails, a safe log records the order ID; staff can enqueue `App\Jobs\SendOrderConfirmation::dispatch($orderId)` after reviewing that ID and restoring the queue. Email delivery is not mathematically exactly-once across an SMTP acceptance/process crash; reconcile uncertain sends before resending.

Password-reset requests use Laravel’s password broker, default token expiry and broker cooldown, plus independent endpoint throttling. Requests return the same neutral message for known/unknown accounts and transport failures. Invalid/expired tokens are rejected, successful resets consume the token, rotate the remember token, and remove database-backed sessions. Reset links open `/reset-password?token=...&email=...` on `APP_URL`; make sure the web server routes non-API SPA paths to Laravel. Protect mail logs, and redact reset query tokens from host access logs.

## Development demo and remaining owner details

The ignored root `.env.local` contains `VITE_MOCK_PAYMENTS=true`. Run `npm run dev` alongside Laravel and open `http://127.0.0.1:5173`. A valid demo number settles after about seven seconds; a number ending `0000` declines. Screens clearly label the demo. It sends no order/payment request to Laravel, and entries vanish on reload. Real cash/manual payments still call Laravel. Production builds ignore this flag because the mock also requires `import.meta.env.DEV`.

Keep the empty delivery areas/opening hours/address/map fields in `src/storeConfig.ts` until real details are provided. Review the Privacy Notice for payer number sharing with Selcom and retention. The saved payment phone is masked; the full normalized number is only passed to Selcom. Delivery contact data continues to be stored for fulfillment as before. Existing commercial settings, catalogue prices, photography and delivery time choices need the owner’s operational review before launch.
