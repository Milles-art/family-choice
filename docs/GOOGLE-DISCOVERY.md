# Google discovery update

## What was checked
On 9 October 2026 the apex domain resolved to 199.188.200.89, HTTPS responded successfully, and HTTP redirected to HTTPS. The www address also responded without redirecting to the apex. The live sitemap URL returned the SPA HTML instead of XML. These are point-in-time checks, not uptime or real-user performance measurements.

## Implemented locally
- Laravel serves public page metadata and readable catalogue/product HTML before JavaScript loads, for every visitor. React retains the existing shopping interface.
- Database-backed XML sitemap includes existing product URLs and nonempty categories. Private, search and empty offer selections are excluded. Product URLs use /products/FC-001. Existing /product?id=FC-001 links redirect permanently (301) to the new URL. Product IDs and database records are unchanged.
- Individual titles, descriptions, canonicals, sharing metadata, business/product/breadcrumb structured data. Offers use confirmed stored TZS prices and availability; no invented reviews.
- Private and search pages use noindex; unknown pages/products/categories return HTTP 404. Temporary database failures return 503 with Retry-After.
- Real navigation, category and product links; catalogue pagination survives reload and browser history.
- Apache redirects the www domain and HTTP to the apex HTTPS domain, preserving request methods. Existing favicon, images and shopping APIs remain intact.

## Upload to cPanel
Back up the existing application files first. Extract `family-choice-google-discovery-update.zip` inside `/home/afyabgzo/family-choice/backend`, replacing the matching files. It contains relative public/, app/, config/, resources/ and routes/ paths. Include the hidden public/.htaccess file. It contains no .env, credentials, database, migrations or vendor dependencies.

In Terminal:

```sh
cd /home/afyabgzo/family-choice/backend
php artisan optimize:clear
php artisan config:cache
```

Check HTTPS homepage, /shop, a real product URL, /sitemap.xml (XML), /robots.txt and a nonexistent URL (404). Check www and HTTP redirects, product images, login, cart and checkout. No migrations, reimport or payment configuration are required.

## Google Search Console: owner setup required
1. Open https://search.google.com/search-console and sign in to the owner's Google account.
2. Add a **Domain** property: `familychoiceminimarket.co.tz`.
3. Copy Google's `google-site-verification=...` TXT record. Add it at the authoritative DNS provider (cPanel Zone Editor only if it manages the domain's DNS). Preserve existing DNS and mail records.
4. Return to Search Console and verify after the record becomes visible. Do not share the Google password.
5. Once the update is uploaded, submit `https://familychoiceminimarket.co.tz/sitemap.xml` under Sitemaps.
6. Inspect the homepage, shop and a real product URL; request indexing and review Google's crawling/indexing results.

Domain verification uses DNS; no fabricated verification file is included. The code supports an optional GOOGLE_SITE_VERIFICATION environment value if a URL-prefix property uses a meta tag instead.

## Remaining owner tasks
Create or claim an eligible Google Business Profile with the consistent full business name, phone and Mafiga Shell, Morogoro location. Confirm the exact map pin and days/holiday opening hours; the site only states the supplied 8 AM–9 PM hours. Keep the paused terms/refund/privacy approval and accountant tax review pending. Automated email delivery still needs its own working SMTP configuration. Payment approval remains separate. Indexing and rankings are not guaranteed; review Search Console and real-user performance after upload.

## Validation
TypeScript, ESLint and production build passed. All 67 backend tests passed (4,061 assertions), including XML sitemap, raw HTML product content, canonical pagination, 404/noindex rules, escaping and confirmed offer prices. Isolated browser fixtures checked 360, 390, 768, 1024, 1440 and 1920px, cart stock limits, wishlist, pagination/reload/back, search/category metadata and drawer focus. No JavaScript exceptions were observed. These browser checks use local catalogue fixtures, not live customer orders or payments.

Latest compiled JavaScript totals about 489 KB raw / 127 KB gzip in two chunks; CSS is about 98 KB raw / 19 KB gzip. Compared with the preceding build, the principal app chunk grew approximately 6 KB raw. No dependencies were added. These are bundle sizes, not Core Web Vitals; real-user performance and hosted redirects must be checked after upload.

Official guidance: https://support.google.com/webmasters/answer/9008080 and https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics .

## Clean product links update
Use `family-choice-clean-links-update.zip` for the latest product links change. Extract into the same backend directory and run the two cache commands above. Both React navigation and Laravel HTML/sitemap use `/products/FC-011`. Legacy `/product?id=FC-011` links receive a 301 redirect. Existing product IDs, images, prices and cart data are unchanged. No migration or product import is required. Check an old product URL and its new destination before submitting the sitemap. The six focused SEO tests passed (71 assertions), including legacy redirects and canonical destinations; pure routing checks cover new URLs, old URL parsing and malformed paths.
