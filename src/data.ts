import type { Category, Product, Recipe, Deal } from './types';

export const categories: Category[] = [
  {
    id: 'produce',
    name: 'Fruits & Vegetables',
    icon: 'Apple',
    image: 'https://images.pexels.com/photos/33622710/pexels-photo-33622710.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: '#16a34a',
  },
  {
    id: 'dairy',
    name: 'Dairy & Eggs',
    icon: 'Milk',
    image: 'https://images.pexels.com/photos/37935979/pexels-photo-37935979.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: '#0891b2',
  },
  {
    id: 'meat',
    name: 'Meat & Poultry',
    icon: 'Beef',
    image: 'https://images.pexels.com/photos/1314041/pexels-photo-1314041.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: '#dc2626',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    icon: 'Croissant',
    image: 'https://images.pexels.com/photos/2680601/pexels-photo-2680601.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: '#d97706',
  },
  {
    id: 'beverages',
    name: 'Beverages',
    icon: 'CupSoda',
    image: 'https://images.pexels.com/photos/3651045/pexels-photo-3651045.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: '#7c3aed',
  },
  {
    id: 'frozen',
    name: 'Frozen Foods',
    icon: 'Snowflake',
    image: 'https://images.pexels.com/photos/5535556/pexels-photo-5535556.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: '#0ea5e9',
  },
  {
    id: 'pantry',
    name: 'Pantry & Staples',
    icon: 'Wheat',
    image: 'https://images.pexels.com/photos/38802734/pexels-photo-38802734.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: '#ca8a04',
  },
  {
    id: 'household',
    name: 'Household',
    icon: 'SprayCan',
    image: 'https://images.pexels.com/photos/28921817/pexels-photo-28921817.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    color: '#64748b',
  },
];

// Products are loaded from the Laravel catalog API before the storefront renders.
export const products: Product[] = [];

export const deals: Deal[] = [
  {
    id: 'd1',
    title: 'Weekend Mega Sale',
    subtitle: 'Up to 30% off on fresh produce',
    image: 'https://images.pexels.com/photos/33622710/pexels-photo-33622710.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    buttonText: 'Shop Produce',
    bgColor: 'from-green-600 to-emerald-700',
    categoryId: 'produce',
  },
  {
    id: 'd2',
    title: 'Butcher\'s Choice',
    subtitle: 'Premium cuts at unbeatable prices',
    image: 'https://images.pexels.com/photos/1314041/pexels-photo-1314041.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    buttonText: 'Shop Meat',
    bgColor: 'from-red-600 to-rose-700',
    categoryId: 'meat',
  },
  {
    id: 'd3',
    title: 'Bakery Fresh Daily',
    subtitle: 'Artisan breads & pastries, baked every morning',
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
    image: 'https://images.pexels.com/photos/8696466/pexels-photo-8696466.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    description: 'Tender ribeye steak with colorful bell peppers in a savory sauce. Ready in 25 minutes.',
    prepTime: '25 min',
    servings: 4,
    productIds: ['p15', 'p2', 'p4', 'p32'],
  },
  {
    id: 'r2',
    name: 'Fresh Morning Breakfast',
    image: 'https://images.pexels.com/photos/9207055/pexels-photo-9207055.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    description: 'A hearty breakfast spread with artisan bread, free-range eggs, and fresh fruit.',
    prepTime: '15 min',
    servings: 2,
    productIds: ['p11', 'p22', 'p6', 'p24'],
  },
  {
    id: 'r3',
    name: 'Summer Fruit Dessert',
    image: 'https://images.pexels.com/photos/19087695/pexels-photo-19087695.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    description: 'A refreshing banana split with seasonal fruits. The perfect summer dessert.',
    prepTime: '10 min',
    servings: 2,
    productIds: ['p31', 'p1', 'p8', 'p7'],
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
