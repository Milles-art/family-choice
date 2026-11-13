import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { getDealProducts, deals, categories } from '../data';
import { ProductCard } from './ProductCard';
import { imageUrl, imageSet } from '../images';
import { ChevronRight, Home, Tag } from 'lucide-react';

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
    <div className="fc-ref deals-page">
      {/* Reference hero: warm canvas, dot pattern, giant display type. */}
      <section className="relative overflow-hidden bg-[#FFE9B0]" aria-labelledby="deals-title">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
        <div className="relative store-container pt-4 pb-12 sm:pb-16">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
            <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-1 hover:text-primary">
              <Home className="w-3.5 h-3.5" /> Home
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-[#4A2618]">Today's Deals</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">
            {offers.length} offers · updated daily
          </p>
          <h1 id="deals-title" className="mt-4 font-display text-[15vw] leading-[0.82] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[10vw] lg:text-[7.5vw]">
            {['Today’s', 'deals.'].map((line, i) => (
              <motion.span
                key={line}
                initial={{ y: '25%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }}
                className={i === 1 ? 'block text-primary' : 'block'}
              >
                {line}
              </motion.span>
            ))}
          </h1>
          <p className="mt-8 max-w-2xl text-[#4A2618]/75 sm:text-lg">
            Explore current offers on groceries and household essentials. Prices are the
            same in store — add to your basket or send the list on WhatsApp.
          </p>
        </div>
      </section>

      <div className="store-container py-10 sm:py-14">
        {/* Deal banners */}
        <div className="deals-category-photos grid gap-4 sm:grid-cols-3 mb-10">
          {deals.map((deal) => (
            <button
              key={deal.id}
              onClick={() => navigate({ name: 'catalog', categoryId: deal.categoryId })}
              aria-label={`${deal.title}: ${deal.buttonText}`}
              className="group block aspect-[16/9] overflow-hidden rounded-[2rem] bg-card ring-1 ring-border transition-transform hover:-translate-y-1"
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

        {/* Toolbar */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Sale items</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-4xl">
              All sale items
            </h2>
            <p role="status" className="mt-1 text-sm text-muted-foreground">
              {dealProducts.length} {dealProducts.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div className="deals-controls flex gap-3">
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
              Category
              <select
                aria-label="Category"
                value={category}
                onChange={event => setCategory(event.target.value)}
                className="h-11 min-w-[10rem] cursor-pointer rounded-full border border-border bg-card px-4 text-base text-foreground outline-none transition-[color,box-shadow] focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="">All categories</option>
                {offerCategories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
              Sort by
              <select
                aria-label="Sort by"
                value={sort}
                onChange={event => setSort(event.target.value)}
                className="h-11 min-w-[10rem] cursor-pointer rounded-full border border-border bg-card px-4 text-base text-foreground outline-none transition-[color,box-shadow] focus:border-ring focus:ring-2 focus:ring-ring/50"
              >
                <option value="relevance">Catalogue order</option>
                <option value="price-low">Price: low to high</option>
                <option value="discount">Biggest discount</option>
              </select>
            </label>
          </div>
        </div>

        {!dealProducts.length && (
          <div className="mb-8 rounded-[2rem] border border-dashed border-border p-10 text-center">
            <div className="mx-auto mb-3 grid size-10 place-items-center rounded-lg bg-muted text-foreground">
              <Tag className="size-5" aria-hidden="true" />
            </div>
            <p className="font-display text-lg font-medium text-[#4A2618]">No sale items in this category</p>
            <button
              className="mt-4 h-11 cursor-pointer rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/80"
              onClick={() => setCategory('')}
            >
              Show all sale items
            </button>
          </div>
        )}

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
    </div>
  );
}
