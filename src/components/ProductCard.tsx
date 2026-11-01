import type { Product } from '../types';
import { formatTzs } from '../currency';
import { useStore } from '../store';
import { ShoppingCart, Check, Heart, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { imageUrl, imageSet } from '../images';
import { ProductImage } from './ProductImage';

export function ProductCard({ product, onQuickView }: { product: Product; onQuickView?: (product: Product) => void }) {
  const { addToCart, isWishlisted, toggleWishlist, cart, updateQuantity } = useStore();
  const inCart = cart.find(item => item.product.id === product.id)?.quantity ?? 0;
  const [added, setAdded] = useState(false);
  useEffect(() => { if (!added) return; const timer = setTimeout(() => setAdded(false), 1400); return () => clearTimeout(timer); }, [added]);
  const discount = product.originalPrice && product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const wished = isWishlisted(product.id);
  const available = product.inStock && (cart.find(item => item.product.id === product.id)?.quantity ?? 0) < Math.min(product.stock ?? 100, 100);
  return <article data-product-id={product.id} className={`product-card surface overflow-hidden flex flex-col ${product.inStock ? '' : 'is-oos'}`}>
    <div className="fc-card-media relative aspect-square bg-white">
      <button className="block w-full h-full p-3" onClick={() => onQuickView?.(product)} aria-label={`View ${product.name}`}><ProductImage key={product.image} src={imageUrl(product.image, 480)} srcSet={imageSet(product.image)} sizes="(max-width: 639px) 45vw, (max-width: 1439px) 240px, 280px" width={480} height={480} alt={product.name} loading="lazy" decoding="async" className="w-full h-full object-contain" /></button>
      {(discount > 0 || product.badge) && <span className="absolute top-2 left-2 fc-badge pointer-events-none bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-lg">{discount > 0 ? `Save ${discount}%` : product.badge}</span>}

    </div>
    <div className="p-3 sm:p-4 flex flex-col flex-1">
      <h3 className="text-sm font-semibold leading-snug mb-1"><button className="text-left hover:text-green-700" onClick={() => onQuickView?.(product)}>{product.name}</button></h3>
      <p className="text-sm text-gray-500">{product.unit}</p>
      <p className={`text-xs font-medium my-2 ${product.inStock ? 'text-green-700' : 'text-red-700'}`}>{product.inStock ? 'In stock' : 'Out of stock'}</p>
      <div className="mt-auto pt-2"><strong className="product-price block text-xl">{formatTzs(product.price)}</strong><div className="min-h-5 text-xs text-gray-500">{discount > 0 && <><span className="sr-only">Original price </span><del>{formatTzs(product.originalPrice!)}</del></>}</div>
      <div className="mt-3 flex items-center justify-between gap-2">
      <button onClick={() => toggleWishlist(product.id)} className={`fc-heart ${wished ? 'is-on' : ''} w-11 h-11 rounded-xl border bg-white flex items-center justify-center ${wished ? 'text-red-700' : 'text-gray-600'}`} aria-pressed={wished} aria-label={`${wished ? 'Remove' : 'Save'} ${product.name} ${wished ? 'from' : 'to'} wishlist`}><Heart className={`w-5 h-5 ${wished ? 'fill-current' : ''}`} /></button>
        {inCart > 0 ? <div className="flex flex-wrap justify-end items-center gap-2">{added && <span role="status" className="fc-add-confirmation"><Check size={14}/>Added</span>}<div className="fc-stepper" role="group" aria-label={`${product.name} quantity`}><button type="button" aria-label={`Decrease ${product.name} quantity`} onClick={() => updateQuantity(product.id, inCart - 1)}><Minus className="w-4 h-4"/></button><span aria-live="polite">{inCart}</span><button type="button" aria-label={`Increase ${product.name} quantity`} disabled={!available} onClick={() => { if (addToCart(product)) setAdded(true); }}><Plus className="w-4 h-4"/></button></div></div> : (
        <button onClick={() => { if (addToCart(product)) setAdded(true); }} disabled={!available} aria-label={added ? 'Added to cart' : available ? 'Add to cart' : product.inStock ? 'Stock limit reached' : 'Unavailable'} title={added ? 'Added to cart' : available ? 'Add to cart' : product.inStock ? 'Stock limit reached' : 'Unavailable'} className={`fc-add-btn ${added ? 'is-added' : ''} w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-800`}>{added ? <Check className="w-5 h-5"/> : <ShoppingCart className="w-5 h-5"/>}</button>
        )}
      </div></div>
    </div>
  </article>;
}
