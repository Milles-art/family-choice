import { Heart, ChevronRight, Home, ShoppingBag } from 'lucide-react';
import { getProductById } from '../data';
import { useStore } from '../store';
import { ProductCard } from './ProductCard';

export function WishlistPage() {
  const { wishlistIds, navigate } = useStore();
  const wishlistProducts = wishlistIds.flatMap((id) => {
    const product = getProductById(id);
    return product ? [product] : [];
  });

  return (
    <div className="store-container py-6">
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate({ name: 'home' })} className="hover:text-green-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">Wishlist</span>
      </div>
      <div className="flex items-center gap-3 mb-7">
        <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center"><Heart className="w-5 h-5 fill-current" /></div>
        <div><h1 className="text-3xl font-bold text-gray-900">Your wishlist</h1><p className="text-sm text-gray-500">Save favourites and come back to them anytime.</p></div>
      </div>
      {wishlistProducts.length ? (
        <div className="product-grid">
          {wishlistProducts.map((product) => <ProductCard key={product.id} product={product} onQuickView={(item) => navigate({ name: 'product', productId: item.id })} />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center">
          <ShoppingBag className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Your wishlist is empty</h2>
          <p className="text-gray-500 mt-2">Tap the heart on any product to save it here.</p>
          <button onClick={() => navigate({ name: 'catalog' })} className="mt-5 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">Start shopping</button>
        </div>
      )}
    </div>
  );
}
