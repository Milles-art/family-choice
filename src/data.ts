import type { Category, Product, Recipe, Deal } from './types';

export const categories: Category[] = [
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
    id: 'meat',
    name: 'Meat & Poultry',
    icon: 'Beef',
    image: '/images/editorial/category-meat-poultry-640.webp',
    color: '#dc2626',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    icon: 'Croissant',
    image: '/images/editorial/category-bakery-640.webp',
    color: '#d97706',
  },
  {
    id: 'beverages',
    name: 'Beverages',
    icon: 'CupSoda',
    image: '/images/editorial/category-beverages-640.webp',
    color: '#7c3aed',
  },
  {
    id: 'frozen',
    name: 'Frozen Foods',
    icon: 'Snowflake',
    image: '/images/editorial/category-frozen-foods-640.webp',
    color: '#0ea5e9',
  },
  {
    id: 'pantry',
    name: 'Pantry Staples',
    icon: 'Wheat',
    image: '/images/editorial/category-pantry-staples-640.webp',
    color: '#ca8a04',
  },
  {
    id: 'household',
    name: 'Household Essentials',
    icon: 'SprayCan',
    image: '/images/editorial/category-household-essentials-640.webp',
    color: '#64748b',
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
    title: 'Butcher\'s Choice',
    subtitle: 'Browse meat and poultry',
    image: 'https://images.pexels.com/photos/1314041/pexels-photo-1314041.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    buttonText: 'Shop Meat',
    bgColor: 'from-red-600 to-rose-700',
    categoryId: 'meat',
  },
  {
    id: 'd3',
    title: 'From the bakery',
    subtitle: 'Explore breads and pastries',
    image: 'https://images.pexels.com/photos/2680601/pexels-photo-2680601.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    buttonText: 'Shop Bakery',
    bgColor: 'from-amber-600 to-orange-700',
    categoryId: 'bakery',
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
  return products.find((p) => p.id === id);
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
      p.description.toLowerCase().includes(q) ||
      getCategoryById(p.categoryId)?.name.toLowerCase().includes(q)
  );
}
