import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { CartItem, Product, Page, CheckoutDraft } from './types';
import { products } from './data';
import { settings } from './api';
import { useResource } from './useResource';
import { pageFromUrl, pageUrl } from './routing';

type Toast = { id: number; message: string; type: 'success' | 'info' };

type StoreContextValue = {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartSavings: number;
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  page: Page;
  navigate: (page: Page) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info') => void;
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;
  rewardsPoints: number;
  catalogLoading: boolean;
  catalogReady: boolean;
  catalogError: string;
  retryCatalog: () => void;
  catalogVersion: number;
  settingsReady: boolean;
  settingsError: string;
  retrySettings: () => void;
  checkoutDraft: CheckoutDraft | null;
  setCheckoutDraft: (draft: CheckoutDraft | null) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = 'freshcart_cart';
const RECENT_KEY = 'freshcart_recent';
const REWARDS_KEY = 'freshcart_rewards';
const WISHLIST_KEY = 'freshcart_wishlist';

function persist(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Shopping remains usable when storage is blocked or full. */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [checkoutDraft,setCheckoutDraft] = useState<CheckoutDraft | null>(null);
  const catalogResource = useResource<Product[]>('/products');
  const settingsResource = useResource<typeof settings>('/settings');
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [settingsReady, setSettingsReady] = useState(false);
  useEffect(() => {
    if (catalogResource.data) {
      products.splice(0, products.length, ...catalogResource.data);
      setCatalogVersion(version => version + 1);
    }
  }, [catalogResource.data]);
  useEffect(() => { if (settingsResource.data) { Object.assign(settings, settingsResource.data); setSettingsReady(true); } }, [settingsResource.data]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((item) => {
        const product = item?.product as Product | undefined;
        if (!product || typeof product.id !== 'string' || !Number.isFinite(product.price) || !Number.isInteger(item.quantity) || item.quantity <= 0) return [];
        return [{ product, quantity: item.quantity }];
      });
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => {
    if (!catalogResource.data) return;
    setCart(previous => previous.flatMap(item => {
      const product = catalogResource.data?.find(p => p.id === item.product.id);
      if (!product?.inStock) return [];
      const quantity = Math.min(item.quantity, product.stock ?? 100, 100);
      return quantity > 0 ? [{ product, quantity }] : [];
    }));
  }, [catalogResource.data]);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });
  const [page, setPage] = useState<Page>(() => pageFromUrl(new URL(window.location.href)));
  useEffect(() => {
    const restorePage = () => { setPage(pageFromUrl(new URL(window.location.href))); setCartOpen(false); };
    window.addEventListener('popstate', restorePage);
    return () => window.removeEventListener('popstate', restorePage);
  }, []);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    if (!catalogResource.data) return;
    const available = new Set(catalogResource.data.map(product => product.id));
    setWishlistIds(previous => previous.filter(id => available.has(id)));
    setRecentlyViewed(previous => previous.filter(id => available.has(id)));
  }, [catalogResource.data]);
  const [rewardsPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(REWARDS_KEY);
      return saved ? parseInt(saved, 10) : 1250;
    } catch {
      return 1250;
    }
  });

  useEffect(() => {
    persist(CART_KEY, cart);
  }, [cart]);

  useEffect(() => {
    persist(RECENT_KEY, recentlyViewed);
  }, [recentlyViewed]);

  useEffect(() => {
    persist(REWARDS_KEY, rewardsPoints);
  }, [rewardsPoints]);

  useEffect(() => {
    persist(WISHLIST_KEY, wishlistIds);
  }, [wishlistIds]);

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      const existingQuantity = cart.find(item => item.product.id === product.id)?.quantity ?? 0;
      if (!product.inStock || !Number.isInteger(quantity) || quantity < 1 || existingQuantity + quantity > Math.min(product.stock ?? 100, 100)) {
        showToast('The requested quantity is unavailable.', 'info'); return false;
      }
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock ?? 100, 100) }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });
      showToast(`${product.name} added to cart`);
      return true;
    },
    [showToast, cart]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (!Number.isInteger(quantity)) return;
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.min(quantity, item.product.stock ?? 100, 100) } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    showToast(wishlistIds.includes(productId) ? 'Removed from wishlist' : 'Saved to wishlist');
    setWishlistIds((previous) =>
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId]
    );
  }, [showToast, wishlistIds]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const navigate = useCallback((newPage: Page) => {
    const destination = pageUrl(newPage);
    if (window.location.pathname + window.location.search !== destination) window.history.pushState(null, '', destination);
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, []);

  const addRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 8);
    });
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + Math.round(item.product.price * 100) * item.quantity, 0) / 100;
  const cartSavings = cart.reduce((sum, item) => {
    if (item.product.originalPrice) {
      return sum + (item.product.originalPrice - item.product.price) * item.quantity;
    }
    return sum;
  }, 0);

  const value: StoreContextValue = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartSubtotal,
    cartSavings,
    wishlistIds,
    toggleWishlist,
    isWishlisted,
    cartOpen,
    setCartOpen,
    page,
    navigate,
    toasts,
    showToast,
    recentlyViewed,
    addRecentlyViewed,
    rewardsPoints,
    catalogLoading: catalogResource.loading,
    catalogReady: catalogVersion > 0,
    catalogError: catalogResource.error,
    retryCatalog: catalogResource.retry,
    catalogVersion,
    settingsReady,
    settingsError: settingsResource.error,
    retrySettings: settingsResource.retry,
    checkoutDraft,
    setCheckoutDraft,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

// The hook intentionally shares this module's private context with StoreProvider.
// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
