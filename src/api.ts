import type { Product } from './types';
export type Customer = { id: number; name: string; email: string; is_admin?: boolean };
export type Order = { id: number; number: string; status: string; payment_status: string; payment_method?: string; payment_details?: {provider?:string;reference?:string}; payment_url?: string; payment_message?: string; confirmation_email_sent?: boolean; confirmation_email?: string; total_cents: number; time_slot: string; created_at: string; delivery?: {name:string;phone:string;address?:string;city?:string;instructions?:string}; delivery_option?:string; items: { id: number; name: string; quantity: number; price_cents: number }[] };
let csrf = '';
export class ApiError extends Error {
 constructor(message: string, public errors: Record<string,string[]> = {}, public status = 0) { super(message); this.name = 'ApiError'; }
}
export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
 if (method !== 'GET' && !csrf) { const r=await fetch('/api/csrf',{credentials:'include',headers:{Accept:'application/json'}}); if(!r.ok) throw new Error('Cannot connect to the server.'); csrf=(await r.json()).token; }
 const r=await fetch('/api'+path,{method,credentials:'include',headers:{Accept:'application/json','Content-Type':'application/json',...(method !== 'GET' ? {'X-CSRF-TOKEN':csrf} : {})},body:body === undefined ? undefined : JSON.stringify(body)});
 if (!r.ok) { if(r.status===419) csrf=''; const d=await r.json().catch(()=>({message:'Cannot connect to the server.'})); if(r.status===401) throw new ApiError('Please sign in from My Account before checking out.', {}, r.status); throw new ApiError(Object.values(d.errors || {}).flat().join(' ') || d.message || 'Request failed.', d.errors ?? {}, r.status); }
 if(['/logout','/login','/register'].includes(path)) csrf='';
 return r.status===204 ? undefined as T : r.json();
}
export const loadProducts = () => api<Product[]>('/products');

export const settings = {currency:'TZS', tax_rate:0.18, delivery_cents:500000, free_delivery_cents:7500000, mobile_money_enabled:false, selcom_enabled:false, mobile_money_instructions:''};
