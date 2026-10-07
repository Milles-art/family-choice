import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, ClipboardCheck, MessageCircle, Package, RefreshCw, ShoppingBag, Truck } from 'lucide-react';
import { ApiError, type Order } from '../api';
import { useStore } from '../store';
import { formatTzs } from '../currency';
import { listOrders, normalizeStatus } from '../payments';
import { whatsappLink } from '../storeConfig';
import { PaymentWaiting } from './PaymentWaiting';
import { SectionSkeleton } from './LoadingState';

export function TrackOrderPage() {
  const { page, navigate } = useStore();
  const wanted = page.name === 'track' ? page.orderId : undefined;
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    try { setOrders(await listOrders()); setError(''); setSignedOut(false); }
    catch (e) { if (e instanceof ApiError && e.status === 401) setSignedOut(true); else setError(e instanceof Error ? e.message : 'Could not load your order.'); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 15000); return () => window.clearInterval(timer); }, [load]);

  const order = orders ? [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).find(o => !wanted || o.id === wanted) : undefined;
  const crumb = <nav className="fc-breadcrumb" aria-label="Breadcrumb"><button onClick={() => navigate({ name: 'home' })}>Home</button><ChevronRight size={14} aria-hidden="true"/><span aria-current="page">Track order</span></nav>;

  if (signedOut) return <div className="store-container fc-track">{crumb}<div className="surface p-6"><h1>Track your order</h1><p className="my-3">Please sign in to see your order status.</p><button className="button-primary" onClick={() => navigate({ name: 'account' })}>Sign in</button></div></div>;
  if (!orders && !error) return <div className="store-container fc-track">{crumb}<SectionSkeleton cards={2} label="Loading your order"/></div>;
  if (error && !orders) return <div className="store-container fc-track">{crumb}<div className="surface p-6"><p role="alert">{error}</p><button className="button-primary mt-3" onClick={() => void load()}>Try again</button></div></div>;
  if (!order) return <div className="store-container fc-track">{crumb}<div className="surface p-6"><h1>{wanted ? 'Order not found' : 'No orders yet'}</h1><p className="my-3">{wanted ? 'This order is not available in your account. Check the order link or sign in to the account used at checkout.' : 'Your orders will appear here after checkout.'}</p><button className="button-primary" onClick={() => navigate({ name: 'catalog' })}>Browse groceries</button></div></div>;

  const pickup = order.delivery_option === 'pickup';
  const steps = [
    { key: 'pending', label: 'Order received', icon: ClipboardCheck },
    { key: 'processing', label: 'Being packed', icon: Package },
    { key: 'out_for_delivery', label: pickup ? 'Ready for pickup' : 'On the way', icon: pickup ? ShoppingBag : Truck },
    { key: 'delivered', label: pickup ? 'Collected' : 'Delivered', icon: CheckCircle2 },
  ];
  const current = steps.findIndex(step => step.key === order.status);
  const payStatus = normalizeStatus(order.payment_status);
  const owesOnline = order.payment_method === 'selcom' && payStatus !== 'paid';

  return <div className="store-container fc-track">
    {crumb}
    {order.number.startsWith('FC-DEMO-') && <p role="status">Demo order only — not submitted to the store and no money charged.</p>}
    {error && <p role="alert">{error} <button className="fc-link-button" onClick={() => void load()}>Try again</button></p>}
    <div className="fc-track-head"><div><h1>Order {order.number}</h1><p>Placed {new Date(order.created_at).toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' })} · {formatTzs(order.total_cents / 100)}</p></div><button className="fc-link-button" onClick={() => void load()}><RefreshCw size={15} aria-hidden="true"/>Refresh</button></div>

    <ol className="fc-timeline" aria-label="Order progress">{steps.map((step, i) => <li key={step.key} className={i < current ? 'is-done' : i === current ? 'is-current' : ''} aria-current={i === current ? 'step' : undefined}><span className="fc-timeline-dot">{i < current ? <CheckCircle2 size={20} aria-hidden="true"/> : <step.icon size={20} aria-hidden="true"/>}</span><span className="fc-timeline-label">{step.label}</span></li>)}</ol>
    {current < 0 && <p className="fc-track-note">Status: {order.status.replace(/_/g, ' ')}</p>}

    {owesOnline && !paying && <div className="fc-pay-banner" role="status"><div><strong>{payStatus === 'pending' ? 'Payment not completed yet' : 'Payment was not completed'}</strong><p>Your order is saved. Complete the mobile-money payment to confirm it.</p></div><button className="button-primary" onClick={() => setPaying(true)}>Pay now</button></div>}
    {owesOnline && paying && <PaymentWaiting order={order} alreadySent={false} onPaid={() => { setPaying(false); void load(); }}/>}
    {order.payment_method === 'selcom' && payStatus === 'paid' && <p className="fc-track-paid"><CheckCircle2 size={18} aria-hidden="true"/>Payment received. Thank you!</p>}
    {order.payment_method !== 'selcom' && <p className="fc-track-note">{order.payment_method === 'mobile_money' ? `Mobile money payment: ${payStatus === 'paid' ? 'confirmed by the store.' : 'awaiting confirmation by the store.'}` : `Payment: cash on ${pickup ? 'pickup' : 'delivery'}${payStatus === 'paid' ? ' (received)' : ''}.`}</p>}

    <div className="fc-track-grid">
      <section className="surface p-5"><h2>Items</h2>{order.items.length ? order.items.map(item => <p key={item.id} className="fc-track-row"><span>{item.name} × {item.quantity}</span><strong>{formatTzs(item.price_cents * item.quantity / 100)}</strong></p>) : <p className="fc-track-note">Item details are in your order confirmation.</p>}<p className="fc-track-row fc-track-total"><span>Total</span><strong>{formatTzs(order.total_cents / 100)}</strong></p></section>
      <section className="surface p-5"><h2>{pickup ? 'Pickup' : 'Delivery'}</h2><p>{order.time_slot}</p>{order.delivery && !pickup && <p className="fc-track-note">{[order.delivery.name, order.delivery.address, order.delivery.city].filter(Boolean).join(', ')}</p>}<a className="fc-pay-help" href={whatsappLink(`Hello, I have a question about order ${order.number}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true"/>Ask about this order on WhatsApp</a></section>
    </div>
  </div>;
}
