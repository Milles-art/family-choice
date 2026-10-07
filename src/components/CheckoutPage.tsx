import { useStore } from '../store';
import { useEffect, useState } from 'react';
import { api, ApiError, settings, type Order } from '../api';
import { FormField } from './FormField';
import { formatTzs } from '../currency';
import { LottieAnimation } from './LottieAnimation';
import { MobilePaymentFields } from './MobilePaymentFields';
import { PaymentWaiting } from './PaymentWaiting';
import { MOCK, networks, normalizeTzPhone, phoneHint, placeOrder, selcomAvailable, type MobileNetwork } from '../payments';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Clock,
  CreditCard,
  Truck,
  ShoppingBag,
  Smartphone,
} from 'lucide-react';

type Step = 'delivery' | 'schedule' | 'payment' | 'review' | 'paying' | 'confirmation';

export function CheckoutPage() {
  const { cart, cartSubtotal, cartSavings, clearCart, navigate, showToast, setCartOpen, settingsReady, settingsError, retrySettings, catalogReady, checkoutDraft, setCheckoutDraft } = useStore();
  const [step, setStep] = useState<Step>('delivery');
  const [deliveryInfo, setDeliveryInfo] = useState(checkoutDraft?.deliveryInfo ?? {
    name: '',
    address: '',
    city: '',
    zip: '',
    phone: '',
    instructions: '',
  });
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'pickup'>(checkoutDraft?.deliveryOption ?? 'delivery');
  const [timeSlot, setTimeSlot] = useState(checkoutDraft?.timeSlot ?? '');
  const [paymentMethod, setPaymentMethod] = useState(checkoutDraft?.paymentMethod ?? 'cash');
  const [paymentProvider, setPaymentProvider] = useState(checkoutDraft?.paymentProvider ?? '');
  const [paymentReference, setPaymentReference] = useState(checkoutDraft?.paymentReference ?? '');
  const [payerPhone, setPayerPhone] = useState(checkoutDraft?.payerPhone ?? '');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [requestId] = useState(() => checkoutDraft?.requestId ?? crypto.randomUUID());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({});
  useEffect(() => {
    setCheckoutDraft(step === 'confirmation' || step === 'paying' ? null : {deliveryInfo,deliveryOption,timeSlot,paymentMethod,paymentProvider,paymentReference,payerPhone,requestId});
  },[deliveryInfo,deliveryOption,timeSlot,paymentMethod,paymentProvider,paymentReference,payerPhone,requestId,step,setCheckoutDraft]);

  useEffect(() => { document.getElementById('checkout-step')?.focus({preventScroll:true}); }, [step]);

  if (cart.length === 0 && step !== 'confirmation' && step !== 'paying') {
    return (
      <div className="store-container py-16 text-center">
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

  const network = (networks.some(item => item.id === paymentProvider) ? paymentProvider : '') as MobileNetwork | '';
  const subtotalCents = Math.round(cartSubtotal * 100);
  const deliveryFee = deliveryOption === 'pickup' || subtotalCents >= settings.free_delivery_cents ? 0 : settings.delivery_cents / 100;
  const tax = Math.round(cartSubtotal * 100 * settings.tax_rate) / 100;
  const total = cartSubtotal + deliveryFee + tax;
  const normalTotalCents = Math.round(total * 100);

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
    setFieldErrors({});
    if (step === 'delivery') {
      const errors: Record<string,string> = {};
      if (!deliveryInfo.name.trim()) errors.name = 'Enter your full name.';
      if (!deliveryInfo.phone.trim()) errors.phone = 'Enter your phone number.';
      else if (!/^[+\d\s()-]{7,25}$/.test(deliveryInfo.phone)) errors.phone = 'Enter a valid phone number.';
      if (deliveryOption === 'delivery') { if (!deliveryInfo.address.trim()) errors.address = 'Enter your delivery address.'; if (!deliveryInfo.city.trim()) errors.city = 'Enter your region or city.'; }
      if (Object.keys(errors).length) { setFieldErrors(errors); setError('Please check the highlighted fields.'); requestAnimationFrame(() => document.getElementById(`delivery-${Object.keys(errors)[0]}`)?.focus()); return; }
      setStep('schedule');
    } else if (step === 'schedule') {
      if (!timeSlot) { setError('Choose a delivery or pickup time.'); return; }
      setStep('payment');
    } else if (step === 'payment') {
      if (paymentMethod === 'mobile_money' && (!paymentProvider.trim() || !paymentReference.trim())) { setFieldErrors({paymentProvider:!paymentProvider.trim()?'Enter the payment provider.':'',paymentReference:!paymentReference.trim()?'Enter the transaction reference.':''}); setError('Check your payment details.'); return; }
      if (paymentMethod === 'selcom') {
        const errors: Record<string,string> = {};
        if (!network) errors.paymentNetwork = 'Choose your mobile-money network.';
        if (!normalizeTzPhone(payerPhone)) errors.payerPhone = `Enter a valid number. ${phoneHint}`;
        if (Object.keys(errors).length) { setFieldErrors(errors); setError('Check your payment details.'); return; }
      }
      setStep('review');
    }
    else if (step === 'review' && !busy) {
      setBusy(true);
      try {
        const selcom = paymentMethod === 'selcom';
        const payload = {requestId,items:cart.map(i=>({productId:i.product.id,quantity:i.quantity})),delivery:deliveryInfo,deliveryOption,timeSlot,paymentMethod,paymentProvider:selcom?network:paymentProvider,paymentReference:selcom?'':paymentReference,...(selcom?{payerPhone:normalizeTzPhone(payerPhone)}:{})};
        const order = selcom ? await placeOrder(payload, normalTotalCents) : await api<Order>('/orders','POST',payload);
        setConfirmedOrder(order); clearCart();
        if (selcom) { setStep('paying'); showToast(MOCK ? 'Demo order created. No money will be charged.' : 'Order saved. Check your phone and payment status.'); }
        else { setStep('confirmation'); showToast(paymentMethod === 'mobile_money' ? 'Order received! Your mobile-money payment is awaiting confirmation.' : 'Order received! Payment is due on delivery or pickup.'); }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to place order.');
        if (e instanceof ApiError) {
          const errors = Object.fromEntries(Object.entries(e.errors).map(([key,value]) => [key.replace('delivery.',''),value.join(' ')]));
          setFieldErrors(errors);
          if (Object.keys(e.errors).some(key=>key.startsWith('delivery.'))) setStep('delivery');
        }
      }
      finally { setBusy(false); }
    }
  };

  const handleBack = () => {
    if (step === 'schedule') setStep('delivery');
    else if (step === 'payment') setStep('schedule');
    else if (step === 'review') setStep('payment');
    else setCartOpen(true);
  };

  if (step === 'paying' && confirmedOrder) {
    return <div className="max-w-2xl mx-auto px-4 py-10"><PaymentWaiting order={confirmedOrder} network={network} phone={payerPhone} alreadySent onPaid={order => { setConfirmedOrder(order); setStep('confirmation'); showToast(MOCK ? 'Demo payment completed. No money charged.' : 'Payment received. Thank you!'); }} onTrack={() => navigate({ name: 'track', orderId: confirmedOrder.id })}/></div>;
  }

  if (step === 'confirmation') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center">
          <LottieAnimation animation="orderConfirmed" label="Order confirmed" loop={false} className="w-28 h-28 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{confirmedOrder?.number.startsWith('FC-DEMO-') ? 'Demo completed' : 'Order Confirmed!'}</h1>
          {confirmedOrder?.number.startsWith('FC-DEMO-') && <p role="status">Demo only — no money charged and no order submitted to the store.</p>}
          <p className="text-gray-500 mb-6">
            Your order has been saved. {paymentMethod === 'selcom' ? 'Your mobile-money payment was received.' : paymentMethod === 'mobile_money' ? 'Your mobile-money payment is awaiting confirmation.' : 'Payment is due on delivery or pickup.'}
          </p>
          <p className="fc-confirm-email">{confirmedOrder?.confirmation_email_sent ? `A confirmation email has been sent${confirmedOrder.confirmation_email ? ` to ${confirmedOrder.confirmation_email}` : ''}.` : `Keep your order number (${confirmedOrder?.number}). You can follow this order any time from My Account.`}</p>

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
              <span className="text-sm text-gray-500">{paymentMethod === 'selcom' ? 'Total Paid' : 'Total Due'}</span>
              <span className="font-bold text-green-600">{formatTzs((confirmedOrder?.total_cents ?? Math.round(total * 100)) / 100)}</span>
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
              onClick={() => navigate({ name: 'track', orderId: confirmedOrder?.id })}
              className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Track My Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-container fc-checkout py-6">
      <button
        onClick={() => navigate({ name: 'home' })}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="fc-checkout-heading"><h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1><p>A few details, then your next shop is sorted.</p></div>
      {!settingsReady && <div className="surface p-4 mb-5" role="status">{settingsError || 'Loading delivery fees and tax settings…'}{settingsError && <button className="underline ml-3" onClick={retrySettings}>Retry settings</button>}</div>}
      <p id="checkout-step" tabIndex={-1} className="text-sm text-green-800 font-semibold mb-4">Step {currentStepIndex + 1} of 4 · {steps[currentStepIndex]?.label}</p>

      {/* Step indicator */}
      <div className="fc-checkout-steps flex items-center mb-8 overflow-x-auto">
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

      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        {/* Form area */}
        <div className="min-w-0">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            {step === 'delivery' && (
              <div className="space-y-4">
                <h2 className="font-bold text-gray-900 text-lg mb-1">Delivery Information</h2>

                {/* Delivery or pickup */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    aria-pressed={deliveryOption==='delivery'} onClick={() => setDeliveryOption('delivery')}
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
                    aria-pressed={deliveryOption==='pickup'} onClick={() => setDeliveryOption('pickup')}
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

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField id="delivery-name" label="Full name" autoComplete="name" required value={deliveryInfo.name} error={fieldErrors.name} onChange={e => setDeliveryInfo({...deliveryInfo,name:e.target.value})}/>
                  <FormField id="delivery-phone" label="Phone number" type="tel" autoComplete="tel" required value={deliveryInfo.phone} error={fieldErrors.phone} onChange={e => setDeliveryInfo({...deliveryInfo,phone:e.target.value})}/>
                </div>
                {deliveryOption === 'delivery' && <>
                  <FormField id="delivery-address" label="House, street and landmark" autoComplete="street-address" required value={deliveryInfo.address} error={fieldErrors.address} onChange={e => setDeliveryInfo({...deliveryInfo,address:e.target.value})}/>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField id="delivery-city" label="Region / city" autoComplete="address-level2" required value={deliveryInfo.city} error={fieldErrors.city} onChange={e => setDeliveryInfo({...deliveryInfo,city:e.target.value})}/>
                    <FormField id="delivery-zip" label="Ward or postal code (optional)" autoComplete="postal-code" value={deliveryInfo.zip} error={fieldErrors.zip} onChange={e => setDeliveryInfo({...deliveryInfo,zip:e.target.value})}/>
                  </div>
                  <label htmlFor="delivery-instructions" className="block text-sm font-semibold">Delivery instructions (optional)</label>
                  <textarea id="delivery-instructions" value={deliveryInfo.instructions} onChange={e => setDeliveryInfo({...deliveryInfo,instructions:e.target.value})} rows={3} className="w-full px-4 py-3 border rounded-xl"/>
                </>}
                {deliveryOption === 'pickup' && (
                  <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">FAMILY CHOICE SUPERMARKET Dar es Salaam</p>
                      <p className="text-sm text-gray-500">Dar es Salaam, Tanzania</p>
                      <p className="text-xs text-gray-400 mt-1">Pickup arrangements are confirmed by the store.</p>
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
                      aria-pressed={timeSlot===slot} onClick={() => setTimeSlot(slot)}
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
                    { id: 'cash', label: 'Cash on Delivery / Pickup', icon: ShoppingBag },
                    ...(selcomAvailable() ? [{ id: 'selcom', label: 'Pay now with mobile money', icon: Smartphone }] : []),
                    ...(settings.mobile_money_enabled ? [{ id: 'mobile_money', label: 'Mobile Money', icon: CreditCard }] : []),
                  ].map((method) => (
                    <button
                      key={method.id}
                      aria-pressed={paymentMethod===method.id} onClick={() => { setPaymentMethod(method.id); if (method.id === 'selcom' && !payerPhone) setPayerPhone(deliveryInfo.phone); }}
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
                {paymentMethod === 'selcom' && (
                  <div className="rounded-xl bg-green-50 p-4"><MobilePaymentFields network={network} phone={payerPhone} onNetwork={id => setPaymentProvider(id)} onPhone={setPayerPhone} networkError={fieldErrors.paymentNetwork} phoneError={fieldErrors.payerPhone}/></div>
                )}
                {paymentMethod === 'mobile_money' && (
                  <div className="space-y-3 rounded-xl bg-green-50 p-4">
                    <p className="text-sm text-gray-700">{settings.mobile_money_instructions || 'Use your store’s approved mobile-money paybill, then enter the transaction reference below. Payment is confirmed by the store team.'}</p>
                    <FormField id="payment-provider" label="Mobile-money provider" value={paymentProvider} onChange={e=>setPaymentProvider(e.target.value)} required error={fieldErrors.paymentProvider}/>
                    <FormField id="payment-reference" label="Transaction reference" value={paymentReference} onChange={e=>setPaymentReference(e.target.value)} required error={fieldErrors.paymentReference}/>
                  </div>
                )}


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
                        {deliveryInfo.address || 'Your delivery address'}, {deliveryInfo.city || 'Dar es Salaam'}, {deliveryInfo.zip || 'Tanzania'}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {timeSlot || 'Tomorrow, 10:00 AM - 12:00 PM'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Payment</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {paymentMethod === 'selcom' ? `Mobile money · ${networks.find(item => item.id === network)?.label ?? ''} · ${payerPhone}` : paymentMethod === 'mobile_money' ? `Mobile Money · ${paymentProvider}` : 'Cash on Delivery / Pickup'}
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
                            className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
                          />
                          <span className="text-sm text-gray-700 flex-1 min-w-0">
                            {item.product.name} x{item.quantity}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatTzs(item.product.price * item.quantity)}
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
                disabled={busy}
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {step === 'delivery' ? 'Back to Cart' : 'Previous'}
              </button>
              <button
                onClick={handleNext}
                disabled={busy || !settingsReady || !catalogReady}
                className="flex items-center gap-1.5 bg-green-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm"
              >
                {busy ? 'Saving order…' : step === 'review' ? (paymentMethod === 'selcom' ? 'Place Order & Pay' : 'Place Order') : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="min-w-0">
          <details open className="lg:sticky lg:top-36 bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <summary className="font-bold text-gray-900 cursor-pointer">Order Summary · {settingsReady ? formatTzs((normalTotalCents) / 100) : "Loading…"}</summary>
            {settingsReady ? <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Groceries</span>
                <span className="font-semibold text-gray-900">{formatTzs(cartSubtotal)}</span>
              </div>
              {cartSavings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Savings</span>
                  <span className="font-semibold">-{formatTzs(cartSavings)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery</span>
                <span className="font-semibold text-gray-900">
                  {deliveryFee === 0 ? 'FREE' : formatTzs(deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({(settings.tax_rate * 100).toFixed(1)}%)</span>
                <span className="font-semibold text-gray-900">{formatTzs(tax)}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-bold text-green-600 text-lg">{formatTzs((confirmedOrder?.total_cents ?? normalTotalCents) / 100)}</span>
              </div>
            </div> : <p className="text-sm text-gray-600">Totals will appear after delivery and tax settings load.</p>}
            {settingsReady && deliveryFee > 0 && (
              <p className="text-xs text-green-600 bg-green-50 rounded-lg p-2">
                Add {formatTzs(settings.free_delivery_cents / 100 - cartSubtotal)} more for free delivery!
              </p>
            )}
          </details>
        </div>
      </div>
    </div>
  );
}
