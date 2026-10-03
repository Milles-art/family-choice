import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { api, loadProducts, settings } from './api';
import { products } from './data';

const root = createRoot(document.getElementById('root')!);
async function start() {
 try { Object.assign(settings, await api('/settings')); products.splice(0, products.length, ...await loadProducts()); } catch { root.render(<div className="max-w-lg mx-auto p-8"><h1 className="text-xl font-bold">FreshCart is connecting</h1><p className="my-4">The store server is unavailable. Please try again shortly.</p><button className="bg-green-600 text-white p-3 rounded-xl" onClick={() => window.location.reload()}>Retry</button></div>); return; }
 root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

}
void start();
