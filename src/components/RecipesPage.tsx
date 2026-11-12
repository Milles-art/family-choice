import { useStore } from '../store';
import { recipes, getProductById } from '../data';
import type { Product } from '../types';
import { Clock, Users, ChevronRight, Home, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatTzs } from '../currency';
import { imageSet } from '../images';

export function RecipesPage() {
  const { navigate, addToCart } = useStore();
  const [addedRecipes, setAddedRecipes] = useState<Set<string>>(new Set());

  const handleAddAll = (recipeId: string, productIds: string[]) => {
    productIds.forEach((id) => {
      const product = getProductById(id);
      if (product) addToCart(product);
    });
    setAddedRecipes((prev) => new Set(prev).add(recipeId));
    setTimeout(() => {
      setAddedRecipes((prev) => {
        const next = new Set(prev);
        next.delete(recipeId);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="fc-ref">
      {/* Reference hero: warm canvas, dot pattern, giant display type. */}
      <section className="relative overflow-hidden bg-[#FFE9B0]" aria-labelledby="recipes-title">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
        <div className="relative store-container pt-4 pb-12 sm:pb-16">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
            <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-1 hover:text-primary"><Home className="w-3.5 h-3.5" /> Home</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-[#4A2618]">Recipes</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Recipes · Cook with what's in store</p>
          <h1 id="recipes-title" className="mt-4 font-display text-[15vw] leading-[0.82] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[10vw] lg:text-[7.5vw]">
            {['Recipe', 'ideas.'].map((line, i) => (
              <motion.span key={line} initial={{ y: '25%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }} className={i === 1 ? 'block text-primary' : 'block'}>{line}</motion.span>
            ))}
          </h1>
          <p className="mt-8 max-w-2xl text-[#4A2618]/75 sm:text-lg">
            Find mealtime inspiration and explore ingredients available in the current catalogue.
          </p>
        </div>
      </section>

      <div className="store-container py-12 sm:py-16">
        <div className="fc-recipe-list space-y-6">
          {recipes.map((recipe, index) => {
            const ingredients = recipe.productIds
              .map((id) => getProductById(id))
              .filter((p): p is Product => !!p);
            const totalPrice = ingredients.reduce((sum, p) => sum + p.price, 0);
            const isAdded = addedRecipes.has(recipe.id);

            return (
              <motion.article
                key={recipe.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(index, 3) * 0.08 }}
                className="fc-recipe-detail grid overflow-hidden rounded-[2rem] bg-card ring-1 ring-border md:grid-cols-2"
              >
                <div className="fc-recipe-photo relative min-h-[220px] overflow-hidden">
                  <img
                    src={recipe.image}
                    srcSet={imageSet(recipe.image)}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    width={960}
                    height={640}
                    loading="lazy"
                    decoding="async"
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                  {ingredients.length > 0 && (
                    <div className="absolute top-3 right-3 rounded-full bg-white/90 px-4 py-1.5 text-sm font-bold text-[#4A2618] backdrop-blur-sm">
                      {formatTzs(totalPrice)}
                    </div>
                  )}
                </div>
                <div className="fc-recipe-body p-6 sm:p-8">
                  <h2 className="font-display text-2xl font-extrabold tracking-tighter text-[#4A2618] uppercase">{recipe.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{recipe.description}</p>

                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {recipe.prepTime}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> {recipe.servings} servings</span>
                  </div>

                  {/* Ingredients */}
                  <div className="mt-6">
                    <h3 className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Available catalogue ingredients</h3>
                    <p className="mt-2 text-xs text-muted-foreground">{ingredients.length ? 'The amount above covers these catalogue items only. Other ingredients and pantry basics may be needed.' : 'Catalogue ingredients will be available after the real products are added.'}</p>
                    <div className="mt-3 space-y-1.5">
                      {ingredients.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => navigate({ name: 'product', productId: product.id })}
                          className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-[#4A2618]">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.unit}</p>
                          </div>
                          <span className="text-sm font-bold text-primary">{formatTzs(product.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddAll(recipe.id, ingredients.map(p => p.id))}
                    disabled={!ingredients.length}
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold transition-all ${
                      isAdded
                        ? 'bg-[#FFF0F4] text-primary'
                        : 'bg-primary text-primary-foreground hover:bg-primary/80'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {isAdded ? (
                      <><Check className="w-5 h-5" /> Ingredients Added!</>
                    ) : (
                      <><Plus className="w-5 h-5" /> {ingredients.length ? 'Add Available Ingredients' : 'Ingredients currently unavailable'}</>
                    )}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
