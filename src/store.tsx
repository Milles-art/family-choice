import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { getProductById } from './data';
import type { CartItem, Product, Page } from './types';

type Toast = { id: number; message: string; type: 'success' | 'info' };

type StoreContextValue = {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartSavings: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  page: Page;
  navigate: (page: Page) => void;
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info') => void;
  recentlyViewed: string[];
  addRecentlyViewed: (productId: string) => void;
  rewardsPoints: number;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = 'freshcart_cart';
const RECENT_KEY = 'freshcart_recent';
const REWARDS_KEY = 'freshcart_rewards';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((item) => {
        const product = getProductById(item?.product?.id);
        if (!product?.inStock || !Number.isInteger(item.quantity) || item.quantity <= 0) return [];
        return [{ product, quantity: Math.min(item.quantity, product.stock ?? 100) }];
      });
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [page, setPage] = useState<Page>({ name: 'home' });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [rewardsPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(REWARDS_KEY);
      return saved ? parseInt(saved, 10) : 1250;
    } catch {
      return 1250;
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem(REWARDS_KEY, String(rewardsPoints));
  }, [rewardsPoints]);

  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { product, quantity }];
      });
      showToast(`${product.name} added to cart`);
    },
    [showToast]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const navigate = useCallback((newPage: Page) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 8);
    });
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
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
    cartOpen,
    setCartOpen,
    page,
    navigate,
    toasts,
    showToast,
    recentlyViewed,
    addRecentlyViewed,
    rewardsPoints,
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
