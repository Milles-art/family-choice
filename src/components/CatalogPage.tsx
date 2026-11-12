import { StoreLink } from './StoreLink';
import { useStore } from '../store';
import { categories, products, getCategoryById, searchProducts } from '../data';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { SlidersHorizontal, X, ChevronRight, Home, Search, MessageCircle, PackageSearch } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { formatTzs } from '../currency';
import { Overlay } from './Overlay';
import { site } from '../site-data';

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'rating' | 'discount';

/** shadcn Button base + default variant (reference ProductsPage), adapted to Tailwind v3. */
const BUTTON_SM = `group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/80 h-8 gap-1 rounded-[10px] px-2.5`;
const BUTTON_SM_SECONDARY = `group/button inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-[#fdd2e5] h-8 gap-1 rounded-[10px] px-2.5`;

export function CatalogPage() {
  const { page, navigate, catalogVersion } = useStore();
  const initialCategory = page.name === 'catalog' ? page.categoryId : undefined;
  const initialSearch = page.name === 'catalog' ? page.searchQuery : undefined;

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFiltersOnly, setShowFiltersOnly] = useState(false);
  const maximumPrice = Math.max(1000, Math.ceil(Math.max(0, ...products.map((product) => product.price)) / 1000) * 1000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maximumPrice]);
  const previousMaximum = useRef(maximumPrice);
  useEffect(() => {
    const previous = previousMaximum.current;
    setPriceRange(range => range[1] === previous ? [range[0], maximumPrice] : range);
    previousMaximum.current = maximumPrice;
  }, [maximumPrice]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pageNumber, setPageNumber] = useState(page.name === 'catalog' ? page.pageNumber ?? 1 : 1);
  useEffect(() => { if(page.name === 'catalog') setPageNumber(page.pageNumber ?? 1); }, [page]);
  const pageSize = 24;
  // Resets pagination. When a reset has to hit the URL (page > 1), carry the
  // local search/category along so the page-sync effect doesn't wipe them.
  const resetPage = (patch: { searchQuery?: string; categoryId?: string } = {}) => {
    setPageNumber(1);
    if (page.name === 'catalog' && (page.pageNumber ?? 1) > 1) navigate({
      ...page,
      categoryId: 'categoryId' in patch ? patch.categoryId : selectedCategory,
      searchQuery: 'searchQuery' in patch ? patch.searchQuery : (searchQuery || undefined),
      pageNumber: 1,
    });
  };

  useEffect(() => {
    if (page.name === 'catalog') {
      setSelectedCategory(page.categoryId);
      setSearchQuery(page.searchQuery || '');
    }
  }, [page]);

  const filteredProducts = useMemo(() => {
    void catalogVersion;
    let result: Product[] = searchQuery ? searchProducts(searchQuery) : products;
    if (selectedCategory) result = result.filter(p => p.categoryId === selectedCategory);

    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    if (selectedTags.length > 0) {
      result = result.filter((p) => selectedTags.some((tag) => p.tags.includes(tag)));
    }

    switch (sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        result = [...result].sort((a, b) => {
          const aDiscount = a.originalPrice ? (a.originalPrice - a.price) / a.originalPrice : 0;
          const bDiscount = b.originalPrice ? (b.originalPrice - b.price) / b.originalPrice : 0;
          return bDiscount - aDiscount;
        });
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, sortBy, priceRange, selectedTags, catalogVersion]);
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(pageNumber, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const changePage = (next: number) => {
    setPageNumber(next);
    navigate({name:'catalog',categoryId:selectedCategory || undefined,searchQuery:searchQuery || undefined,pageNumber:next});
    requestAnimationFrame(() => document.getElementById('catalog-results')?.focus());
  };

  const currentCategory = selectedCategory ? getCategoryById(selectedCategory) : undefined;
  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : currentCategory
    ? currentCategory.name
    : 'All Products';

  const toggleTag = (tag: string) => {
    resetPage();
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearAll = () => {
    setSelectedCategory(undefined);
    setSearchQuery('');
    setSelectedTags([]);
    setPriceRange([0, maximumPrice]);
    navigate({ name: 'catalog' });
  };

  const filterContent = (
    <div className="shop-filter-content space-y-6">
      {/* Price range */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{formatTzs(priceRange[0])}</span>
            <span>{formatTzs(priceRange[1])}</span>
          </div>
          <input
            aria-label="Maximum product price"
            type="range"
            min="0"
            max={maximumPrice}
            step="1000"
            value={priceRange[1]}
            onChange={(e) => { resetPage(); setPriceRange([0, parseInt(e.target.value, 10)]); }}
            className="w-full accent-green-600"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Special Offers</h3>
        <div className="space-y-2">
          {[
            { tag: 'deal', label: 'On Sale' },
            { tag: 'bestseller', label: 'Best Sellers' },
            { tag: 'new', label: 'New Arrivals' },
            { tag: 'organic', label: 'Organic' },
          ].map((item) => (
            <label
              key={item.tag}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(item.tag)}
                onChange={() => toggleTag(item.tag)}
                className="w-4 h-4 rounded accent-green-600"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const pillClass = (active: boolean) =>
    `shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-secondary'
    }`;

  return (
    <div className="shop-page">
      {/* Reference hero: pink canvas, dot pattern, huge display type. */}
      <section className="shop-hero relative overflow-hidden bg-[#FFD9E3]" aria-labelledby="shop-hero-title">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
        <div className="relative store-container pt-4 pb-10 sm:pb-14">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
            <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-1 hover:text-primary">
              <Home className="w-3.5 h-3.5" /> Home
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-[#4A2618]">{pageTitle}</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">
            {products.length} products · {categories.length} aisles
          </p>
          <h1 id="shop-hero-title" className="mt-4 font-display text-[16vw] leading-[0.82] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[11vw] lg:text-[8.5vw]">
            {['Everything', 'on our shelves.'].map((line, i) => (
              <motion.span
                key={line}
                initial={{ y: '25%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                className={i === 1 ? 'block text-primary' : 'block'}
              >
                {line}
              </motion.span>
            ))}
          </h1>
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-lg text-[#4A2618]/75 sm:text-lg">
              From rice to soap, fresh produce to cold drinks. Add what you need to your
              basket, or send us a shopping list on WhatsApp — we confirm every price and
              deliver across Morogoro.
            </p>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#4A2618] px-6 py-3.5 text-sm font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#2E170E]"
            >
              <MessageCircle className="size-4" />
              {' Send a shopping list'}
            </a>
          </div>
        </div>
      </section>

      {/* Sticky search + category pills (offset below the sticky family-choice header). */}
      <div className="sticky z-40 border-b bg-background/95" style={{ top: 'var(--header-height, 140px)' }}>
        <div className="store-container flex flex-col gap-3 py-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => { setSearchQuery(event.target.value); resetPage({ searchQuery: event.target.value || undefined }); }}
              placeholder="Search e.g. milk, rice, soap"
              aria-label="Search products"
              className="h-11 w-full min-w-0 rounded-full border border-input bg-card pl-11 pr-10 text-base outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/50 md:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); resetPage({ searchQuery: undefined }); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="shop-pill-row flex gap-2 overflow-x-auto">
            <StoreLink
              to={{ name: 'catalog', searchQuery: searchQuery || undefined }}
              aria-current={!selectedCategory ? 'page' : undefined}
              className={pillClass(!selectedCategory)}
            >
              All
            </StoreLink>
            {categories.map((cat) => (
              <StoreLink
                key={cat.id}
                to={{ name: 'catalog', categoryId: cat.id, searchQuery: searchQuery || undefined }}
                aria-current={selectedCategory === cat.id ? 'page' : undefined}
                className={pillClass(selectedCategory === cat.id)}
              >
                {cat.name}
              </StoreLink>
            ))}
          </div>
        </div>
      </div>

      <div className="store-container py-12 sm:py-16">
        <div className="shop-layout">
          {/* Sidebar filters - desktop */}
          <aside className="shop-sidebar" aria-label="Catalogue filters">
            <div className="shop-sidebar-panel bg-white border border-gray-100 rounded-2xl p-5">
              {filterContent}
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="shop-toolbar">
              <div className="shop-result-title" id="catalog-results" tabIndex={-1}><h2>{pageTitle}</h2><p aria-live="polite">{filteredProducts.length ? `Showing ${pageStart + 1}–${Math.min(pageStart + pageSize, filteredProducts.length)} of ${filteredProducts.length} products` : '0 products found'}</p></div>
              <div className="shop-toolbar-controls">
              <button
                onClick={() => setShowFiltersOnly(true)}
                className="shop-filter-trigger flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500 hidden sm:block">Sort by:</span>
                <select
                  aria-label="Sort products"
                  value={sortBy}
                  onChange={(e) => {resetPage(); setSortBy(e.target.value as SortOption);}}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="discount">Biggest Discount</option>
                </select>
              </div>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div data-slot="empty" className="shop-empty flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border p-12 text-center text-balance">
                <div data-slot="empty-header" className="flex max-w-sm flex-col items-center gap-2">
                  <div data-slot="empty-icon" className="mb-2 flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6">
                    <PackageSearch />
                  </div>
                  <div data-slot="empty-title" className="text-lg font-medium tracking-tight">
                    No products found
                  </div>
                  <div data-slot="empty-description" className="text-sm leading-relaxed text-muted-foreground">
                    We may still have it in store. Ask us on WhatsApp or try another search.
                  </div>
                </div>
                <div data-slot="empty-content" className="flex w-full max-w-sm min-w-0 items-center justify-center gap-4 text-sm text-balance">
                  <button data-slot="button" type="button" onClick={clearAll} className={BUTTON_SM}>
                    Show all products
                  </button>
                  <a
                    data-slot="button"
                    role="button"
                    href={site.whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className={BUTTON_SM_SECONDARY}
                  >
                    Ask on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="product-grid shop-product-grid">
                {filteredProducts.slice(pageStart, pageStart + pageSize).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={(p) => navigate({ name: 'product', productId: p.id })}
                  />
                ))}
              </div>
            )}
            {pageCount > 1 && <nav aria-label="Product pagination" className="flex flex-wrap items-center justify-center gap-2 mt-8">
              <button className="w-11 h-11 rounded-lg border bg-white disabled:opacity-40" aria-label="Previous product page" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>‹</button>
              {Array.from({length: pageCount}, (_, i) => i + 1).filter(n => n === 1 || n === pageCount || Math.abs(n - currentPage) <= 1).map((n, i, visible) => <span key={n} className="flex items-center gap-2">{i > 0 && n - visible[i - 1] > 1 && <span aria-hidden="true">…</span>}<button aria-label={`Product page ${n}`} aria-current={n === currentPage ? 'page' : undefined} onClick={() => changePage(n)} className={`w-11 h-11 rounded-lg border ${n === currentPage ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700'}`}>{n}</button></span>)}
              <button className="w-11 h-11 rounded-lg border bg-white disabled:opacity-40" aria-label="Next product page" disabled={currentPage === pageCount} onClick={() => changePage(currentPage + 1)}>›</button>
            </nav>}
          </div>
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          Prices are shown in Tanzanian shillings and may change with the market.
          Delivery is confirmed on WhatsApp before we dispatch.
        </p>
      </div>

      {/* Mobile filter drawer */}
      {showFiltersOnly && (
        <Overlay label="Product filters" onClose={() => setShowFiltersOnly(false)} className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFiltersOnly(false)}
          />
          <div className="mobile-filter-sheet absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <button aria-label="Close filters" onClick={() => setShowFiltersOnly(false)} className="p-1 w-11 h-11">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{filterContent}</div>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowFiltersOnly(false)}
                className="w-full bg-green-600 text-white font-semibold py-3 rounded-xl"
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
