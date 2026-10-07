import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Clock, Home, Plus, Users } from 'lucide-react';
import { useStore } from '../store';
import { getProductById, recipes } from '../data';
import type { Product } from '../types';
import { formatTzs } from '../currency';
import { imageSet, imageUrl } from '../images';

export function RecipeDetail({ recipeId }: { recipeId: string }) {
  const { navigate, addToCart, showToast } = useStore();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);
  const recipe = recipes.find((r) => r.id === recipeId);

  if (!recipe) {
    return (
      <div className="store-container py-16 text-center">
        <p className="text-gray-500">Recipe not found</p>
        <button onClick={() => navigate({ name: 'recipes' })} className="mt-4 text-green-600 font-medium">
          Back to recipes
        </button>
      </div>
    );
  }

  const ingredients = recipe.productIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => !!p);
  const totalPrice = ingredients.reduce((sum, p) => sum + p.price, 0);

  const handleAddAll = () => {
    let addedCount = 0;
    let skipped = 0;
    ingredients.forEach((product) => {
      if (addToCart(product)) addedCount += 1;
      else skipped += 1;
    });
    if (addedCount === 0) { showToast('Those ingredients are currently unavailable.', 'info'); return; }
    if (skipped > 0) showToast(`${addedCount} ingredient${addedCount === 1 ? '' : 's'} added; ${skipped} unavailable.`, 'info');
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="store-container fc-recipes-page py-6">
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate({ name: 'home' })} className="hover:text-green-600 flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Home
        </button>
        <span aria-hidden="true">/</span>
        <button onClick={() => navigate({ name: 'recipes' })} className="hover:text-green-600">
          Recipes
        </button>
        <span aria-hidden="true">/</span>
        <span className="text-gray-900 font-medium">{recipe.name}</span>
      </div>

      <button
        onClick={() => navigate({ name: 'recipes' })}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> All recipes
      </button>

      <div className="fc-recipe-detail">
        <div className="fc-recipe-photo relative overflow-hidden">
          <img
            src={recipe.image}
            srcSet={imageSet(recipe.image)}
            sizes="(min-width: 768px) 50vw, 100vw"
            width={960}
            height={640}
            loading="eager"
            decoding="async"
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
          {ingredients.length > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm font-bold text-gray-900">
              {formatTzs(totalPrice)}
            </div>
          )}
        </div>
        <div className="fc-recipe-body p-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{recipe.name}</h1>
          <p className="text-sm text-gray-500 mb-3">{recipe.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {recipe.prepTime}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4" /> {recipe.servings} servings
            </span>
          </div>

          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Available catalogue ingredients</h2>
            <p className="text-xs text-gray-600 mb-3">The amount above covers these catalogue items only. Other ingredients and pantry basics may be needed.</p>
            {ingredients.length ? (
              <div className="space-y-1.5">
                {ingredients.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => navigate({ name: 'product', productId: product.id })}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <img
                      src={imageUrl(product.image, 160)}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.unit}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{formatTzs(product.price)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Ingredients are still loading or currently unavailable.</p>
            )}
          </div>

          <button
            onClick={handleAddAll}
            disabled={!ingredients.length}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all ${
              added ? 'bg-green-100 text-green-700' : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {added ? (
              <>
                <Check className="w-5 h-5" /> Ingredients Added!
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" /> {ingredients.length ? 'Add Available Ingredients' : 'Ingredients currently unavailable'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
