> Historical redesign report. Community Impact was subsequently removed. The current frontend handoff and payment verification are documented in [docs/SELCOM-HANDOFF-VERIFICATION.md](docs/SELCOM-HANDOFF-VERIFICATION.md).

# FAMILY CHOICE SUPERMARKET redesign

Implemented a market-green, sunflower and mint identity with locally hosted Bricolage Grotesque display typography and DM Sans body typography. Rebuilt the homepage composition, About Us, Delivery, Help, Recipes, account presentation and shared header/footer. Restyled Community Impact, cart and checkout while retaining their data and transaction handlers.

## Preserved scope

- Shop catalogue, product cards, product details, filters, sorting, prices and store logic were not edited during this redesign. `artifacts/redesign/shop-baseline.json` records the starting source hashes and computed Shop styles. The final comparison in `shop-verification.json` has no differences at 390px and 1440px.
- All 21 supplied images are used. Existing optimized responsive WebP files and original backups remain available. Hero photographs are unchanged, with a 4000ms rotation, motion-preference handling and keyboard focus pause retained.
- Contributions remain optional. Community content uses API settings and verified totals. Empty campaigns, boxes and partner lists remain hidden. Payment acknowledgment and distribution verification remain distinct.
- New CSS is scoped to redesigned page wrappers and shared chrome; protected Shop pages retain the original design system.

## Validation

- `npm run typecheck`, `npm run lint` and `npm run build:laravel` passed.
- 79 fixture-based browser regression checks passed for search, filtering, wishlist, cart focus/quantity, account errors/sign-in, checkout validation/draft persistence/retries, optional contributions, navigation and error recovery.
- Live backend image/layout checks passed across 360, 390, 768, 1440 and 1920px for Home, About, Community, Delivery and Recipes.
- Desktop and mobile visual checks covered all redesigned pages, registration, cart and every checkout step. All 21 supplied assets and both local fonts loaded; no horizontal overflow or JavaScript errors occurred. Screenshots and results are in `artifacts/redesign`.
- The live hero interval check confirmed four-second image changes. Customer pages passed the pre-launch-copy check.

No new business phone/email details, community partners, food boxes or campaigns were supplied or configured. These were not invented. Existing Help, account and My Impact navigation remain available. Successful order submission and account sign-in were exercised with controlled fixtures, without placing real customer orders or changing live account data.

This report covers the redesign and local verification; it does not claim a production deployment.
