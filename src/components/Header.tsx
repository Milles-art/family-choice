import { useEffect, useRef, useState } from 'react';
import { Heart, Leaf, Menu, Phone, Search, ShoppingCart, Truck, User, X } from 'lucide-react';
import { useStore } from '../store';
import { searchProducts } from '../data';
import { formatTzs } from '../currency';
import { settings } from '../api';
import type { Page } from '../types';
import { Overlay } from './Overlay';

const links: { label: string; page: Page }[] = [
  { label: 'Home', page: { name: 'home' } },
  { label: 'About us', page: { name: 'info', section: 'about' } },
  { label: 'Delivery Areas', page: { name: 'info', section: 'delivery' } },
  { label: 'Help / Contact', page: { name: 'info', section: 'help' } },
];
const accountLinks: { label: string; page: Page }[] = [{label:'Account / Orders',page:{name:'account'}},{label:'Wishlist',page:{name:'wishlist'}}];
export function Header() {
  const { navigate, page, cartCount, setCartOpen, catalogVersion, catalogReady, settingsReady } = useStore();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const isCurrent = (destination: Page) => page.name === destination.name && (page.name !== 'info' || destination.name !== 'info' || page.section === destination.section);
  const [panelOpen, setPanelOpen] = useState(false);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => { if (panelOpen) searchInput.current?.focus(); }, [panelOpen]);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState(-1);
  const [menu, setMenu] = useState<'account' | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (root.current) document.documentElement.style.setProperty('--header-height', `${root.current.getBoundingClientRect().height}px`);
    });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  void catalogVersion;
  const results = searchProducts(query).slice(0, 6);
  const go = (destination: Page) => { navigate(destination); setMenu(null); setMobileOpen(false); setSearchOpen(false); setPanelOpen(false); };
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) { setMenu(null); setSearchOpen(false); } };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (menu) menuTrigger.current?.focus(); else if (panelOpen) searchTrigger.current?.focus(); setMenu(null); setSearchOpen(false); setPanelOpen(false); } };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, [menu, panelOpen]);
  const submit = () => { if (query.trim()) { go({ name: 'catalog', searchQuery: query.trim() }); setQuery(''); } };
  const toggle = (name: 'account', trigger: HTMLButtonElement) => { menuTrigger.current = trigger; setMenu(menu === name ? null : name); };
  return <>
  <div className="fc-header-strip"><div className="store-container"><span><Truck size={15} aria-hidden="true"/>{settingsReady ? `Free delivery on groceries from ${formatTzs(settings.free_delivery_cents/100)}` : 'Delivery or pickup available at checkout'}</span><span className="fc-header-strip-right"><span>Prices in TZS</span><a href="tel:+255768641810"><Phone size={14} aria-hidden="true"/>+255 768 641 810</a></span></div></div>
  <header ref={root} className={`fc-header ${scrolled ? 'is-scrolled ' : ''}sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm`}>
    <div className="store-container">
      <div className="header-row flex items-center gap-3 xl:gap-5 min-h-16 py-2">
        <button className="xl:hidden w-11 h-11 flex items-center justify-center" aria-label="Open navigation menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5"/></button>
        <button onClick={() => go({ name: 'home' })} className="flex items-center gap-2 shrink-0 text-left" aria-label="FAMILY CHOICE SUPERMARKET home"><span className="hidden sm:flex w-10 h-10 bg-green-600 rounded-xl items-center justify-center"><Leaf className="w-6 h-6 text-white" /></span><span className="brand-name">FAMILY CHOICE SUPERMARKET</span></button>

      <nav aria-label="Main navigation" className="hidden xl:flex flex-wrap flex-1 justify-center items-center gap-1 min-w-0" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setMenu(null); }}>
        <button className="px-3 text-sm font-semibold rounded-lg hover:bg-green-50" aria-current={page.name === 'home' ? 'page' : undefined} onClick={() => go({name:'home'})}>Home</button>
        <button className="px-3 text-sm font-semibold rounded-lg hover:bg-green-50" aria-current={page.name === 'catalog' ? 'page' : undefined} onClick={() => go({name:'catalog'})}>Shop</button>
        <button className="px-3 text-sm font-semibold rounded-lg hover:bg-green-50" aria-current={page.name === 'deals' ? 'page' : undefined} onClick={() => go({name:'deals'})}>Deals</button>
        {links.slice(1).map(item => <button key={item.label} aria-current={isCurrent(item.page) ? 'page' : undefined} className="px-3 text-sm font-semibold rounded-lg hover:bg-green-50" onClick={() => go(item.page)}>{item.label}</button>)}
      </nav>
        <div className="header-actions flex items-center gap-1 ml-auto shrink-0">
          <button ref={searchTrigger} className="header-icon" aria-label={panelOpen ? "Close search" : "Search"} aria-expanded={panelOpen} aria-controls="header-search" onClick={() => {setPanelOpen(value => !value);setSearchOpen(true);setMenu(null);}}>{panelOpen ? <X className="w-5 h-5"/> : <Search className="w-5 h-5"/>}</button>
          <div className="relative"><button aria-label="Account menu" aria-expanded={menu === 'account'} aria-controls="account-links" className="header-icon" onClick={e => toggle('account', e.currentTarget)}><User className="w-5 h-5"/></button>{menu === 'account' && <div id="account-links" className="absolute right-0 top-full w-48 surface shadow-xl p-2" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget) && e.relatedTarget !== menuTrigger.current) setMenu(null); }}>{accountLinks.map(item => <button key={item.label} aria-current={isCurrent(item.page) ? 'page' : undefined} className="block w-full text-left p-2 hover:bg-green-50 rounded-lg" onClick={() => go(item.page)}>{item.label}</button>)}</div>}</div>
          <button className="header-icon" aria-label="Wishlist" onClick={() => go({ name: 'wishlist' })}><Heart className="w-5 h-5"/></button>
          <button className="header-icon relative text-green-700" aria-label={`Open cart, ${cartCount} items`} onClick={() => setCartOpen(true)}><ShoppingCart className="w-5 h-5"/>{cartCount > 0 && <span key={cartCount} className="fc-cart-badge absolute right-0 top-0 min-w-5 h-5 px-1 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">{cartCount}</span>}</button>

        </div>
      </div>

      {panelOpen && <div id="header-search" className="border-t py-3">
        <form className="relative w-full max-w-3xl mx-auto" role="search" onSubmit={e => { e.preventDefault(); submit(); }}>
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
    {mobileOpen && <Overlay label="Navigation menu" onClose={() => setMobileOpen(false)} className="fixed inset-0 z-[60]"><div className="fc-backdrop absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)}/><div className="absolute right-0 inset-y-0 w-[min(340px,90vw)] bg-white shadow-2xl flex flex-col animate-slide-in-right"><div className="p-4 border-b flex items-center justify-between"><strong>FAMILY CHOICE SUPERMARKET</strong><button aria-label="Close navigation menu" onClick={() => setMobileOpen(false)} className="w-11 h-11 flex items-center justify-center"><X/></button></div><nav aria-label="Mobile navigation" className="overflow-y-auto p-4">{[links[0],{label:'Shop',page:{name:'catalog'} as Page},{label:'Deals',page:{name:'deals'} as Page},{label:'New Arrivals',page:{name:'new-arrivals'} as Page},...links.slice(1),...accountLinks,{label:'Recipes',page:{name:'recipes'} as Page}].map(item => <button key={item.label} aria-current={isCurrent(item.page) ? 'page' : undefined} className="block w-full p-3 text-left rounded-lg hover:bg-green-50 font-medium" onClick={() => go(item.page)}>{item.label}</button>)}</nav></div></Overlay>}
  </header>
  </>;
}
