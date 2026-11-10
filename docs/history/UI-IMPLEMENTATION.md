Historical implementation record. See ../../REDESIGN-VERIFICATION.md for the current website and checks.

# FAMILY CHOICE SUPERMARKET UI implementation checklist

Preserve the current React/TypeScript and Laravel features, uncommitted work, `.env`, and database. No deployment or migrations against the store database.

- [x] Record baseline build size and available lab measurements.
- [x] Introduce fluid gutters, responsive product grids, tokens, focus styles, and reduced motion.
- [x] Refine header, search, mobile menu, account navigation, and footer; use the full brand name.
- [x] Rebuild homepage hierarchy and cards without inventing prices or business promises.
- [x] Add real loading, retry, independent errors, and retained background data.
- [x] Improve checkout labels, validation, summary, and confirmed payment messaging.
- [x] Apply shared styles to all customer/admin pages and preserve Community Impact workflows.
- [x] Verify typecheck, lint, production build, isolated Laravel tests, responsive browser checks, keyboard, and reduced motion.
- [x] Record results, content discrepancies, and remaining limitations.

See [UI-VERIFICATION.md](UI-VERIFICATION.md) for evidence and limitations.

Latest header update: FAMILY CHOICE SUPERMARKET branding throughout customer-facing content; icon-only search, account, wishlist and live cart controls; on-demand keyboard search; responsive navigation drawer with existing destinations.

Minimal shopping controls: Shop navigates directly to the catalogue on desktop and mobile. Product cards use a left wishlist heart and right cart icon in one compact action row, retaining 44px targets, stock limits, accessible names and successful-add feedback.

Owner image hero slideshow: market produce, family groceries, pantry staples and breakfast photography, with original copy and real catalogue links. CSS crossfade, direct slide selection and pause controls. Automatic changes pause on hover/focus, offscreen and hidden tabs; reduced motion disables automatic changes and transitions. Responsive local WebP assets; eager high-priority first slide.

Reference-inspired hero update: full-bleed darkened photography, bold white headings, category pill, rounded CTA, thumbnail selectors and bottom shopping-information row. Slideshow behavior and original four owner images preserved.

Owner-requested control-free hero: removed thumbnails, arrows, counter and play/pause UI. Automatic slideshow retains reduced-motion, hover/focus, hidden-tab and offscreen suspension.

