import { useStore } from '../store';
import { Home, LayoutGrid, ShoppingCart, User } from 'lucide-react';

export function MobileNav() {
  const { page, navigate, cartCount, setCartOpen } = useStore();

  const items = [
    { icon: Home, label: 'Home', action: () => navigate({ name: 'home' }), active: page.name === 'home' },
    { icon: LayoutGrid, label: 'Categories', action: () => navigate({ name: 'catalog' }), active: page.name === 'catalog' || page.name === 'deals' || page.name === 'recipes' },
    { icon: ShoppingCart, label: 'Cart', action: () => setCartOpen(true), badge: cartCount },
    { icon: User, label: 'Account', action: () => navigate({ name: 'account' }), active: page.name === 'account' },
  ];

  return (
    <nav className="fc-mobile-nav md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around h-14">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 relative transition-colors ${
              item.active ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge && item.badge > 0 ? (
                <span key={item.badge} className="fc-cart-badge absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
