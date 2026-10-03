import { useEffect, useState, type FormEvent } from 'react';
import { api, loadProducts, type Customer, type Order } from '../api';
import { products } from '../data';
import type { Product } from '../types';
import { useStore } from '../store';
import { formatTzs } from '../currency';
const field='border rounded-xl p-3 w-full';
const btn='bg-green-600 text-white rounded-xl px-4 py-3 disabled:opacity-50';
export function AccountPage(){
 const {navigate}=useStore();
 const [user,setUser]=useState<Customer|null>(null),[loading,setLoading]=useState(true),[register,setRegister]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[admin,setAdmin]=useState(false);
 const [orders,setOrders]=useState<Order[]>([]),[catalog,setCatalog]=useState<Product[]>([]);
 async function refresh(management=false){setOrders(await api<Order[]>(management?'/admin/orders':'/orders'));if(management)setCatalog(await loadProducts());}
 useEffect(()=>{void api<Customer>('/me').then(async u=>{setUser(u);await refresh();}).catch(e=>{if(!e.message.includes('Please sign in'))setError(e.message);}).finally(()=>setLoading(false));},[]);
 async function run(action:()=>Promise<void>){setBusy(true);setError('');try{await action();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);void run(async()=>{const u=await api<Customer>(register?'/register':'/login','POST',{name:f.get('name'),email:f.get('email'),password:f.get('password'),privacyConsent:f.get('privacyConsent')==='on'});setUser(u);await refresh();});}
 if(loading)return <p className="p-10 text-center">Loading your account…</p>;
 return <div className="max-w-5xl mx-auto p-6"><h1 className="text-2xl font-bold mb-6">{user?`Welcome, ${user.name}`:register?'Create your account':'Sign in'}</h1>
 {error&&<p role="alert" className="text-red-600 my-4">{error}</p>}
 {!user?<form onSubmit={submit} className="max-w-md bg-white rounded-2xl p-6 space-y-4">
 {register&&<input className={field} name="name" placeholder="Full name" aria-label="Full name" required maxLength={100} autoComplete="name"/>}
 <input className={field} name="email" type="email" placeholder="Email" aria-label="Email" required autoComplete="email"/>
 <input className={field} name="password" type="password" placeholder="Password (8+ characters)" aria-label="Password" required minLength={8} maxLength={128} autoComplete={register?'new-password':'current-password'}/>
 {register&&<label className="flex gap-2 text-sm text-gray-600"><input name="privacyConsent" type="checkbox" required/>I agree to the <button type="button" className="text-green-700 underline" onClick={()=>navigate({name:'privacy'})}>Privacy Notice</button>.</label>}
 <button className={btn} disabled={busy}>{busy?'Please wait…':register?'Create account':'Sign in'}</button>
 <button className="block text-green-700" type="button" onClick={()=>{setRegister(!register);setError('');}}>{register?'Already registered? Sign in':'New customer? Create an account'}</button></form>:<>
 <div className="flex flex-wrap gap-3 mb-6 items-center"><p className="mr-auto">{user.email}</p><button className={btn} onClick={()=>navigate({name:'checkout'})}>Return to checkout</button>
 {user.is_admin&&<button className={btn} disabled={busy} onClick={()=>void run(async()=>{await refresh(!admin);setAdmin(!admin);})}>{admin?'My orders':'Manage store'}</button>}
 <button className="border rounded-xl p-3" disabled={busy} onClick={()=>void run(async()=>{await api('/logout','POST');setUser(null);setOrders([]);setAdmin(false);})}>Sign out</button></div>
 <button className="text-sm text-gray-500 underline mb-6" disabled={busy} onClick={()=>{if(window.confirm('Send a request to erase your account data? Orders may be retained where legally required.'))void run(async()=>{await api('/me/erasure-request','POST');alert('Your erasure request has been submitted.');});}}>Request account-data erasure</button>
 <h2 className="text-xl font-bold mb-4">{admin?'Store orders':'Your orders'}</h2>{!orders.length&&<p>No orders yet.</p>}
 <div className="space-y-4">{orders.map(o=><div key={o.id} className="bg-white border rounded-2xl p-5"><div className="flex justify-between gap-3"><strong>{o.number}</strong><span>{formatTzs(o.total_cents/100)} · {o.payment_status}</span></div><p className="text-gray-500 text-sm my-2">{new Date(o.created_at).toLocaleDateString('en-TZ')} · {o.time_slot} · {o.status.replace(/_/g,' ')}</p>{o.items.map(i=><p key={i.id}>{i.name} × {i.quantity}</p>)}
 {admin&&o.delivery&&<div className="text-sm my-3"><p>{o.delivery.name} · {o.delivery.phone} · {o.delivery_option}</p><p>{o.delivery.address} {o.delivery.city}</p><p>{o.delivery.instructions}</p>{o.payment_method==='mobile_money'&&<p className="mt-1">Mobile Money · {o.payment_details?.provider} · Ref: {o.payment_details?.reference}</p>}</div>}{admin&&<div className="flex gap-3 mt-3"><select aria-label={`Status for ${o.number}`} disabled={busy} value={o.status} onChange={e=>{const status=e.target.value;void run(async()=>{await api(`/admin/orders/${o.id}`,'PATCH',{status});await refresh(true);});}}>{['pending','processing','out_for_delivery','delivered'].map(s=><option key={s}>{s}</option>)}</select><select aria-label={`Payment for ${o.number}`} disabled={busy} value={o.payment_status} onChange={e=>{const payment_status=e.target.value;void run(async()=>{await api(`/admin/orders/${o.id}`,'PATCH',{payment_status});await refresh(true);});}}><option>unpaid</option><option>paid</option></select></div>}</div>)}</div>
 {admin&&<><h2 className="text-xl font-bold my-6">Products and inventory</h2><div className="space-y-3">{catalog.map(p=><form key={`${p.id}-${p.price}-${p.stock}`} className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-center" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);void run(async()=>{await api(`/admin/products/${p.id}`,'PATCH',{price_cents:Math.round(Number(f.get('price'))*100),stock:Number(f.get('stock'))});const latest=await loadProducts();products.splice(0,products.length,...latest);setCatalog(latest);});}}><strong className="flex-1 min-w-40">{p.name}</strong><label>Price (TSh) <input className="border rounded p-2 w-28" name="price" type="number" min="1" step="1" required defaultValue={p.price}/></label><label>Stock <input className="border rounded p-2 w-24" name="stock" type="number" min="0" step="1" required defaultValue={p.stock}/></label><button className={btn} disabled={busy}>Save</button></form>)}</div></>}
 </>}</div>;
}
