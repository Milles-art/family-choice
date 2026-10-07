import { Sparkles, ChevronRight, Home } from 'lucide-react';
import { products } from '../data';
import { useStore } from '../store';
import { ProductCard } from './ProductCard';

export function NewArrivalsPage() {
  const { navigate } = useStore();
  const arrivals = products.slice(0, 12);

  return (
    <div className="store-container py-6">
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate({ name: 'home' })} className="hover:text-green-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">New Arrivals</span>
      </div>

      <section className="rounded-3xl bg-gradient-to-r from-emerald-600 to-green-700 text-white p-6 md:p-10 mb-8">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-100 mb-2">
          <Sparkles className="w-5 h-5" /> Just added
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">New arrivals</h1>
        <p className="text-green-50 max-w-xl">Explore the latest products added to FAMILY CHOICE SUPERMARKET, ready for delivery in Dar es Salaam.</p>
      </section>

      {arrivals.length ? (
        <div className="product-grid">
          {arrivals.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={(item) => navigate({ name: 'product', productId: item.id })} />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center">
          <h2 className="text-xl font-bold text-gray-900">New products are on their way</h2>
          <p className="text-gray-500 mt-2">Check back shortly, or browse everything currently in stock.</p>
          <button onClick={() => navigate({ name: 'catalog' })} className="mt-5 px-5 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700">Shop all products</button>
        </div>
      )}
    </div>
  );
}
