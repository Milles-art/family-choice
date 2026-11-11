import type { Category, Product, Recipe, Deal } from './types';

export const categories: Category[] = [
  { id: 'personal-care', name: 'Personal Care', icon: 'Sparkles', image: '/images/editorial/category-household-essentials-640.webp', color: '#64748b' },
  {
    id: 'produce',
    name: 'Fruits & Vegetables',
    icon: 'Apple',
    image: '/images/editorial/category-fruits-vegetables-640.webp',
    color: '#16a34a',
  },
  {
    id: 'dairy',
    name: 'Dairy & Eggs',
    icon: 'Milk',
    image: '/images/editorial/category-dairy-eggs-640.webp',
    color: '#0891b2',
  },
  {
    id: 'beverages',
    name: 'Beverages',
    icon: 'CupSoda',
    image: '/images/editorial/category-beverages-640.webp',
    color: '#7c3aed',
  },
  {
    id: 'pantry',
    name: 'Pantry Staples',
    icon: 'Wheat',
    image: '/images/editorial/category-pantry-staples-640.webp',
    color: '#ca8a04',
  },
  {
    id: 'snacks',
    name: 'Snacks & Sweets',
    icon: 'Cookie',
    image: '/images/editorial/category-bakery-640.webp',
    color: '#ea580c',
  },
  {
    id: 'household',
    name: 'Household Essentials',
    icon: 'SprayCan',
    image: '/images/editorial/category-household-essentials-640.webp',
    color: '#64748b',
  },
  {
    id: 'general',
    name: 'General Merchandise',
    icon: 'ShoppingBag',
    image: '/images/editorial/about-store-interior-concept-960.webp',
    color: '#0d9488',
  },
];

// Products are hydrated from the Laravel API; the store context announces each refresh.
export const products: Product[] = [];

export const deals: Deal[] = [
  {
    id: 'd1',
    title: 'Fresh produce favourites',
    subtitle: 'Explore fruits and vegetables for your basket',
    image: 'https://images.pexels.com/photos/33622710/pexels-photo-33622710.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    buttonText: 'Shop Produce',
    bgColor: 'from-green-600 to-emerald-700',
    categoryId: 'produce',
  },
  {
    id: 'd2',
    title: 'Refreshing drinks',
    subtitle: 'Water, juice and everyday favourites',
    image: '/images/editorial/category-beverages-640.webp',
    buttonText: 'Shop Beverages',
    bgColor: 'from-sky-600 to-blue-700',
    categoryId: 'beverages',
  },
  {
    id: 'd3',
    title: 'Snack time',
    subtitle: 'Biscuits, sweets and crunchy favourites',
    image: '/images/editorial/category-bakery-640.webp',
    buttonText: 'Shop Snacks',
    bgColor: 'from-orange-600 to-amber-700',
    categoryId: 'snacks',
  },
];

export const recipes: Recipe[] = [
  {
    id: 'r1',
    name: 'Pepper Steak Stir-Fry',
    image: '/images/editorial/recipe-beef-pepper-stir-fry-960.webp',
    description: 'Tender ribeye steak with colorful bell peppers in a savory sauce. Ready in 25 minutes.',
    prepTime: '25 min',
    servings: 4,
    productIds: [],
  },
  {
    id: 'r2',
    name: 'Fresh Morning Breakfast',
    image: '/images/editorial/recipe-eggs-toast-tomato-960.webp',
    description: 'Scrambled eggs, toast and tomato for a simple start to the day.',
    prepTime: '15 min',
    servings: 2,
    productIds: [],
  },
  {
    id: 'r3',
    name: 'Summer Fruit Dessert',
    image: '/images/editorial/recipe-tropical-fruit-dessert-960.webp',
    description: 'A bowl of mango, pineapple, banana and watermelon for a fresh fruit dessert.',
    prepTime: '10 min',
    servings: 2,
    productIds: [],
  },
];

export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter((p) => p.categoryId === categoryId);
}
export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id || p.sourceIds?.includes(id));
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getDealProducts(): Product[] {
  return products.filter((p) => p.tags.includes('deal'));
}

export function getBestSellers(): Product[] {
  return products.filter((p) => p.tags.includes('bestseller'));
}

export function getNewArrivals(): Product[] {
  return products.filter((p) => p.tags.includes('new'));
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.unit.toLowerCase().includes(q) ||
      (p.sourceIds ?? [p.id]).some(id => id.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q) ||
      getCategoryById(p.categoryId)?.name.toLowerCase().includes(q)
  );
}
