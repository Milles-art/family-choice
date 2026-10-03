import { useStore } from '../store';
import { useState } from 'react';
import { api, settings, type Order } from '../api';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Clock,
  CreditCard,
  Truck,
  ShoppingBag,
  PartyPopper,
} from 'lucide-react';

type Step = 'delivery' | 'schedule' | 'payment' | 'review' | 'confirmation';

export function CheckoutPage() {
  const { cart, cartSubtotal, cartSavings, clearCart, navigate, showToast } = useStore();
  const [step, setStep] = useState<Step>('delivery');
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    address: '',
    city: '',
    zip: '',
    phone: '',
    instructions: '',
  });
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>('delivery');
  const [timeSlot, setTimeSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [requestId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (cart.length === 0 && step !== 'confirmation') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-gray-300" />
        </div>
        <p className="font-semibold text-gray-900 text-lg">Your cart is empty</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">Add some items before checking out</p>
        <button
          onClick={() => navigate({ name: 'catalog' })}
          className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const deliveryFee = deliveryOption === 'pickup' || cartSubtotal * 100 >= settings.free_delivery_cents ? 0 : settings.delivery_cents / 100;
  const tax = Math.round(cartSubtotal * 100 * settings.tax_rate) / 100;
  const total = cartSubtotal + deliveryFee + tax;

  const timeSlots = [
    'Today, 2:00 PM - 4:00 PM',
    'Today, 4:00 PM - 6:00 PM',
    'Today, 6:00 PM - 8:00 PM',
    'Tomorrow, 8:00 AM - 10:00 AM',
    'Tomorrow, 10:00 AM - 12:00 PM',
    'Tomorrow, 2:00 PM - 4:00 PM',
  ];

  const steps: { id: Step; label: string; icon: typeof MapPin }[] = [
    { id: 'delivery', label: 'Delivery', icon: MapPin },
    { id: 'schedule', label: 'Schedule', icon: Clock },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'review', label: 'Review', icon: ShoppingBag },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const handleNext = async () => {
    setError('');
    if (step === 'delivery') {
      if (!deliveryInfo.name.trim() || !deliveryInfo.phone.trim() || (deliveryOption === 'delivery' && (!deliveryInfo.address.trim() || !deliveryInfo.city.trim()))) { setError('Enter your name, phone number, and delivery address.'); return; }
      setStep('schedule');
    } else if (step === 'schedule') {
      if (!timeSlot) { setError('Choose a delivery or pickup time.'); return; }
      setStep('payment');
    } else if (step === 'payment') setStep('review');
    else if (step === 'review' && !busy) {
      setBusy(true);
      try {
        const order = await api<Order>('/orders','POST',{requestId,items:cart.map(i=>({productId:i.product.id,quantity:i.quantity})),delivery:deliveryInfo,deliveryOption,timeSlot,paymentMethod});
        setConfirmedOrder(order); setStep('confirmation'); clearCart(); showToast('Order received! Payment is due on delivery or pickup.');
      } catch (e) { setError(e instanceof Error ? e.message : 'Unable to place order.'); }
      finally { setBusy(false); }
    }
  };

  const handleBack = () => {
    if (step === 'schedule') setStep('delivery');
    else if (step === 'payment') setStep('schedule');
    else if (step === 'review') setStep('payment');
    else navigate({ name: 'cart' });
  };

  if (step === 'confirmation') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-500 mb-6">
            Your order has been saved. Payment is due on delivery or pickup.
          </p>

          <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Order Number</span>
              <span className="font-bold text-gray-900">{confirmedOrder?.number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Estimated Delivery</span>
              <span className="font-semibold text-gray-900">{timeSlot || 'Tomorrow, 10:00 AM - 12:00 PM'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Due</span>
              <span className="font-bold text-green-600">${((confirmedOrder?.total_cents ?? Math.round(total * 100)) / 100).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
              <Truck className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">
                {deliveryOption === 'delivery'
                  ? 'Your order will be delivered to your address'
                  : 'Your order will be ready for pickup at our store'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate({ name: 'home' })}
              className="flex-1 px-5 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate({ name: 'account' })}
              className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate({ name: 'home' })}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center mb-8 overflow-x-auto">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  i <= currentStepIndex
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < currentStepIndex ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-sm font-medium hidden sm:block ${
                  i <= currentStepIndex ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 ${
                  i < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form area */}
        <div className="md:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            {step === 'delivery' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg mb-1">Delivery Information</h2>

                {/* Delivery or pickup */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDeliveryOption('delivery')}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      deliveryOption === 'delivery'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <Truck className={`w-5 h-5 ${deliveryOption === 'delivery' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold">Delivery</span>
                  </button>
                  <button
                    onClick={() => setDeliveryOption('pickup')}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      deliveryOption === 'pickup'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <ShoppingBag className={`w-5 h-5 ${deliveryOption === 'pickup' ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold">Pickup</span>
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={deliveryInfo.name}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={deliveryInfo.phone}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                {deliveryOption === 'delivery' && (
                  <>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={deliveryInfo.city}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        placeholder="ZIP Code"
                        value={deliveryInfo.zip}
                        onChange={(e) => setDeliveryInfo({ ...deliveryInfo, zip: e.target.value })}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <textarea
                      placeholder="Delivery Instructions (optional)"
                      value={deliveryInfo.instructions}
                      onChange={(e) =>
                        setDeliveryInfo({ ...deliveryInfo, instructions: e.target.value })
                      }
                      rows={2}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  </>
                )}
                {deliveryOption === 'pickup' && (
                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">FreshCart Store</p>
                      <p className="text-sm text-gray-500">123 Market Street, Springfield, ST 12345</p>
                      <p className="text-xs text-gray-400 mt-1">Ready in approximately 2 hours</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 'schedule' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg mb-1">Choose a Time Slot</h2>
                <p className="text-sm text-gray-500 mb-3">
                  Select your preferred {deliveryOption === 'delivery' ? 'delivery' : 'pickup'} time
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setTimeSlot(slot)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        timeSlot === slot
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Clock
                        className={`w-5 h-5 flex-shrink-0 ${
                          timeSlot === slot ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                      <span className="text-sm font-medium text-gray-900">{slot}</span>
                      {timeSlot === slot && (
                        <Check className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg mb-1">Payment Method</h2>
                <div className="space-y-3">
                  {[
                    
                    
                    { id: 'cash', label: 'Cash on Delivery', icon: ShoppingBag },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <method.icon
                        className={`w-5 h-5 ${
                          paymentMethod === method.id ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                      <span className="text-sm font-semibold text-gray-900 flex-1 text-left">
                        {method.label}
                      </span>
                      {paymentMethod === method.id && (
                        <Check className="w-5 h-5 text-green-600" />
                      )}
                    </button>
                  ))}
                </div>


              </div>
            )}

            {step === 'review' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg mb-1">Review Your Order</h2>

                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {deliveryOption === 'delivery' ? 'Delivery to' : 'Pickup at'}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {deliveryInfo.name || 'Guest Customer'}
                    </p>
                    {deliveryOption === 'delivery' && (
                      <p className="text-sm text-gray-600">
                        {deliveryInfo.address || '123 Main St'}, {deliveryInfo.city || 'Springfield'}, {deliveryInfo.zip || '12345'}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {timeSlot || 'Tomorrow, 10:00 AM - 12:00 PM'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Payment</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {paymentMethod === 'card'
                        ? 'Credit / Debit Card'
                        : paymentMethod === 'apple'
                        ? 'Apple Pay'
                        : 'Cash on Delivery'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-2">Items ({cart.length})</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center gap-2">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 flex-1 truncate">
                            {item.product.name} x{item.quantity}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="mt-4"><p role="alert" className="text-red-600">{error}</p>{error.includes('Please sign in') && <button className="text-green-700 underline mt-2" onClick={() => navigate({name:'account'})}>Sign in or create an account</button>}</div>}
            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 'delivery' ? 'Back to Cart' : 'Previous'}
              </button>
              <button
                onClick={handleNext}
                disabled={busy}
                className="flex items-center gap-1.5 bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm"
              >
                {busy ? 'Saving order…' : step === 'review' ? 'Place Order' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="md:col-span-1">
          <div className="sticky top-32 bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-gray-900">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-900">${cartSubtotal.toFixed(2)}</span>
              </div>
              {cartSavings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Savings</span>
                  <span className="font-semibold">-${cartSavings.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span className="font-semibold text-gray-900">
                  {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({(settings.tax_rate * 100).toFixed(1)}%)</span>
                <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-green-600 text-lg">${((confirmedOrder?.total_cents ?? Math.round(total * 100)) / 100).toFixed(2)}</span>
              </div>
            </div>
            {deliveryFee > 0 && (
              <p className="text-xs text-green-600 bg-green-50 rounded-lg p-2">
                Add ${(settings.free_delivery_cents / 100 - cartSubtotal).toFixed(2)} more for free delivery!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
