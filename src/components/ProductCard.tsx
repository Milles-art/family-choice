import type { Product } from '../types';
import { useStore } from '../store';
import { Star, Plus, Check } from 'lucide-react';
import { useState } from 'react';

type Props = {
  product: Product;
  onQuickView?: (product: Product) => void;
};

export function ProductCard({ product, onQuickView }: Props) {
  const { addToCart } = useStore();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div
      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-green-200 transition-all duration-300 cursor-pointer flex flex-col"
      onClick={() => onQuickView?.(product)}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.badge && (
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
              {product.badge}
            </span>
          )}
          {discount > 0 && !product.badge?.includes('%') && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
              {discount}% OFF
            </span>
          )}
        </div>
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs font-medium text-gray-600">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mb-2">{product.unit}</p>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all flex-shrink-0 ${
              added
                ? 'bg-green-100 text-green-600'
                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
            } disabled:bg-gray-200 disabled:text-gray-400`}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
