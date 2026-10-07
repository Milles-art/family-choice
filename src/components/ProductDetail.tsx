import { useStore } from '../store';
import { getProductById, getCategoryById, getBestSellers } from '../data';
import type { Product } from '../types';
import { formatTzs } from '../currency';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';
import { settings } from '../api';
import {
  ArrowLeft,
  Star,
  Plus,
  Minus,
  ShoppingCart,
  Truck,
  Shield,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function ProductDetail() {
  const { page, navigate, addToCart, addRecentlyViewed, settingsReady, cart } = useStore();
  const productId = page.name === 'product' ? page.productId : '';
  const product = getProductById(productId);
  const category = product ? getCategoryById(product.categoryId) : undefined;

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (productId) {
      addRecentlyViewed(productId);
      setQuantity(1);
      setAdded(false);
    }
  }, [productId, addRecentlyViewed]);

  if (!product) {
    return (
      <div className="store-container py-16 text-center">
        <p className="text-gray-500">Product not found</p>
        <button
          onClick={() => navigate({ name: 'home' })}
          className="mt-4 text-green-600 font-medium"
        >
          Back to home
        </button>
      </div>
    );
  }

  const handleAdd = () => {
    if (!addToCart(product, quantity)) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  const remainingStock = Math.max(0, Math.min(product.stock ?? 100, 100) - (cart.find(item => item.product.id === product.id)?.quantity ?? 0));

  const relatedProducts = getBestSellers()
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .slice(0, 4);
  const fallbackRelated = getBestSellers()
    .filter((p) => p.id !== product.id)
    .slice(0, 4);
  const related = relatedProducts.length >= 2 ? relatedProducts : fallbackRelated;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="form-container py-6">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate({ name: 'catalog', categoryId: product.categoryId })}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {category?.name}
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative">
          <div className="aspect-square rounded-3xl overflow-hidden bg-gray-50">
            <ProductImage key={product.image}
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
          {product.badge && discount <= 0 && (
            <span className="absolute top-4 left-4 bg-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-xl shadow-md">
              {product.badge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          {category && (
            <button
              onClick={() => navigate({ name: 'catalog', categoryId: category.id })}
              className="text-sm font-medium text-green-600 hover:underline mb-2 text-left"
            >
              {category.name}
            </button>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {product.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold text-gray-700">{product.rating}</span>
            </div>
            <span className="text-sm text-gray-400">{product.reviews} reviews</span>
            {product.inStock ? (
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <Check className="w-4 h-4" /> In Stock
              </span>
            ) : (
              <span className="text-sm text-red-500 font-medium">Out of Stock</span>
            )}
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

          {/* Price */}
          <div className="flex flex-wrap items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {formatTzs(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {formatTzs(product.originalPrice)}
                </span>
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded-lg">
                  Save {discount}%
                </span>
              </>
            )}
            <span className="text-sm text-gray-500">{product.unit}</span>
          </div>

          {/* Nutrition */}
          {product.nutrition && (
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Nutrition Facts</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Calories', value: product.nutrition.calories },
                  { label: 'Protein', value: product.nutrition.protein },
                  { label: 'Carbs', value: product.nutrition.carbs },
                  { label: 'Fat', value: product.nutrition.fat },
                ].map((n) => (
                  <div key={n.label} className="text-center">
                    <p className="text-sm font-bold text-gray-900">{n.value}</p>
                    <p className="text-xs text-gray-500">{n.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl">
              <button
                aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-gray-600 hover:text-green-600 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                aria-label="Increase quantity" disabled={quantity >= remainingStock} onClick={() => setQuantity((q) => Math.min(q + 1, remainingStock))}
                className="w-11 h-11 flex items-center justify-center text-gray-600 hover:text-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!product.inStock || quantity > remainingStock}
              className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all ${
                added
                  ? 'bg-green-100 text-green-700'
                  : 'bg-green-600 text-white hover:bg-green-700 active:scale-[0.98]'
              } disabled:bg-gray-200 disabled:text-gray-400`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart - {formatTzs(product.price * quantity)}
                </>
              )}
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            {[
              { icon: Truck, label: settingsReady ? `Free delivery over ${formatTzs(settings.free_delivery_cents / 100)}` : 'Check delivery fees at checkout' },
              { icon: RefreshCw, label: 'Review your order before checkout' },
              { icon: Shield, label: 'Server-verified order pricing' },
            ].map((badge) => (
              <div key={badge.label} className="flex flex-col items-center text-center gap-1">
                <badge.icon className="w-5 h-5 text-green-600" />
                <span className="text-xs text-gray-600">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">You might also like</h2>
          <div className="product-grid">
            {related.map((p: Product) => (
              <ProductCard
                key={p.id}
                product={p}
                onQuickView={(prod) => navigate({ name: 'product', productId: prod.id })}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
