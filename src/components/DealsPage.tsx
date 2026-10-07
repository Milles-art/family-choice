import { useState } from 'react';
import { useStore } from '../store';
import { getDealProducts, deals, categories } from '../data';
import { ProductCard } from './ProductCard';
import { imageUrl, imageSet } from '../images';
import { ChevronRight, Home } from 'lucide-react';

export function DealsPage() {
  const { navigate } = useStore();
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('relevance');
  const offers = getDealProducts();
  const dealProducts = offers.filter(product => !category || product.categoryId === category);
  if (sort === 'price-low') dealProducts.sort((a,b) => a.price-b.price);
  if (sort === 'discount') dealProducts.sort((a,b) => (1-b.price/(b.originalPrice || b.price))-(1-a.price/(a.originalPrice || a.price)));
  const offerCategories = categories.filter(item => offers.some(product => product.categoryId === item.id));

  return (
    <div className="store-container deals-page py-6">
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

      <section className="deals-intro" aria-labelledby="deals-title">
        <h1 id="deals-title">Today's Deals</h1>
        <p>Explore current offers on groceries and household essentials.</p>
      </section>

      {/* Deal banners */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {deals.map((deal) => (
          <button
            key={deal.id}
            onClick={() => navigate({ name: 'catalog', categoryId: deal.categoryId })}
            aria-label={`${deal.title}: ${deal.buttonText}`}
            className="block aspect-[16/9] rounded-2xl overflow-hidden bg-white hover:scale-[1.02] transition-transform"
          >
            <img
              src={imageUrl(categories.find(item => item.id === deal.categoryId)?.image ?? deal.image, 480)}
              srcSet={imageSet(categories.find(item => item.id === deal.categoryId)?.image ?? deal.image)}
              sizes="(min-width: 640px) 33vw, 100vw"
              width={480}
              height={480}
              loading="lazy"
              decoding="async"
              alt={deal.title}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Deal products grid */}
      <div className="deals-toolbar">
        <div><h2>All sale items</h2><p role="status">{dealProducts.length} {dealProducts.length === 1 ? 'item' : 'items'}</p></div>
        <div className="deals-controls">
          <label>Category<select aria-label="Category" value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{offerCategories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Sort by<select aria-label="Sort by" value={sort} onChange={event => setSort(event.target.value)}><option value="relevance">Catalogue order</option><option value="price-low">Price: low to high</option><option value="discount">Biggest discount</option></select></label>
        </div>
      </div>
      {!dealProducts.length && <div className="surface p-6 mb-6"><p>No sale items available in this category.</p><button className="button-secondary mt-3" onClick={() => setCategory('')}>Show all sale items</button></div>}

      <div className="product-grid">
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
