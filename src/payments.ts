import { api, settings, type Order } from './api';

/**
 * Client side of the Selcom mobile-money flow.
 * The server owns everything sensitive (keys, signing, webhook). This file only
 * talks to YOUR Laravel API. See docs/SELCOM-FRONTEND-CONTRACT.md.
 *
 * Demo mode: add VITE_MOCK_PAYMENTS=true to .env.local and run `npm run dev`.
 * It fakes the server so the whole screen flow can be tried without Selcom.
 * It is ignored in production builds. Demo numbers ending 0000 simulate a failed payment.
 */
export const MOCK = import.meta.env.DEV && import.meta.env.VITE_MOCK_PAYMENTS === 'true';

/** The Selcom option appears only when the server says it is switched on (settings.selcom_enabled). */
export const selcomAvailable = () => MOCK || settings.selcom_enabled === true;

export type MobileNetwork = 'mpesa' | 'tigopesa' | 'airtelmoney' | 'halopesa';
export const networks: { id: MobileNetwork; label: string; color: string }[] = [
  { id: 'mpesa', label: 'M-Pesa', color: '#e60000' },
  { id: 'tigopesa', label: 'Mixx by Yas (Tigo Pesa)', color: '#0b5ed7' },
  { id: 'airtelmoney', label: 'Airtel Money', color: '#d4002a' },
  { id: 'halopesa', label: 'HaloPesa', color: '#f58220' },
];

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired';

export function normalizeStatus(value: string | undefined): PaymentStatus {
  const v = (value ?? '').toLowerCase();
  if (v === 'paid' || v === 'completed') return 'paid';
  if (v === 'failed' || v === 'declined') return 'failed';
  if (v === 'cancelled' || v === 'canceled') return 'cancelled';
  if (v === 'expired') return 'expired';
  return 'pending';
}

/** Returns 255XXXXXXXXX, or null when the number is not a valid Tanzanian mobile number. */
export function normalizeTzPhone(input: string): string | null {
  let digits = input.replace(/[\s()+-]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('255')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return /^[67]\d{8}$/.test(digits) ? `255${digits}` : null;
}

export const phoneHint = 'Use a mobile number like 0712 345 678.';

/* ------------------------------ demo (mock) server ------------------------------ */
type MockEntry = { order: Order; started: number; phone: string };
const mockStore = new Map<number, MockEntry>();
const MOCK_DELAY_MS = 7000;

export async function placeOrder(payload: Record<string, unknown>, mockTotalCents: number): Promise<Order> {
  if (!MOCK) return api<Order>('/orders', 'POST', payload);
  const id = Date.now();
  const order: Order = { id, number: `FC-DEMO-${String(id).slice(-5)}`, status: 'pending', payment_status: 'pending', payment_method: 'selcom', total_cents: mockTotalCents, time_slot: String(payload.timeSlot ?? ''), created_at: new Date().toISOString(), delivery_option: String(payload.deliveryOption ?? 'delivery'), delivery: payload.delivery as Order['delivery'], items: [] };
  mockStore.set(id, { order, started: Date.now(), phone: String(payload.payerPhone ?? '') });
  await new Promise(r => setTimeout(r, 600));
  return order;
}

export async function getPaymentStatus(orderId: number): Promise<{ payment_status: PaymentStatus; message?: string }> {
  if (MOCK) {
    const entry = mockStore.get(orderId);
    if (!entry) return { payment_status: 'pending' };
    if (Date.now() - entry.started < MOCK_DELAY_MS) return { payment_status: 'pending' };
    if (entry.phone.endsWith('0000')) { entry.order.payment_status = 'failed'; return { payment_status: 'failed', message: 'The payment was declined or cancelled on the phone.' }; }
    entry.order.payment_status = 'paid'; entry.order.status = 'processing';
    return { payment_status: 'paid' };
  }
  const r = await api<{ payment_status: string; message?: string }>(`/orders/${orderId}/payment-status`);
  return { payment_status: normalizeStatus(r.payment_status), message: r.message };
}

/** Asks the server to (re)send the payment prompt. May return a hosted payment page URL instead. */
export async function retryPayment(orderId: number, body: { network: MobileNetwork; phone: string }): Promise<{ payment_url?: string }> {
  if (MOCK) {
    const entry = mockStore.get(orderId);
    if (entry) { entry.started = Date.now(); entry.phone = body.phone; entry.order.payment_status = 'pending'; }
    await new Promise(r => setTimeout(r, 400));
    return {};
  }
  return api<{ payment_url?: string }>(`/orders/${orderId}/payment/retry`, 'POST', body);
}

export async function listOrders(): Promise<Order[]> {
  if (MOCK && mockStore.size) return Array.from(mockStore.values()).map(e => e.order);
  return api<Order[]>('/orders');
}
