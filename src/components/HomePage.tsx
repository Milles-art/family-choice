import { useStore } from '../store';
import {
  categories,
  deals,
  getDealProducts,
  getBestSellers,
  getNewArrivals,
  recipes,
  getProductById,
} from '../data';
import type { Product } from '../types';
import { ProductCard } from './ProductCard';
import {
  ArrowRight,
  Clock,
  Users,
  Truck,
  Shield,
  Clock3,
  Sparkles,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatTzs } from '../currency';

export function HomePage() {
  const { navigate, addToCart, recentlyViewed } = useStore();
  const [currentDeal, setCurrentDeal] = useState(0);
  const [countdown, setCountdown] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDeal((prev) => (prev + 1) % deals.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealProducts = getDealProducts().slice(0, 10);
  const bestSellers = getBestSellers().slice(0, 10);
  const newArrivals = getNewArrivals().slice(0, 5);
  const recentProducts = recentlyViewed
    .map((id) => getProductById(id))
    .filter((p): p is Product => !!p)
    .slice(0, 5);


  return (
    <div className="space-y-10 pb-6">
      {/* Hero carousel */}
      <section className="relative h-[280px] md:h-[400px] rounded-3xl overflow-hidden">
        {deals.map((d, i) => (
          <div
            key={d.id}
            className={`absolute inset-0 bg-gradient-to-r ${d.bgColor} transition-opacity duration-700 ${
              i === currentDeal ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-6 md:px-10 w-full flex items-center justify-between">
                <div className="text-white max-w-md">
                  <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold mb-3">
                    Limited Time Offer
                  </span>
                  <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-2">
                    {d.title}
                  </h2>
                  <p className="text-white/90 text-sm md:text-lg mb-4">{d.subtitle}</p>
                  <button
                    onClick={() => navigate({ name: 'catalog', categoryId: d.categoryId })}
                    className="inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm"
                  >
                    {d.buttonText}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="hidden md:block w-64 h-64 rounded-2xl overflow-hidden flex-shrink-0">
                  <img src={d.image} alt={d.title} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {deals.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentDeal(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentDeal ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Flash sale countdown */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <Flame className="w-8 h-8" />
            <div>
              <h3 className="text-lg font-bold">Flash Sale Ends In</h3>
              <p className="text-sm text-white/80">Hurry up, deals won't last long!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: 'Hours', value: countdown.hours },
              { label: 'Mins', value: countdown.minutes },
              { label: 'Secs', value: countdown.seconds },
            ].map((time, i) => (
              <div key={time.label} className="flex items-center gap-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center min-w-14">
                  <p className="text-2xl font-bold text-white tabular-nums">
                    {String(time.value).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] text-white/70 uppercase">{time.label}</p>
                </div>
                {i < 2 && <span className="text-white text-xl font-bold">:</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Truck, title: 'Free Delivery', subtitle: 'On orders over TSh 75,000' },
            { icon: Clock3, title: 'Same-Day Pickup', subtitle: 'Ready in 2 hours' },
            { icon: Shield, title: 'Quality Promise', subtitle: 'Fresh or refunded' },
            { icon: Sparkles, title: 'Daily Deals', subtitle: 'New savings every day' },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4"
            >
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Shop by Category</h2>
          <button
            onClick={() => navigate({ name: 'catalog' })}
            className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate({ name: 'catalog', categoryId: cat.id })}
              className="group flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-gray-200 transition-all"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Deal products */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            <span className="text-red-500">Today's Deals</span>
          </h2>
          <button
            onClick={() => navigate({ name: 'deals' })}
            className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
          {dealProducts.map((product) => (
            <div key={product.id} className="w-44 sm:w-52 flex-shrink-0 snap-start">
              <ProductCard
                product={product}
                onQuickView={(p) => navigate({ name: 'product', productId: p.id })}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Best Sellers</h2>
          <button
            onClick={() => navigate({ name: 'catalog' })}
            className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {bestSellers.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onQuickView={(p) => navigate({ name: 'product', productId: p.id })}
            />
          ))}
        </div>
      </section>

      {/* Recipe suggestions */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Recipe Ideas</h2>
          <button
            onClick={() => navigate({ name: 'recipes' })}
            className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {recipes.map((recipe) => {
            const ingredients = recipe.productIds
              .map((id) => getProductById(id))
              .filter((p): p is Product => !!p);
            const totalPrice = ingredients.reduce((sum, p) => sum + p.price, 0);
            return (
              <div
                key={recipe.id}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {formatTzs(totalPrice)} total
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{recipe.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {recipe.prepTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {recipe.servings} servings
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      ingredients.forEach((p) => addToCart(p));
                    }}
                    className="w-full bg-green-50 text-green-700 font-medium py-2.5 rounded-xl hover:bg-green-100 transition-colors text-sm"
                  >
                    Add All Ingredients
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">New Arrivals</h2>
            <button
              onClick={() => navigate({ name: 'catalog' })}
              className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => navigate({ name: 'product', productId: p.id })}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      {recentProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">Recently Viewed</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => navigate({ name: 'product', productId: p.id })}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
