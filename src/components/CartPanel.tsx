import { settings } from '../api';
import { useStore } from '../store';
import { formatTzs } from '../currency';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Tag,
  Truck,
  ArrowRight,
} from 'lucide-react';

export function CartPanel() {
  const {
    cart,
    cartOpen,
    setCartOpen,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cartSavings,
    cartCount,
    navigate,
  } = useStore();

  if (!cartOpen) return null;

  const freeDeliveryThreshold = settings.free_delivery_cents / 100;
  const remainingForFree = Math.max(0, freeDeliveryThreshold - cartSubtotal);
  const progress = Math.min(100, (cartSubtotal / freeDeliveryThreshold) * 100);

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />

      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-600" />
            <h2 className="font-bold text-gray-900">Your Cart</h2>
            {cartCount > 0 && (
              <span className="text-sm text-gray-500">({cartCount} items)</span>
            )}
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {cart.length === 0 ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900 text-lg">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">
                Browse our aisles and add your favorite items
              </p>
            </div>
            <button
              onClick={() => {
                setCartOpen(false);
                navigate({ name: 'catalog' });
              }}
              className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Free delivery progress */}
            <div className="px-4 py-3 bg-green-50 border-b border-green-100">
              {remainingForFree > 0 ? (
                <p className="text-sm text-green-800">
                  Add{' '}
                  <span className="font-bold">
                    {formatTzs(remainingForFree)}
                  </span>{' '}
                  more for FREE delivery!
                </p>
              ) : (
                <p className="text-sm text-green-800 font-semibold flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  You've unlocked FREE delivery!
                </p>
              )}
              <div className="mt-2 h-1.5 bg-green-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 bg-gray-50 rounded-xl p-3"
                >
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">{item.product.unit}</p>
                    <div className="flex items-center justify-between">
                      {/* Quantity stepper */}
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {formatTzs(item.product.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary footer */}
            <div className="border-t border-gray-100 p-4 space-y-3">
              {cartSavings > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-green-600">
                    <Tag className="w-4 h-4" />
                    You're saving
                  </span>
                  <span className="font-semibold text-green-600">
                    {formatTzs(cartSavings)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatTzs(cartSubtotal)}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Delivery and taxes calculated at checkout
              </p>
              <button
                onClick={() => {
                  setCartOpen(false);
                  navigate({ name: 'checkout' });
                }}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 transition-colors active:scale-[0.98]"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
