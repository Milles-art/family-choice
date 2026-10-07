import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, MessageCircle, RefreshCw, Smartphone, XCircle } from 'lucide-react';
import type { Order } from '../api';
import { formatTzs } from '../currency';
import { getPaymentStatus, networks, normalizeStatus, normalizeTzPhone, phoneHint, retryPayment, type MobileNetwork, type PaymentStatus } from '../payments';
import { whatsappLink } from '../storeConfig';
import { MobilePaymentFields } from './MobilePaymentFields';

const POLL_MS = 4000;
const WINDOW_S = 180;
const RESEND_S = 30;

type Props = {
  order: Order;
  network?: MobileNetwork | '';
  phone?: string;
  /** true when the server already sent the prompt while creating the order (checkout); false on the "Pay now" button in tracking. */
  alreadySent: boolean;
  onPaid: (order: Order) => void;
  onTrack?: () => void;
};

type Phase = 'compose' | 'waiting' | 'failed' | 'expired';

export function PaymentWaiting({ order, network = '', phone = '', alreadySent, onPaid, onTrack }: Props) {
  const initial = normalizeStatus(order.payment_status);
  const [phase, setPhase] = useState<Phase>(initial === 'failed' || initial === 'cancelled' ? 'failed' : initial === 'expired' ? 'expired' : alreadySent ? 'waiting' : 'compose');
  const [net, setNet] = useState<MobileNetwork | ''>(network);
  const [ph, setPh] = useState(phone);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ network?: string; phone?: string }>({});
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(WINDOW_S);
  const [cooldown, setCooldown] = useState(RESEND_S);
  const [round, setRound] = useState(0);
  const startedAt = useRef(Date.now());
  const paid = useRef(onPaid);
  paid.current = onPaid;

  useEffect(() => {
    if (phase !== 'waiting') return;
    let stopped = false;
    const check = async () => {
      try {
        const result = await getPaymentStatus(order.id);
        if (stopped) return;
        if (result.payment_status === 'paid') { stopped = true; paid.current({ ...order, payment_status: 'paid' }); }
        else if (result.payment_status !== 'pending') { stopped = true; setMessage(result.message ?? ''); setPhase(result.payment_status === 'expired' ? 'expired' : 'failed'); }
      } catch { /* network blip: keep trying until the timer ends */ }
    };
    const poll = window.setInterval(() => void check(), POLL_MS);
    const clock = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      setLeft(Math.max(0, WINDOW_S - elapsed));
      setCooldown(Math.max(0, RESEND_S - elapsed));
      if (elapsed >= WINDOW_S) { stopped = true; setPhase('expired'); }
    }, 1000);
    void check();
    return () => { stopped = true; window.clearInterval(poll); window.clearInterval(clock); };
  }, [phase, order.id, round]); // eslint-disable-line react-hooks/exhaustive-deps

  async function send() {
    const errors: { network?: string; phone?: string } = {};
    const normalized = normalizeTzPhone(ph);
    if (!net) errors.network = 'Choose your mobile-money network.';
    if (!normalized) errors.phone = `Enter a valid number. ${phoneHint}`;
    setFieldErrors(errors); setError('');
    if (errors.network || errors.phone || !net || !normalized) return;
    setBusy(true);
    try {
      const result = await retryPayment(order.id, { network: net, phone: normalized });
      if (result.payment_url) { window.location.assign(result.payment_url); return; }
      startedAt.current = Date.now(); setLeft(WINDOW_S); setCooldown(RESEND_S); setMessage(''); setPhase('waiting'); setRound(value => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not send the payment request. Please try again.'); }
    finally { setBusy(false); }
  }

  const label = networks.find(item => item.id === net)?.label;
  const mm = String(Math.floor(left / 60)).padStart(1, '0');
  const ss = String(left % 60).padStart(2, '0');
  const help = <a className="fc-pay-help" href={whatsappLink(`Hello, I need help paying for order ${order.number}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true"/>Need help? Chat on WhatsApp</a>;

  return <section className="fc-pay-panel" aria-live="polite" aria-labelledby="pay-title">
    {phase === 'compose' && <>
      <Smartphone size={34} aria-hidden="true"/>
      <h2 id="pay-title">Pay {formatTzs(order.total_cents / 100)} with mobile money</h2>
      <p>Order {order.number}. Choose your network and we will send a payment request to your phone.</p>
      <MobilePaymentFields idPrefix="retry" network={net} phone={ph} onNetwork={setNet} onPhone={setPh} networkError={fieldErrors.network} phoneError={fieldErrors.phone}/>
      {error && <p role="alert" className="text-red-700 mt-3">{error}</p>}
      <button className="button-primary mt-4" disabled={busy} onClick={() => void send()}>{busy ? <><Loader2 className="fc-spin" size={18}/>Sending…</> : 'Send payment request'}</button>
    </>}

    {phase === 'waiting' && <>
      <div className="fc-pulse" aria-hidden="true"><Smartphone size={34}/></div>
      <h2 id="pay-title">Check your phone</h2>
      <p>We sent a payment request{label ? <> to your <strong>{label}</strong> account</> : ''}{ph ? <> on <strong>{ph}</strong></> : ''}. Enter your PIN to approve <strong>{formatTzs(order.total_cents / 100)}</strong>.</p>
      <p className="fc-pay-timer" role="timer"><Loader2 className="fc-spin" size={16} aria-hidden="true"/>Waiting for confirmation · {mm}:{ss}</p>
      <ol className="fc-pay-steps"><li>Look for the payment pop-up or SMS on your phone.</li><li>Enter your mobile-money PIN.</li><li>Wait here. This page updates by itself.</li></ol>
      {order.payment_url && <a className="button-secondary" href={order.payment_url}><ExternalLink size={16} aria-hidden="true"/>Open the payment page instead</a>}
      <div className="fc-pay-actions">
        <button className="fc-link-button" disabled={cooldown > 0 || busy} onClick={() => void send()}><RefreshCw size={15} aria-hidden="true"/>{cooldown > 0 ? `Resend request in ${cooldown}s` : 'Resend payment request'}</button>
        <button className="fc-link-button" onClick={() => setPhase('compose')}>Use a different number</button>
        {onTrack && <button className="fc-link-button" onClick={onTrack}>I will pay later</button>}
      </div>
      {error && <p role="alert" className="text-red-700 mt-3">{error}</p>}
      {help}
    </>}

    {(phase === 'failed' || phase === 'expired') && <>
      <XCircle size={40} className="text-red-700" aria-hidden="true"/>
      <h2 id="pay-title">{phase === 'expired' ? 'We did not receive your payment yet' : 'Payment was not completed'}</h2>
      <p>{message || (phase === 'expired' ? 'The request may have timed out, or the payment may still be processing. If money left your account, do not pay again. Contact us with your order number.' : 'The payment was declined or cancelled. Your order is saved, so you can try again.')}</p>
      <div className="fc-pay-actions">
        <button className="button-primary" onClick={() => { setPhase('compose'); setError(''); }}>Try again</button>
        <button className="button-secondary" onClick={() => { setPhase('waiting'); startedAt.current = Date.now(); setLeft(WINDOW_S); setRound(value => value + 1); }}>Check payment status</button>
        {onTrack && <button className="fc-link-button" onClick={onTrack}>View my order</button>}
      </div>
      {help}
    </>}
  </section>;
}

export function PaidBadge({ status }: { status: PaymentStatus }) {
  return status === 'paid' ? <span className="fc-badge-paid"><CheckCircle2 size={14} aria-hidden="true"/>Paid</span> : null;
}
