import { useStore } from '../store';
import { recipes, getProductById } from '../data';
import type { Product } from '../types';
import { Clock, Users, ChevronRight, Home, Plus, Check } from 'lucide-react';
import { useState } from 'react';
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
    <div className="store-container fc-recipes-page py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
        <button
          onClick={() => navigate({ name: 'home' })}
          className="hover:text-green-600 flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5" /> Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">Recipes</span>
      </div>

      {/* Header */}
      <div className="fc-recipe-heading mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Recipe Ideas</h1>
        <p className="text-gray-500">
          Find mealtime inspiration and explore ingredients available in the current catalogue.
        </p>
      </div>

      {/* Recipe cards */}
      <div className="fc-recipe-list">
        {recipes.map((recipe) => {
          const ingredients = recipe.productIds
            .map((id) => getProductById(id))
            .filter((p): p is Product => !!p);
          const totalPrice = ingredients.reduce((sum, p) => sum + p.price, 0);
          const isAdded = addedRecipes.has(recipe.id);

          return (
            <div
              key={recipe.id}
              className="fc-recipe-detail"
            >
              <div className="fc-recipe-photo relative overflow-hidden">
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
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-sm font-bold text-gray-900">
                  {formatTzs(totalPrice)}
                </div>
              </div>
              <div className="fc-recipe-body p-5">
                <h2 className="text-lg font-bold text-gray-900 mb-1">{recipe.name}</h2>
                <p className="text-sm text-gray-500 mb-3">{recipe.description}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {recipe.prepTime}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> {recipe.servings} servings
                  </span>
                </div>

                {/* Ingredients */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Available catalogue ingredients</h3>
                  <p className="text-xs text-gray-600 mb-3">The amount above covers these catalogue items only. Other ingredients and pantry basics may be needed.</p>
                  <div className="space-y-1.5">
                    {ingredients.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => navigate({ name: 'product', productId: product.id })}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-contain flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500">{product.unit}</p>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                          {formatTzs(product.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleAddAll(recipe.id, ingredients.map(p => p.id))}
                  disabled={!ingredients.length}
                  className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all ${
                    isAdded
                      ? 'bg-green-100 text-green-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isAdded ? (
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
          );
        })}
      </div>
    </div>
  );
}
