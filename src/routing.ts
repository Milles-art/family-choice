import type { Page } from './types';

const paths = { 'not-found': '/not-found', home: '/', catalog: '/shop', product: '/product', cart: '/cart', checkout: '/checkout', account: '/account', recipes: '/recipes', deals: '/deals', 'new-arrivals': '/new-arrivals', wishlist: '/wishlist', privacy: '/privacy', track: '/track', 'forgot-password': '/forgot-password', 'reset-password': '/reset-password' } as const;
const informationPaths = { about: '/about', delivery: '/delivery', 'how-it-works': '/how-to-order', help: '/help' } as const;

export function pageUrl(page: Page): string {
  if (page.name === 'info') return informationPaths[page.section];
  if (page.name === 'product') return `/products/${encodeURIComponent(page.productId)}`;
  const params = new URLSearchParams();
  if (page.name === 'catalog') {
    if (page.categoryId) params.set('category', page.categoryId);
    if (page.searchQuery) params.set('search', page.searchQuery);
    if ((page.pageNumber ?? 1) > 1) params.set('page', String(page.pageNumber));
  }
  if (page.name === 'track' && page.orderId) params.set('order', String(page.orderId));
  if (page.name === 'reset-password') { params.set('token', page.token); params.set('email', page.email); }
  return paths[page.name] + (params.size ? `?${params}` : '');
}

export function pageFromUrl(url: URL): Page {
  const path = url.pathname.replace(/\/$/, '') || '/';
  const productPath = path.match(/^\/products\/([^/]+)$/);
  if (productPath) { try { return {name:'product', productId:decodeURIComponent(productPath[1])}; } catch { return {name:'not-found'}; } }
  for (const [section, destination] of Object.entries(informationPaths)) {
    if (path === destination) return { name: 'info', section: section as Extract<Page, {name:'info'}>['section'] };
  }
  if (path === paths.catalog) return { name: 'catalog', categoryId: url.searchParams.get('category') || undefined, searchQuery: url.searchParams.get('search') || undefined, pageNumber: /^[1-9][0-9]{0,5}$/.test(url.searchParams.get('page') || '') ? Number(url.searchParams.get('page')) : 1 };
  if (path === paths.product) return url.searchParams.get('id') ? { name: 'product', productId: url.searchParams.get('id')! } : { name: 'catalog' };
  if (path === paths.track) { const id = Number(url.searchParams.get('order')); return { name: 'track', orderId: id > 0 ? id : undefined }; }
  if (path === paths['reset-password']) return { name: 'reset-password', token: url.searchParams.get('token') ?? '', email: url.searchParams.get('email') ?? '' };
  const entry = Object.entries(paths).find(([, destination]) => destination === path);
  return entry ? {name:entry[0]} as Page : {name:'not-found'};
}
