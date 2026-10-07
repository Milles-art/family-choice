export type Category = {
  id: string;
  name: string;
  icon: string;
  image: string;
  color: string;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  unit: string;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  stock?: number;
  tags: string[];
  badge?: string;
  nutrition?: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type CheckoutDraft = {
  deliveryInfo: {name:string;address:string;city:string;zip:string;phone:string;instructions:string};
  deliveryOption: 'delivery'|'pickup';
  timeSlot: string;
  paymentMethod: string;
  paymentProvider: string;
  paymentReference: string;
  requestId: string;
  payerPhone?: string;
};

export type Recipe = {
  id: string;
  name: string;
  image: string;
  description: string;
  prepTime: string;
  servings: number;
  productIds: string[];
};

export type Deal = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  buttonText: string;
  bgColor: string;
  categoryId?: string;
};

export type Page =
  | { name: 'home' }
  | { name: 'catalog'; categoryId?: string; searchQuery?: string }
  | { name: 'product'; productId: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'account' }
  | { name: 'recipes' }
  | { name: 'deals' }
  | { name: 'new-arrivals' }
  | { name: 'wishlist' }
  | { name: 'info'; section: 'delivery' | 'how-it-works' | 'about' | 'help' }
  | { name: 'privacy' }
  | { name: 'track'; orderId?: number }
  | { name: 'forgot-password' }
  | { name: 'reset-password'; token: string; email: string };
