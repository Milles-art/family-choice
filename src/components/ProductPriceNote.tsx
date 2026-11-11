import type { Product } from '../types';

export function ProductPriceNote({ product }: { product: Product }) {
  if (product.priceType === 'store-confirmed') return null;
  const basis = product.priceBasis ?? product.priceType;
  if (!basis) return null;
  return <p className="text-xs text-gray-600 mt-1">{basis === 'planning-estimate' ? 'Planning estimate' : 'Retailer-listed price'}{product.priceUnit && product.priceUnit !== product.unit ? ` · ${product.priceUnit}` : ''}</p>;
}
