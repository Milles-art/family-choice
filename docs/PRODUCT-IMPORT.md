# Supplied product catalogue import

## POS catalogue replacement — 2026-11-11

The storefront catalogue is now sourced from the live BiziSmart POS instead of the supplied workbook. All 121 active POS products replaced the 247 seeded products; the display pipeline (`products` table → `Product::storefront()` → `/api/products` → React) is unchanged, so no display code was rewritten.

Run `php artisan pos:products:import` from `backend` to refresh the catalogue (idempotent; `--dry-run` reports without writing, `--skip-images` leaves image files alone). The command reads the POS through the `pos` database connection (`POS_DB_*` credentials in `.env`, `POS_IMAGE_SOURCE` for the image folder) and fails loudly on unmapped POS categories, duplicate or non-URL-safe SKUs, out-of-range prices, or removals that would break `order_items` history.

Mapping and behaviour:

- POS category → storefront category: Fresh Produce → produce, Dairy & Chilled → dairy, Drinks & Water → beverages, Pantry & Staples → pantry, Household Essentials → household, Personal Care → personal-care, Snacks & Sweets → snacks, General Merchandise → general. The storefront now has exactly these eight categories; meat, bakery, frozen and baby-care were removed and their URLs return 404.
- Product id is the POS SKU. `price_cents` is `selling_price` × 100. `created_at`/`updated_at` carry over from the POS so `Product::latest()` keeps New Arrivals correct.
- Stock is the sum of non-quarantined, non-recalled, non-expired `product_batches.qty_remaining_atoms`; weight products convert atoms to whole kg. Stock status is `confirmed` (tracked, decrements at checkout); zero-stock products show as out of stock.
- Tags: `bestseller` for the 19 SKUs with POS sales, `new` for the 12 newest products (matching `NewArrivalsPage`). No `deal` tags — the POS has no active pricing rules, so `/deals` shows an empty list and is excluded from the sitemap, as before.
- Images: the best `product_images` gallery row per product is copied to `public/images/products/{sku}.webp` plus 480/960 responsive variants (ImageMagick converts non-webp sources and resizes; idempotent by filemtime). One product (FC-SD-0131 Apple) has no photo and renders the designed "Image unavailable" placeholder.

The earlier `freshcart:products:import` workbook pipeline and `backend/database/catalog/*` provenance files remain for history but are superseded. The 741 seeded `fc-*` WebPs and the meat/frozen editorial photos were removed from the repository.

Validation: TypeScript, lint, production build, and 72 backend tests (4,112 assertions) passed, including four feature tests for the POS import itself (mapped transformation, unmapped-category refusal, order-history guard, dry-run purity). Live verification after deployment: `/api/products` returns 121 rows with correct category counts, all shop/category/deal/new-arrival/product pages return 200, removed category URLs return 404, the sitemap lists all 121 product URLs plus the eight category URLs, image srcset URLs return 200, and the browser shows no console errors or broken images.

## Owner confirmation and pagination update — 2026-10-08

The owner subsequently confirmed all supplied product details, prices, and availability in this chat. `backend/database/catalog/owner-verification.json` records that confirmation and takes precedence over the earlier workbook confirmation flags during import. All 247 distinct products are now available and orderable. Customer-facing estimate/source and verification notices are removed; original provenance and the historic review manifest remain in the import records. Undocumented exact pack weights are displayed as “per pack” rather than invented.

Exact inventory counts remain unspecified. Products use an explicit owner-confirmed availability mode, expose no invented numeric counts, and retain the existing 100-item per-product request cap. Checkout validates server prices, records which items had no quantity reservation, and cancellation never adds fictitious stock for those items. If an administrator subsequently enters a measured count, normal stock limits and reservations apply to future orders.

Shop now displays 24 products per page, 11 pages total, with seven on the last page. Pagination follows filtering and sorting, resets when those controls change, and preserves cart/wishlist state. Earlier browse-only statements below describe the initial import and are superseded by this update.

Validation for this update: TypeScript, lint, production build, and 58 backend tests (1,272 assertions) passed. Updated browser checks verify pagination coverage, full-catalogue filtering/search/sorting, cart/wishlist persistence, six viewport widths, confirmed availability, and enabled checkout controls. No real checkout transaction was created during browser checks.

Imported 247 distinct products from 250 source rows in `PRODUCT IMG/Family_Choice_Inventory.xlsx`, reconciled against `all_250_products_and_prices.csv` and all 250 supplied WebPs. Images were matched by product ID, exact inventory filename, and visual inspection of ten contact sheets, never folder position. The 247 published WebPs are unchanged copies of supplied files.

Duplicate products retain alias IDs: FC-058 → FC-056, FC-059 → FC-057, FC-223 → FC-195. Alias IDs are searchable and resolve to the canonical product detail. Original candidates, price sources, approval date, workbook categories, and branch availability remain in catalogue provenance. Workbook categories are grouped into the existing storefront taxonomy, with Personal Care and Baby Care added.

The workbook approves every initial selling price on 2026-10-08. Of the unique products, 171 prices originated in retailer listings and 76 in planning estimates. Those origins remain distinguishable on customer cards. Approval does not verify branch availability or reconcile every source listing with the pictured pack.

All stock quantities and branch counts are blank in the workbook. The import JSON and public API expose unknown stock as null. The existing non-null database stock column uses a non-sellable zero placeholder, with explicit `stockStatus: unverified` and `orderable: false`; this is not a physical stock count. Cart quantities are limited by the existing 100-item per-product request cap, not a claimed inventory quantity. Both frontend and backend prevent an order or payment until availability is confirmed. A rerun preserves inventory and prices already marked confirmed in the database.

The machine-readable review file is `backend/database/catalog/import-review.json`: 65 review items concerning pack sizes, identity, source-price differences, or unverified source information. It includes an image manifest with dimensions and SHA-256 hashes. Examples requiring business reconciliation include FC-032 (1 kg pictured versus 2 kg estimate unit), FC-053 (255 g pictured versus 297 g source listing), FC-145 (2 L pictured versus 1 L listing), FC-196 (Repair & Protect shampoo versus 2-in-1 candidate), and FC-218 (single ripple cup versus a 25-cup source listing). No prices were multiplied, converted, or invented.

Rebuild the audited import with `python scripts/prepare-product-catalog.py` in an environment providing openpyxl and Pillow. Import with `php artisan freshcart:products:import database/catalog/family-choice-products.json` from `backend`. The command validates every row and supplied WebP before a transactional, idempotent import. No migrations are needed for this catalogue task.

Verification: TypeScript, frontend lint, production build, and 57 backend tests (1,265 assertions) passed. Browser checks verified all 247 public WebP URLs and prices; 360, 390, 768, 1024, 1440, and 1920 px layouts; search including duplicate aliases; sort; empty-result clearing; cart totals; wishlist; category selection; drawer Escape/focus restoration; and no uncaught JavaScript errors. Separate launch-copy checks covered the existing storefront and information pages.

Local previews: `artifacts/product-import/shop-1440.png`, `shop-390.png`, and `product-mobile.png`. No deployment, database migration, or environment-file changes were performed. The earlier security migration remains a separate production setup requirement.
