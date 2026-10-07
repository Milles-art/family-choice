# Selcom payments: frontend contract

The storefront side is finished. When you get your Selcom credentials, your Laravel
backend only has to provide the endpoints below. Nothing in the browser holds a key.

## 1. Try the screens now (no Selcom needed)

Create `.env.local` in the project root:

    VITE_MOCK_PAYMENTS=true

Run `npm run dev`, add items, pay with "Pay now with mobile money". The demo fakes the
server: approval arrives after about 7 seconds. A phone number ending in `0000`
simulates a declined payment. This switch is ignored in production builds.

## 2. Switch it on for real

1. Add the endpoints in section 3.
2. Return `selcom_enabled: true` from `GET /api/settings`. The option is hidden until you do.
3. Keep keys in `backend/.env` only, for example:
   `SELCOM_BASE_URL`, `SELCOM_VENDOR`, `SELCOM_API_KEY`, `SELCOM_API_SECRET`.

## 3. Endpoints the frontend calls

| Call | Purpose |
| --- | --- |
| `POST /api/orders` | Existing endpoint. For Selcom it receives `paymentMethod: "selcom"`, `paymentProvider` (`mpesa`, `tigopesa`, `airtelmoney` or `halopesa`) and `payerPhone` (`2557XXXXXXXX`). Create the order, create the Selcom order, send the payment request, and return the order with `payment_status: "pending"`. If you use Selcom's hosted payment page instead, also return `payment_url`. |
| `GET /api/orders/{id}/payment-status` | Return `{ "payment_status": "pending" \| "paid" \| "failed" \| "cancelled" \| "expired", "message": "optional text" }`. Polled every 4 seconds. Read the order's stored status; do not call Selcom on every poll. |
| `POST /api/orders/{id}/payment/retry` | Body `{ "network": "...", "phone": "2557XXXXXXXX" }`. Resend the request, or create a new one if the old one expired. May return `{ "payment_url": "..." }`. Only for orders the signed-in customer owns and that are not yet paid. |
| `POST /api/selcom/webhook` | Called by Selcom. Mark the order paid. Do not trust the body alone: confirm with Selcom's order-status call, then update the order. Make it safe to run twice. |

Order JSON may include two optional fields used on the confirmation page:
`confirmation_email_sent` (true only after the email was really sent) and
`confirmation_email` (the address). If they are missing, the page tells the customer to
keep their order number instead of claiming an email was sent.

## 4. Email: confirmations and password reset

- `POST /api/forgot-password` with `{ email }`. Always answer with success so nobody can
  discover which emails are registered. Email a link to `/reset-password?token=...&email=...`.
- `POST /api/reset-password` with `{ token, email, password, password_confirmation }`.
- Laravel's built-in password broker and a mail service (SMTP, Brevo, Mailgun, etc.) cover both.
- For order confirmations, queue a mail after the order is saved, then set `confirmation_email_sent`.

## 5. Routes to allow in Laravel

The app has new pages: `/track`, `/forgot-password`, `/reset-password`. Make sure your
catch-all route serves the app's `index.html` for them, the same way it does for `/account`.

## 6. Notes on Selcom

Selcom signs every API request (headers `Authorization`, `Timestamp`, `Digest`,
`Signed-Fields`) and its Checkout API creates orders (`/v1/checkout/create-order-minimal`),
reports status (`/v1/checkout/order-status`) and calls your webhook. Community packages
exist for Laravel (`bryceandy/laravel-selcom`, `omakei/laravel-selcom`). Check the exact
fields, the wallet-payment call and webhook format against Selcom's developer docs
(developers.selcommobile.com) once your sandbox account is ready.
