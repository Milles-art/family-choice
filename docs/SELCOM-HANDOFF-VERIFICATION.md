# Frontend handoff and payment integration — 8 October 2026

Implemented on `codex/selcom-handoff`. All three frontend ZIPs were applied in the supplied order: polish, batch2, batch3. Their visual design, photography, fonts and business configuration were retained. Subsequent frontend changes fix interaction/feedback defects only. Community Impact remains absent.

## Recoverability and scope

Local recoverable snapshots: `artifacts/selcom-handoff/before-frontend.zip` contains the previous versions of overwritten frontend paths; `before-backend.zip` contains the backend source/config/routes/tests/migrations before integration. Neither includes real `.env` secrets or the application database. Snapshots and screenshots are local, excluded through `.git/info/exclude`. The ignored `.env.local` enables the explicitly labelled development demo; production ignores it. No deployment, live provider request, real customer order, database migration or destructive Git operation was performed. Existing unrelated/uncommitted project work remains in the workspace.

## Changed files

- Supplied polish ZIP: `src/polish.css`, `src/reveal.ts`, `src/main.tsx`, `src/App.tsx`, and `src/components/{BackToTop,Header,HeroSlideshow,ProductCard,HomePage,Footer,MobileNav}.tsx`.
- Supplied batch2: `index.html`, `src/storeConfig.ts`, shared polish/App files, and `src/components/{WhatsAppButton,DeliveryAreaChecker,CartPanel,ProductCard,DeliveryPage,Footer}.tsx`.
- Supplied batch3: `src/{payments.ts,payments.css,api.ts,types.ts,routing.ts,App.tsx,main.tsx}`, `src/components/{CheckoutPage,AccountPage,MobilePaymentFields,PaymentWaiting,TrackOrderPage,PasswordReset}.tsx`, and `docs/SELCOM-FRONTEND-CONTRACT.md`.
- Backend payment integration: `app/Services/{SelcomService,SelcomException,OrderPayments}.php`, `app/Models/{Order,PaymentAttempt}.php`, `app/Http/Controllers/{StoreController,PaymentController}.php`, `app/Console/Commands/ReconcileSelcomPayments.php`, `database/migrations/2026_10_08_000004_add_payment_tracking.php`, `config/services.php`, `routes/{web,console}.php`, `bootstrap/app.php`, and `.env.example` under `backend/`.
- Mail/password integration: `backend/app/Http/Controllers/PasswordController.php`, `app/Providers/AppServiceProvider.php`, `app/Jobs/SendOrderConfirmation.php`, `app/Mail/OrderConfirmation.php`, `resources/views/mail/order-confirmation.blade.php`, and `config/mail.php`. The existing `StoreSecurityHeaders` middleware is included as the route/bootstrap dependency.
- Interaction fixes: shared card target sizing/toast offsets/modal visibility in `src/polish.css` and `Toast.tsx`; honest demo/payment/email feedback in Checkout/PaymentWaiting/payments; tracking refuses an absent requested order instead of showing another order; reset errors offer a new link and preserve values; Selcom payment state cannot be overwritten through admin controls.
- Verification: `backend/tests/Feature/PaymentsTest.php`, `scripts/selcom-{browser,payment,state,production}-check.mjs`, updated `scripts/launch-copy-check.mjs`, README, this report, setup notes and a historical-note prefix in `REDESIGN-VERIFICATION.md`.

## Verification results

- Dependency installation: `npm ci --ignore-scripts` completed using the existing lockfile. Production build confirms the required installed tooling works.
- `npm run typecheck`, `npm run lint`, `npm run build:laravel`: passed.
- `php artisan test`: **33 tests / 205 assertions passed**, including all 17 original backend tests. The suite uses temporary in-memory SQLite and fake HTTP/mail/queue transports; no live provider calls or application database changes.
- Targeted Laravel Pint check: passed.
- `node --test scripts/build-backend.test.mjs`: passed; imported chunks from the preceding build remain available while obsolete bundles are removed.
- Edge/Playwright browser assertions: **103 passed** across layout/navigation (45), payment demo/checkout (15), loading/error/password/stock states (8), production copy/brand checks (33), and production mock guard (2). Results are in `artifacts/selcom-handoff/*results.json` and `artifacts/launch-copy/results.json`.
- Shop reflow/sidebar checked at **360, 390, 768, 1024, 1440 and 1920px**. Checked stepper/heart bounds and target sizes at 360px; wishlist actions, stock limits, sorting, empty-search clearing, drawers/Escape/focus restoration, background-error recovery with usable cards retained, new SPA paths, and reduced-motion hero/decorative behavior. Floats/toasts checked for mutual overlap at 390/768/1024/1440px; floating controls hide behind modal drawers.
- Mock success and declined/retried payment flows exercised at 390/1440px. They did not call the order API. Cash checkout used controlled fixtures to verify server rejection/value retention, disabled pending submission, no premature success and no email claim without a sent flag. No real orders were placed.
- Production build hides Selcom while server settings are disabled despite the dev mock environment value. New SPA paths serve the application through Laravel. No uncaught JavaScript exceptions were observed; intentional 401/422/503 responses were part of negative-state tests.
- Built main JavaScript: 307.13 kB / 88.20 kB gzip; lazy animation chunk: 170.44 kB / 34.46 kB gzip; CSS: 91.44 kB / 18.12 kB gzip. These are bundle measurements, not real-user Core Web Vitals or a complete accessibility audit.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities. Installation reports nine existing development dependency advisories (3 moderate / 6 high); no breaking dependency upgrade was attempted.

## Previews

Local screenshots in `artifacts/selcom-handoff/`: `shop-desktop-final.png`, `shop-mobile-final.png`, `home-mobile.png`, `demo-paid-mobile.png`, `demo-declined-desktop.png`. The first supplier product photograph was confirmed loaded for the final production screenshots; this is not a catalogue-wide image/price accuracy audit.

## Still requires owner verification

Follow [SELCOM-SETUP.md](SELCOM-SETUP.md): obtain sandbox/live credentials, register the HTTPS webhook, back up/review/apply the additive migration, configure SMTP and supervised queue/scheduler, test real sandbox payment behavior and interrupted/replayed requests, supply real storeConfig details, and review the Privacy Notice for payment phone processing. Selcom stays disabled until these steps pass. SMTP acceptance/inbox delivery, real wallets/USSD, remote gateway semantics, HTTPS hosting and production-database concurrency could not be verified without the provider/host setup. Ambiguous pending payments are deliberately blocked from repeat pushes until reconciled; do not tell customers to pay twice.

No delivery areas, hours, map/address, prices, stock, tax rates or supplier imagery were invented or corrected. The local catalogue still shows legacy very low TSh prices in the previews; review those business values separately before launch. Empty storeConfig fields continue to hide unconfigured operations. The broader pre-existing host/business launch checklist still applies; passing these checks alone does not make the store ready for live automated payments.
