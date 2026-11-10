Historical implementation record. See ../../REDESIGN-VERIFICATION.md for the current website and checks.

# FAMILY CHOICE SUPERMARKET UI implementation and verification

## Implemented

- Shared 16px mobile gutters, 24px tablet gutters, 40px desktop gutters at 1440px and 48px at 1920px. Storefront content has a generous 1920px cap; forms and reading content use smaller deliberate caps.
- Product grids add columns as space becomes available. Measured section widths are 1360px at 1440px and 1824px at 1920px, with five and seven columns respectively. Catalogue sidebars use the same gutters.
- Shared brand, typography, spacing, radius, surface, border, elevation and motion tokens. Light neutral backgrounds, restrained promotional gradients, soft borders, pointer-only hover lift, visible focus, and reduced-motion overrides.
- Homepage hierarchy: shopping hero, categories, deals, best sellers, new arrivals, delivery/order benefits, Community Impact, recently viewed and recipe navigation.
- Exact full brand name in customer-facing source, header, footer, page content and metadata. Existing local-storage identifiers remain unchanged to preserve saved carts and wishlists.
- Shop dropdown, Account/Orders/My Impact navigation, prominent search, wishlist and cart. Search supports Arrow keys, Enter, Escape, named suggestions, no-results messaging and clear actions. Mobile navigation uses a separate focus-managed menu.
- Cart, mobile menu and filters support Escape, contained focus, scroll locking and restoration. Header height is measured so scroll/focus offsets account for responsive wrapping and text resizing. Skip link and page-change focus are provided.
- Complete product names, pack size, TSh prices, original prices, a single discount badge, stock text, stable purchasing controls, and contained product photography. Failed product photos use an honest unavailable-image fallback.
- Independent catalogue/settings/impact fetching with real skeletons, retries, retained background data, online/visibility refresh, and no artificial loading delays. Wishlist/cart feedback is immediate because those features use local state.
- Visible checkout/account labels, autocomplete, field-level validation, preserved values after errors, pending submission controls, separate groceries/delivery/tax/contribution totals and an expandable summary. An in-memory checkout draft survives navigation to Account, without persisting address or payment-reference data to browser storage.
- Contributions default to none. Checkout success requires an actual successful server response. Payment and impact messaging distinguishes unpaid orders, pledged contributions, received payments and verified distributions.
- Lottie runtime is loaded only when needed; reduced motion uses static icons. Playback pauses offscreen or in hidden tabs, and confirmation playback completes once. Cart feedback uses lightweight CSS.
- Same existing editorial hero photograph served locally as responsive WebP variants. Below-fold product images are lazy-loaded; the hero has high fetch priority and reserved dimensions. No fonts or animation libraries were added.
- Fixed the missing allocation-to-distribution Eloquent relationship, which caused My Impact to return 500 after staff allocations. Added a regression test covering the complete payment/allocation/verification workflow.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build:laravel`: passed. This rebuilds local frontend files only; it does not deploy or migrate a database. The build-copy script includes the new image assets and preserves older hashed assets for already-open tabs.
- Laravel: 16 tests, 79 assertions passed with SQLite `:memory:`. Coverage includes auth, server-side prices, stock rollback, idempotent checkout retries, optional contributions, admin authorization and verified community outcomes.
- Headless Edge browser checks: 72 passed using controlled API fixtures. The suite verifies 360, 390, 768, 1024, 1440 and 1920px on home, catalogue, product detail, checkout, admin and Community Impact. It also checks 320px reflow, 200% text resizing, and disabled card transitions under reduced motion. Other existing pages receive destination and overflow checks.
- Keyboard search, filter reset, wishlist, cart focus trap/restoration, mobile menu, checkout validation, failed checkout/retry, draft preservation, account error preservation, empty impact/campaign states, initial loading/failure/retry, and failed background refresh retention are exercised.
- Read-only smoke test against the real Laravel server confirms the homepage brand and products load, with zero JavaScript errors and zero console errors. No real orders, sign-ins, inventory edits or contribution mutations are issued by this smoke test.
- Core color-pair calculations exceed 4.5:1: primary button 7.13:1, body 13.86:1, muted text 6.38:1, secondary text 4.69:1, errors 6.47:1. These checks cover shared tokens, not every possible rendered combination.
- Screenshots: [desktop](../../artifacts/ui/desktop-preview.png), [mobile](../../artifacts/ui/mobile-preview.png), [live Laravel](../../artifacts/ui/live-laravel-preview.png). Detailed results are in `artifacts/ui/browser-results.json`, `contrast-checks.json` and `live-smoke.json`.

## Performance evidence

Baseline production JavaScript was 336.10kB (89.11kB gzip). Final initial application JavaScript is 267.97kB (76.75kB gzip), about 20% smaller uncompressed. The optional Lottie chunk is 170.44kB (34.46kB gzip) and is not required for homepage shopping. CSS changed from 30.67kB to 32.29kB.

Single local production-browser traces at 1440×1000, using identical catalogue/settings fixtures, recorded LCP 7.164s before and 4.368s after local hero optimization; CLS was 0 in both. An intermediate remote-photo trace was 13.132s, which prompted local responsive image assets. The final trace still does not reach the 2.5s good LCP threshold. These unthrottled traces include local machine/server scheduling and external photo delivery variability; they are lab evidence, not real-user Core Web Vitals. No field INP or CrUX results are claimed. Raw records are in `baseline-lab.json` and `after-lab.json`.

## Content flags and remaining limits

- `p1` Organic Bananas and `p8` Fresh Watermelon share Pexels photograph 8743922. At least one product/photo association needs correction. The source records and supplier imagery were not silently changed.
- Seed catalogue price relationships are valid, but supplier/current retail prices cannot be independently verified from this repository. Existing API prices are used without currency relabelling or invented conversions. Ratings, nutrition and descriptive product claims in existing seed data also need business verification.
- Placeholder phone/email addresses, inactive social links and nonfunctional subscription buttons have been replaced with clear availability messages or working existing destinations. Verified contact details and a working newsletter service still need the owner’s input. Existing delivery-area content and preferred time-slot choices remain; operational coverage and scheduling should be confirmed by the owner.
- The privacy notice still identifies itself as a template requiring owner/legal completion. No partnerships, refunds, reviews or impact totals were invented.
- Accessibility work targets relevant WCAG 2.2 AA behavior, with keyboard, reflow, motion and contrast checks. This is not a full accessibility certification; screen-reader/device testing and a full page-by-page audit remain appropriate.
- Admin order/inventory UI and Community Impact backend workflows are preserved. This task does not add a new interface for every existing administrative API endpoint.
- `.env`, store data and pre-existing source work were preserved. No deployment, migrations against the store database, real checkout submissions, or destructive database changes were performed.

## Reproducing checks

Use the installed workspace Playwright package (the scripts currently resolve the bundled Windows runtime path). Start `npm run preview -- --host 127.0.0.1` for the production fixture suite, then run `node scripts/ui-browser-check.mjs`. The real server smoke test expects Laravel at port 8000 and performs GET requests only. The original baseline script describes the previous UI and is retained as measurement provenance; it should not overwrite the recorded baseline after this implementation.

Latest brand/header verification: typecheck, lint and Laravel production build passed. Browser fixture suite passed 76 checks, including on-demand search focus/Escape, widths 360/390/768/1024/1440/1920, cart/wishlist/account/checkout, mobile drawer and reduced motion. Read-only Laravel smoke showed FAMILY CHOICE SUPERMARKET, 32 product cards and zero JavaScript/console errors.

Minimal-card update: Shop navigates directly to catalogue; wishlist heart and icon-only cart align left/right. Typecheck, lint and production build passed; live Laravel smoke returned 32 cards with no JavaScript or console errors. Browser regression checks updated to use direct New Arrivals navigation.
Final minimal-card regression suite: all 79 browser checks passed.

Hero slideshow verification: typecheck, lint and Laravel production build passed. All 79 fixture-based shopping regression checks passed. Live read-only hero checks verified decoded images, all four slides at 360/390/768/1024/1440/1920px, zero horizontal overflow, unchanged hero height between slides, reduced-motion autoplay disabled, working pause/play and bakery shopping link, with no JavaScript page errors. Screenshots: artifacts/ui/hero-390.png and hero-1440.png. Images are editorial owner assets; no product photographs/prices were replaced.

Dark reference hero: typecheck, lint, build and whitespace check passed. All four slides decoded and retained identical hero height with no horizontal overflow at 360/390/768/1024/1440/1920px. Thumbnail selection, reduced-motion behavior, pause/play and shopping destination checks passed. Updated screenshots are hero-390.png and hero-1440.png.

