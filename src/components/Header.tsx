import { StoreLink } from './StoreLink';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, Search, ShoppingCart, X } from 'lucide-react';
import { useStore } from '../store';
import { searchProducts } from '../data';
import { formatTzs } from '../currency';
import { storeConfig, whatsappLink } from '../storeConfig';
import type { Page } from '../types';
import { Overlay } from './Overlay';

/** Giant uppercase links shown inside the dark slide-out sheet. */
const sheetLinks: { label: string; page: Page }[] = [
  { label: 'Home', page: { name: 'home' } },
  { label: 'Shop', page: { name: 'catalog' } },
  { label: 'Deals', page: { name: 'deals' } },
  { label: 'New arrivals', page: { name: 'new-arrivals' } },
  { label: 'Recipes', page: { name: 'recipes' } },
  { label: 'Basket', page: { name: 'cart' } },
  { label: 'Delivery', page: { name: 'info', section: 'delivery' } },
  { label: 'About us', page: { name: 'info', section: 'about' } },
  { label: 'Help', page: { name: 'info', section: 'help' } },
  { label: 'Wishlist', page: { name: 'wishlist' } },
  { label: 'Account', page: { name: 'account' } },
];

export function Header() {
  const { navigate, page, cartCount, setCartOpen, catalogVersion, catalogReady } = useStore();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [panelOpen, setPanelOpen] = useState(false);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (panelOpen) searchInput.current?.focus(); }, [panelOpen]);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (root.current) document.documentElement.style.setProperty('--header-height', `${root.current.getBoundingClientRect().height}px`);
    });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  void catalogVersion;
  const results = searchProducts(query).slice(0, 6);
  const go = (destination: Page) => { navigate(destination); setSheetOpen(false); setSearchOpen(false); setPanelOpen(false); };
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setSearchOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && panelOpen) { searchTrigger.current?.focus(); setPanelOpen(false); setSearchOpen(false); } };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [panelOpen]);
  const submit = () => { if (query.trim()) { go({ name: 'catalog', searchQuery: query.trim() }); setQuery(''); } };
  const isCurrent = (destination: Page) => page.name === destination.name && (page.name !== 'info' || destination.name !== 'info' || page.section === destination.section);
  return <>
  <header ref={root} className={`fc-header ${scrolled ? 'is-scrolled ' : ''}sticky top-0 z-50`}>
    <div className="mx-auto w-full max-w-[1400px] px-4 py-3 sm:px-6 sm:py-4">
      {/* Floating pill: transparent over the hero, frosted white once you scroll. */}
      <div className={`fc-pill relative flex w-full items-center gap-2 rounded-full px-2 py-2 sm:px-3 ${scrolled ? 'is-elevated' : ''}`}>
        <button
          type="button"
          aria-label="Open menu"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
          className="fc-pill-icon shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <StoreLink to={{ name: 'catalog' }} aria-current={page.name === 'catalog' ? 'page' : undefined} className="fc-pill-link">Shop</StoreLink>

        <StoreLink to={{ name: 'home' }} aria-label="Family Choice Supermarket home" aria-current={page.name === 'home' ? 'page' : undefined} className="fc-brand shrink-0">
          <img src="/images/brand/family-choice-logo.svg" width={1547} height={325} alt="Family Choice Supermarket" className="brand-logo" />
        </StoreLink>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            ref={searchTrigger}
            className="fc-pill-icon hidden sm:grid"
            aria-label={panelOpen ? 'Close search' : 'Search'}
            aria-expanded={panelOpen}
            aria-controls="header-search"
            onClick={() => { setPanelOpen(value => !value); setSearchOpen(true); }}
          >
            {panelOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
          <button
            className="fc-pill-icon relative"
            aria-label={`Open cart, ${cartCount} items`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && <span key={cartCount} className="fc-cart-badge absolute right-0 top-0 min-w-5 h-5 px-1 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}
          </button>
          <StoreLink to={{ name: 'cart' }} className="fc-cta group">
            <span className="hidden sm:inline">Order now</span>
            <span className="sm:hidden">Order</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </StoreLink>
        </div>
      </div>

      {panelOpen && <div id="header-search" className="fc-search-panel" role="search">
        <form className="relative w-full max-w-3xl mx-auto" onSubmit={e => { e.preventDefault(); submit(); }}>
          <label htmlFor="desktop-search" className="sr-only">Search products</label><Search aria-hidden="true" className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
          <input ref={searchInput} id="desktop-search" role="combobox" aria-autocomplete="list" aria-expanded={searchOpen && !!query.trim()} aria-controls="search-suggestions" aria-activedescendant={selected >= 0 ? `suggestion-${selected}` : undefined} value={query} placeholder="Search groceries and essentials" className="w-full pl-10 pr-3 py-3 rounded-xl border bg-gray-50" onChange={e => { setQuery(e.target.value); setSearchOpen(true); setSelected(-1); }} onFocus={() => setSearchOpen(true)} onKeyDown={e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSearchOpen(true); setSelected(value => Math.min(value + 1, results.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(value => Math.max(-1, value - 1)); }
            if (e.key === 'Enter' && searchOpen && selected >= 0 && results[selected]) { e.preventDefault(); go({ name: 'product', productId: results[selected].id }); setQuery(''); }
          }} />
          {searchOpen && query.trim() && <div className="fc-search-suggestions absolute top-full mt-2 inset-x-0 surface shadow-xl overflow-hidden"><ul id="search-suggestions" role="listbox" aria-label="Product suggestions">{results.map((product, index) => <li key={product.id} id={`suggestion-${index}`} role="option" aria-selected={index === selected} className={index === selected ? 'bg-green-50' : ''}><button type="button" className="w-full flex items-center gap-3 p-3 text-left hover:bg-green-50" onClick={() => { go({ name: 'product', productId: product.id }); setQuery(''); }}><img src={product.image} alt="" width={44} height={44} className="w-11 h-11 object-contain"/><span className="flex-1 min-w-0 text-sm font-semibold">{product.name}<span className="block text-gray-500 font-normal">{product.unit}</span></span><strong className="text-sm">{formatTzs(product.price)}</strong></button></li>)}</ul>{!results.length && <p className="p-4 text-sm">{catalogReady ? 'No matching products. Try a category or another name.' : 'The catalogue is still loading.'}</p>}<div className="border-t flex justify-between p-2"><button type="button" className="text-green-700 px-2" onClick={submit}>View all results</button><button type="button" className="px-2 text-gray-600" onClick={() => { setQuery(''); setSearchOpen(false); }}>Clear search</button></div></div>}
        </form>
      </div>}
    </div>

    {sheetOpen && <Overlay label="Site menu" onClose={() => setSheetOpen(false)} className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setSheetOpen(false)} />
      <div className="fc-sheet" role="document">
        <div className="flex items-center justify-between">
          <span className="fc-sheet-title">Menu</span>
          <button aria-label="Close menu" onClick={() => setSheetOpen(false)} className="fc-sheet-close"><X className="w-5 h-5" /></button>
        </div>
        <nav aria-label="Site navigation" className="fc-sheet-nav">
          {sheetLinks.map((item, index) => (
            <button
              key={item.label}
              type="button"
              aria-current={isCurrent(item.page) ? 'page' : undefined}
              style={{ animationDelay: `${index * 0.05}s` }}
              className="fc-sheet-link"
              onClick={() => go(item.page)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="fc-sheet-footer">
          <p>{storeConfig.address}</p>
          <p>{storeConfig.openingHours.map(entry => `${entry.days} ${entry.hours}`).join(' · ')}</p>
          <a href={whatsappLink('Hello Family Choice Supermarket!')} target="_blank" rel="noreferrer">WhatsApp us</a>
        </div>
      </div>
    </Overlay>}
  </header>
  </>;
}
