import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../types';
import { useStore } from '../store';
import { ProductCard } from './ProductCard';

type Props = { title: string; text: string; products: Product[]; onViewAll: () => void };

export function HomeProductCarousel({ title, text, products, onViewAll }: Props) {
  const { navigate } = useStore();
  const track = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ first: true, last: products.length <= 1 });
  useEffect(()=>{
    const element=track.current;
    if(!element)return;
    const observer=new ResizeObserver(()=>setPosition({first:element.scrollLeft<2,last:element.scrollLeft+element.clientWidth>=element.scrollWidth-2}));
    observer.observe(element);
    return ()=>observer.disconnect();
  },[products.length]);
  function updatePosition() {
    const element = track.current;
    if (element) setPosition({first:element.scrollLeft < 2, last:element.scrollLeft + element.clientWidth >= element.scrollWidth - 2});
  }
  function scroll(direction: number) {
    const element = track.current;
    if (!element) return;
    element.scrollBy({left:direction * element.clientWidth * 0.8, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  return <section className="store-container fc-section home-carousel" aria-label={title}>
    <div className="fc-section-heading"><div><h2>{title}</h2><p>{text}</p></div><div className="home-carousel-actions"><button className="fc-text-button" onClick={onViewAll}>View all <ArrowRight size={18}/></button><button className="home-carousel-arrow" disabled={position.first} aria-label={`Previous ${title} products`} onClick={()=>scroll(-1)}><ChevronLeft size={20}/></button><button className="home-carousel-arrow" disabled={position.last} aria-label={`Next ${title} products`} onClick={()=>scroll(1)}><ChevronRight size={20}/></button></div></div>
    {products.length ? <div ref={track} className="home-carousel-track" tabIndex={0} aria-label={`${title} products`} onScroll={updatePosition} onFocus={updatePosition}>{products.slice(0,12).map(product=><div className="home-carousel-item" key={product.id}><ProductCard product={product} onQuickView={item=>navigate({name:'product',productId:item.id})}/></div>)}</div> : <div className="fc-empty"><p>Explore the current grocery selection.</p><button className="fc-text-button" onClick={onViewAll}>Browse groceries <ArrowRight size={18}/></button></div>}
  </section>;
}
