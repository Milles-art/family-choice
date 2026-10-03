import { useStore } from '../store';
import { categories, products, getCategoryById, searchProducts } from '../data';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import { SlidersHorizontal, X, ChevronRight, Home } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { formatTzs } from '../currency';

type SortOption = 'relevance' | 'price-low' | 'price-high' | 'rating' | 'discount';

export function CatalogPage() {
  const { page, navigate } = useStore();
  const initialCategory = page.name === 'catalog' ? page.categoryId : undefined;
  const initialSearch = page.name === 'catalog' ? page.searchQuery : undefined;

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFiltersOnly, setShowFiltersOnly] = useState(false);
  const maximumPrice = Math.ceil(Math.max(...products.map((product) => product.price)) / 1000) * 1000;
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maximumPrice]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (page.name === 'catalog') {
      setSelectedCategory(page.categoryId);
      setSearchQuery(page.searchQuery || '');
    }
  }, [page]);

  const filteredProducts = useMemo(() => {
    let result: Product[] = searchQuery
      ? searchProducts(searchQuery)
      : selectedCategory
      ? products.filter((p) => p.categoryId === selectedCategory)
      : products;

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
  }, [searchQuery, selectedCategory, sortBy, priceRange, selectedTags]);

  const currentCategory = selectedCategory ? getCategoryById(selectedCategory) : undefined;
  const pageTitle = searchQuery
    ? `Search: "${searchQuery}"`
    : currentCategory
    ? currentCategory.name
    : 'All Products';

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filterContent = (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => {
              setSelectedCategory(undefined);
              setSearchQuery('');
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !selectedCategory
                ? 'bg-green-50 text-green-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchQuery('');
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-green-50 text-green-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{formatTzs(priceRange[0])}</span>
            <span>{formatTzs(priceRange[1])}</span>
          </div>
          <input
            type="range"
            min="0"
            max={maximumPrice}
            step="1000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, parseInt(e.target.value, 10)])}
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <button
          onClick={() => navigate({ name: 'home' })}
          className="hover:text-green-600 flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5" /> Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">{pageTitle}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">{pageTitle}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
      </p>

      <div className="flex gap-6">
        {/* Sidebar filters - desktop */}
        <aside className="hidden md:block w-60 flex-shrink-0">
          <div className="sticky top-32 bg-white border border-gray-100 rounded-2xl p-5">
            {filterContent}
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="flex items-center justify-between mb-4 gap-2">
            <button
              onClick={() => setShowFiltersOnly(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500 hidden sm:block">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
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

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <SlidersHorizontal className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-900 text-lg">No products found</p>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={() => {
                  setSelectedCategory(undefined);
                  setSearchQuery('');
                  setSelectedTags([]);
                  setPriceRange([0, 25]);
                }}
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors text-sm"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => navigate({ name: 'product', productId: p.id })}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFiltersOnly && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFiltersOnly(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Filters</h2>
              <button onClick={() => setShowFiltersOnly(false)} className="p-1">
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
        </div>
      )}
    </div>
  );
}
