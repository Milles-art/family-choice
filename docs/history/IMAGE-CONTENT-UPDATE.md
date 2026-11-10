Historical implementation record. See ../../REDESIGN-VERIFICATION.md for the current website and checks.

# FAMILY CHOICE SUPERMARKET image and content update

Updated 6 October 2026.

All 21 supplied images are placed by subject: eight categories, three homepage promotions, three About Us concepts, one delivery concept, three community images and three recipe images. The existing hero image files and product photo sources were preserved. The hero has a prominent Shop Now button.

Original files are backed up byte for byte in `artifacts/image-originals/`. `scripts/prepare-editorial-images.py` reproduces 63 WebP variants with descriptive filenames, preserving original proportions. The manifest in `public/images/editorial/manifest.json` records source and output dimensions and sizes. Responsive sources, explicit dimensions, alt text, lazy loading and CSS crops are applied to the new images. Store and human scenes carry illustrative-concept captions.

The homepage follows the requested section order, with one product discovery section after the promotions. Homepage product grids use two, three or six columns to avoid sparse extra rows. Currency labels use TZS throughout.

Community Impact explains optional choices, pledge and received-payment states, coordination, acknowledgment numbers and separately verified distribution outcomes. Current amounts, box contents, prices, campaigns, partners and totals come from the API. No donation buttons or fabricated outcomes were added. Food rescue, recurring sponsorship and standalone contribution receipts are labelled planned. The current acknowledgment and payment status are available through My Impact; they are not distribution confirmation.

The local database was missing the project's existing community schema. Its pending additive migration was applied; no example campaigns, boxes, partners or distribution records were created.

## Verification

- TypeScript check, production build and source ESLint passed. The compiled storefront and editorial assets were copied into Laravel's public directory.
- All 16 backend tests passed, covering 79 assertions including checkout and community payment/distribution workflows.
- The existing browser regression suite, adapted for the new wording, passed 79 checks with mocked API responses. It covers navigation, account, cart, checkout, error/retry states, community pages, keyboard access and mobile layouts.
- Live backend image and layout checks passed for Home, Community Impact, About Us, Delivery and Recipes at 360, 390, 768, 1440 and 1920 pixels. Editorial images loaded without horizontal overflow or JavaScript page errors.
- Original backup integrity and presence of all 63 production variants were verified.
- Screenshots and live configuration evidence are in `artifacts/editorial-qa/`; regression evidence is in `artifacts/ui/browser-results.json`.

## Information still needed

All supplied images were received. The local configuration publishes no Food Boxes, active campaigns or approved partners. Actual box contents and prices, campaigns and partner details must be configured before those choices appear as available.

Verified telephone/email details, store/pickup address and delivery-area coverage are not published. Checkout accepts an address without validating delivery-area eligibility. Current configured checkout methods include cash, with mobile money disabled locally.

An operating food-rescue process, partner responsibilities and food-safety/collection arrangements remain unconfirmed. Email/download contribution receipts and a customer recurring-payment flow are not implemented. These gaps are disclosed in the page content.

