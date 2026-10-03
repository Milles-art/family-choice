import { useStore } from '../store';
import { categories, searchProducts } from '../data';
import {
  ShoppingCart,
  Search,
  MapPin,
  Menu,
  X,
  User,
  Award,
  ChevronDown,
  Leaf,
} from 'lucide-react';
import { settings } from '../api';
import { useState, useRef, useEffect } from 'react';
import type { Product } from '../types';

export function Header() {
  const { cartCount, setCartOpen, navigate, page, rewardsPoints } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCatMenu, setShowCatMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      setSearchResults(searchProducts(searchQuery).slice(0, 6));
      setShowSearch(true);
    } else {
      setShowSearch(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ name: 'catalog', searchQuery: searchQuery.trim() });
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = (product: Product) => {
    navigate({ name: 'product', productId: product.id });
    setShowSearch(false);
    setSearchQuery('');
  };

  const isActive = (name: string) => page.name === name;

  return (
    <>
      {/* Top bar */}
      <div className="bg-green-800 text-white text-xs py-1.5 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>Deliver to: 123 Main St, Springfield</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Free delivery on orders over ${(settings.free_delivery_cents / 100).toFixed(2)}</span>
            <button className="hover:text-green-200 transition-colors">Help</button>
            <button
              onClick={() => navigate({ name: 'account' })}
              className="hover:text-green-200 transition-colors"
            >
              My Account
            </button>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 md:gap-6 h-16">
            {/* Logo */}
            <button
              onClick={() => navigate({ name: 'home' })}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Fresh<span className="text-green-600">Cart</span>
              </span>
            </button>

            {/* Search */}
            <div ref={searchRef} className="flex-1 relative max-w-xl hidden md:block">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery && setShowSearch(true)}
                    placeholder="Search for products, categories..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </form>

              {/* Search dropdown */}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleResultClick(product)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">{product.unit}</p>
                      </div>
                      <span className="text-sm font-bold text-green-600 flex-shrink-0">
                        ${product.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full px-3 py-2.5 text-sm font-medium text-green-600 hover:bg-green-50 border-t border-gray-100"
                  >
                    See all results for "{searchQuery}"
                  </button>
                </div>
              )}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 md:gap-3 ml-auto">
              {/* Rewards */}
              <button
                onClick={() => navigate({ name: 'account' })}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors"
              >
                <Award className="w-4 h-4" />
                <span className="text-sm font-semibold">{rewardsPoints.toLocaleString()}</span>
                <span className="text-xs text-amber-600">pts</span>
              </button>

              {/* Account */}
              <button
                onClick={() => navigate({ name: 'account' })}
                className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors ${
                  isActive('account')
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Account</span>
              </button>

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-semibold hidden sm:block">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile menu */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2 text-gray-600"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Category nav - desktop */}
          <nav className="hidden md:flex items-center gap-1 h-11 -mt-1">
            <div className="relative">
              <button
                onClick={() => setShowCatMenu(!showCatMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:text-green-600 transition-colors"
              >
                <Menu className="w-4 h-4" />
                All Categories
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCatMenu && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-[240px] z-50">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        navigate({ name: 'catalog', categoryId: cat.id });
                        setShowCatMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-green-50 text-left transition-colors"
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-px h-5 bg-gray-200" />
            <button
              onClick={() => navigate({ name: 'deals' })}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('deals')
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              Today's Deals
            </button>
            <button
              onClick={() => navigate({ name: 'recipes' })}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('recipes')
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Recipes
            </button>
            <button
              onClick={() => navigate({ name: 'catalog' })}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('catalog') && !('categoryId' in page)
                  ? 'text-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              All Products
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="font-bold text-gray-900">Menu</span>
              <button onClick={() => setShowMobileMenu(false)} className="p-1">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <button
                onClick={() => {
                  navigate({ name: 'home' });
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                Home
              </button>
              <button
                onClick={() => {
                  navigate({ name: 'deals' });
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-red-50 font-medium text-red-600"
              >
                Today's Deals
              </button>
              <button
                onClick={() => {
                  navigate({ name: 'recipes' });
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-green-50 font-medium text-gray-700"
              >
                Recipes
              </button>
              <button
                onClick={() => {
                  navigate({ name: 'account' });
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-gray-700"
              >
                My Account
              </button>
              <div className="pt-3 pb-1">
                <span className="text-xs font-bold text-gray-400 uppercase px-3">
                  Categories
                </span>
              </div>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    navigate({ name: 'catalog', categoryId: cat.id });
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile search */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </form>
        {showSearch && searchResults.length > 0 && (
          <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => handleResultClick(product)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                  {product.name}
                </span>
                <span className="text-sm font-bold text-green-600">
                  ${product.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
