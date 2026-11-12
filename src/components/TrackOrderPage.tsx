import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, ChevronRight, ClipboardCheck, Home, MessageCircle, Package, RefreshCw, ShoppingBag, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { api, ApiError, type Order } from '../api';
import { useStore } from '../store';
import { formatTzs } from '../currency';
import { listOrders, normalizeStatus } from '../payments';
import { whatsappLink } from '../storeConfig';
import { PaymentWaiting } from './PaymentWaiting';
import { SectionSkeleton } from './LoadingState';

/** Reference hero shell — shared by every track state (loading, signed out, order). */
function TrackHero() {
  const { navigate } = useStore();
  return (
    <section className="relative overflow-hidden bg-[#CFF3E4]" aria-labelledby="track-title">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
      <div className="relative store-container pt-4 pb-12 sm:pb-16">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
          <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-1 hover:text-primary"><Home className="w-3.5 h-3.5" /> Home</button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-medium text-[#4A2618]">Track order</span>
        </nav>
        <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Track · Live order status</p>
        <h1 id="track-title" className="mt-4 font-display text-[15vw] leading-[0.82] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[10vw] lg:text-[7.5vw]">
          {['Follow your', 'order.'].map((line, i) => (
            <motion.span key={line} initial={{ y: '25%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }} className={i === 1 ? 'block text-primary' : 'block'}>{line}</motion.span>
          ))}
        </h1>
        <p className="mt-8 max-w-2xl text-[#4A2618]/75 sm:text-lg">
          See where your groceries are, when they'll arrive and how to pay — updated as the store works on your order.
        </p>
      </div>
    </section>
  );
}

/** Every non-hero body shares one container. */
function TrackBody({ children }: { children: ReactNode }) {
  return <div className="store-container fc-track">{children}</div>;
}

export function TrackOrderPage() {
  const { page, navigate } = useStore();
  const wanted = page.name === 'track' ? page.orderId : undefined;
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try { setOrders(await listOrders()); setError(''); setSignedOut(false); }
    catch (e) { if (e instanceof ApiError && e.status === 401) setSignedOut(true); else setError(e instanceof Error ? e.message : 'Could not load your order.'); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 15000); return () => window.clearInterval(timer); }, [load]);

  const order = orders ? [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at)).find(o => !wanted || o.id === wanted) : undefined;

  if (signedOut) return <div className="fc-ref"><TrackHero /><TrackBody><div className="surface p-6"><p className="my-3">Please sign in to see your order status.</p><button className="button-primary" onClick={() => navigate({ name: 'account' })}>Sign in</button></div></TrackBody></div>;
  if (!orders && !error) return <div className="fc-ref"><TrackHero /><TrackBody><SectionSkeleton cards={2} label="Loading your order" /></TrackBody></div>;
  if (error && !orders) return <div className="fc-ref"><TrackHero /><TrackBody><div className="surface p-6"><p role="alert">{error}</p><button className="button-primary mt-3" onClick={() => void load()}>Try again</button></div></TrackBody></div>;
  if (!order) return <div className="fc-ref"><TrackHero /><TrackBody><div className="surface p-6"><h2 className="font-display text-2xl font-extrabold tracking-tighter text-[#4A2618] uppercase">{wanted ? 'Order not found' : 'No orders yet'}</h2><p className="my-3">{wanted ? 'This order is not available in your account. Check the order link or sign in to the account used at checkout.' : 'Your orders will appear here after checkout.'}</p><button className="button-primary" onClick={() => navigate({ name: 'catalog' })}>Browse groceries</button></div></TrackBody></div>;

  const pickup = order.delivery_option === 'pickup';
  const steps = [
    { key: 'pending', label: 'Order received', icon: ClipboardCheck },
    { key: 'processing', label: 'Being packed', icon: Package },
    { key: 'out_for_delivery', label: pickup ? 'Ready for pickup' : 'On the way', icon: pickup ? ShoppingBag : Truck },
    { key: 'delivered', label: pickup ? 'Collected' : 'Delivered', icon: CheckCircle2 },
  ];
  const current = steps.findIndex(step => step.key === order.status);
  const payStatus = normalizeStatus(order.payment_status);
  const cancelled = order.status === 'cancelled';
  const owesOnline = !cancelled && order.payment_method === 'selcom' && payStatus !== 'paid';
  const cancel = async () => {
    if (!window.confirm('Cancel this order? Its reserved stock will be released.')) return;
    setCancelling(true);
    try { await api(`/orders/${order.id}/cancel`, 'POST'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not cancel the order.'); }
    finally { setCancelling(false); }
  };

  return <div className="fc-ref">
    <TrackHero />
    <TrackBody>
      {order.number.startsWith('FC-DEMO-') && <p role="status">Demo order only — not submitted to the store and no money charged.</p>}
      {error && <p role="alert">{error} <button className="fc-link-button" onClick={() => void load()}>Try again</button></p>}
      <div className="fc-track-head">
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Order status</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-4xl">{order.number}</h2>
          <p>Placed {new Date(order.created_at).toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' })} · {formatTzs(order.total_cents / 100)}</p>
        </div>
        <button className="fc-link-button" onClick={() => void load()}><RefreshCw size={15} aria-hidden="true" />Refresh</button>
      </div>

      {!cancelled && <ol className="fc-timeline" aria-label="Order progress">{steps.map((step, i) => <li key={step.key} className={i < current ? 'is-done' : i === current ? 'is-current' : ''} aria-current={i === current ? 'step' : undefined}><span className="fc-timeline-dot">{i < current ? <CheckCircle2 size={20} aria-hidden="true" /> : <step.icon size={20} aria-hidden="true" />}</span><span className="fc-timeline-label">{step.label}</span></li>)}</ol>}
      {cancelled && <p className="fc-track-note" role="status">Cancelled{payStatus === 'paid' ? ' · Paid after cancellation: staff review/refund needed.' : ' · Reserved stock has been released.'}</p>}
      {order.status === 'pending' && payStatus !== 'paid' && <button className="button-secondary" disabled={cancelling} onClick={() => void cancel()}>{cancelling ? 'Cancelling…' : 'Cancel order'}</button>}
      {current < 0 && <p className="fc-track-note">Status: {order.status.replace(/_/g, ' ')}</p>}

      {owesOnline && !paying && <div className="fc-pay-banner" role="status"><div><strong>{payStatus === 'pending' ? 'Payment not completed yet' : 'Payment was not completed'}</strong><p>Your order is saved. Complete the mobile-money payment to confirm it.</p></div><button className="button-primary" onClick={() => setPaying(true)}>Pay now</button></div>}
      {owesOnline && paying && <PaymentWaiting order={order} alreadySent={false} onPaid={() => { setPaying(false); void load(); }} />}
      {order.payment_method === 'selcom' && payStatus === 'paid' && <p className="fc-track-paid"><CheckCircle2 size={18} aria-hidden="true" />Payment received. Thank you!</p>}
      {order.payment_method !== 'selcom' && <p className="fc-track-note">{order.payment_method === 'mobile_money' ? `Mobile money payment: ${payStatus === 'paid' ? 'confirmed by the store.' : 'awaiting confirmation by the store.'}` : `Payment: cash on ${pickup ? 'pickup' : 'delivery'}${payStatus === 'paid' ? ' (received)' : ''}.`}</p>}

      <div className="fc-track-grid">
        <section className="surface p-5"><h3 className="font-display text-lg font-bold text-[#4A2618]">Items</h3>{order.items.length ? order.items.map(item => <p key={item.id} className="fc-track-row"><span>{item.name} × {item.quantity}</span><strong>{formatTzs(item.price_cents * item.quantity / 100)}</strong></p>) : <p className="fc-track-note">Item details are in your order confirmation.</p>}<p className="fc-track-row fc-track-total"><span>Total</span><strong>{formatTzs(order.total_cents / 100)}</strong></p></section>
        <section className="surface p-5"><h3 className="font-display text-lg font-bold text-[#4A2618]">{pickup ? 'Pickup' : 'Delivery'}</h3><p>{order.time_slot}</p>{order.delivery && !pickup && <p className="fc-track-note">{[order.delivery.name, order.delivery.address, order.delivery.city].filter(Boolean).join(', ')}</p>}<a className="fc-pay-help" href={whatsappLink(`Hello, I have a question about order ${order.number}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" />Ask about this order on WhatsApp</a></section>
      </div>
    </TrackBody>
  </div>;
}
