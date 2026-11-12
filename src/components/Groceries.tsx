import { motion } from 'framer-motion';
import { ArrowRight, ShoppingBasket } from 'lucide-react';
import { useStore } from '../store';
import { getProductsByCategory, products } from '../data';
import { formatTzs } from '../currency';
import { images } from '../site-data';
import { StoreLink } from './StoreLink';

export function Groceries() {
  // Subscribes to the store so the list refreshes when the live catalogue lands
  // (the store splices /products into the shared array in place).
  useStore();
  const produce = getProductsByCategory('produce').filter((item) => item.price > 0);
  const items = (produce.length >= 4 ? produce : products.filter((item) => item.price > 0)).slice(0, 6);

  return (
    <section id="groceries" className="bg-background py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative"
        >
          <img
            src={images.veg}
            alt="Fresh tomatoes, onions, potatoes and cassava"
            loading="lazy"
            className="aspect-[4/3] w-full rounded-[2.5rem] object-cover shadow-2xl"
          />
          <div className="absolute -right-3 -bottom-5 flex items-center gap-3 rounded-3xl bg-accent px-5 py-3 shadow-xl md:-right-8">
            <ShoppingBasket className="size-6 text-[#0F7A55]" />
            <p className="font-display text-lg font-semibold">Fresh every day</p>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">
              Beyond the freezer
            </p>
            <h2 className="font-display text-4xl font-bold text-balance md:text-5xl">
              Fresh groceries for the whole family
            </h2>
            <p className="text-muted-foreground">
              Today&apos;s prices on fresh produce. Browse the full range on our products page.
            </p>
          </motion.div>

          {items.length > 0 && (
            <ul className="divide-y divide-[#efd9cd] rounded-3xl border border-[#efd9cd] bg-card">
              {items.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.unit}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 font-display font-semibold text-primary">
                    {formatTzs(item.price)}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}

          <StoreLink
            to={{ name: 'catalog' }}
            className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold tracking-wider text-primary-foreground uppercase shadow-lg shadow-primary/25 transition-all hover:gap-3"
          >
            See all products <ArrowRight className="size-4" />
          </StoreLink>
        </div>
      </div>
    </section>
  );
}
