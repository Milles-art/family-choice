import { useStore } from '../store';
import { getDealProducts, deals } from '../data';
import { ProductCard } from './ProductCard';
import { Flame, ChevronRight, Home, Tag } from 'lucide-react';

export function DealsPage() {
  const { navigate } = useStore();
  const dealProducts = getDealProducts();

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
        <span className="text-gray-900 font-medium">Today's Deals</span>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-6 md:p-10 mb-8 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-6 h-6" />
          <span className="text-sm font-semibold uppercase tracking-wide">Limited Time</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Today's Best Deals</h1>
        <p className="text-white/90">
          Save big on fresh groceries, premium meats, and household essentials
        </p>
      </div>

      {/* Deal banners */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {deals.map((deal) => (
          <button
            key={deal.id}
            onClick={() => navigate({ name: 'catalog', categoryId: deal.categoryId })}
            className={`relative h-32 rounded-2xl overflow-hidden bg-gradient-to-r ${deal.bgColor} text-white text-left p-5 flex flex-col justify-between hover:scale-[1.02] transition-transform`}
          >
            <div>
              <h3 className="font-bold text-lg leading-tight">{deal.title}</h3>
              <p className="text-sm text-white/80">{deal.subtitle}</p>
            </div>
            <span className="text-sm font-semibold flex items-center gap-1">
              {deal.buttonText} <ChevronRight className="w-4 h-4" />
            </span>
            <img
              src={deal.image}
              alt={deal.title}
              className="absolute right-0 top-0 h-full w-1/3 object-cover opacity-30"
            />
          </button>
        ))}
      </div>

      {/* Deal products grid */}
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900">All Sale Items</h2>
        <span className="text-sm text-gray-500">({dealProducts.length} items)</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {dealProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={(p) => navigate({ name: 'product', productId: p.id })}
          />
        ))}
      </div>
    </div>
  );
}
