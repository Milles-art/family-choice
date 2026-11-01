import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Wallet, ShieldCheck, Pause, Play } from 'lucide-react';
import { useStore } from '../store';
import type { Page } from '../types';

const slides: { image: string; title: string; text: string; page: Page; label: string }[] = [
  { image: 'market', title: 'Good food. A fresh start.', text: 'Bring colour to your table with fruit, vegetables and everyday favourites. Your next delicious meal starts here.', page: { name: 'catalog', categoryId: 'produce' }, label: 'Fresh produce' },
  { image: 'family', title: 'For the moments you share.', text: 'From the weekly grocery list to a meal together, find everyday essentials for your family in one place.', page: { name: 'catalog' }, label: 'Family groceries' },
  { image: 'pantry', title: 'A well-stocked kitchen starts here.', text: 'Make room for pantry staples, simple ingredients and all the possibilities of a home-cooked meal.', page: { name: 'catalog' }, label: 'Pantry essentials' },
  { image: 'breakfast', title: 'Make mornings a little warmer.', text: 'Bread for the table. Eggs for the pan. Discover everyday favourites for your breakfast basket.', page: { name: 'catalog', categoryId: 'bakery' }, label: 'Breakfast favourites' },
];

export function HeroSlideshow() {
  const { navigate } = useStore();
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(true);
  const [engaged, setEngaged] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(media.matches);
    media.addEventListener('change', change);
    let onScreen = true;
    const update = () => setVisible(onScreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; update(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', update);
    return () => { media.removeEventListener('change', change); observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    if (reduced || !visible || engaged || paused || hovered) return;
    const timer = window.setInterval(() => setIndex(value => (value + 1) % slides.length), 7000);
    return () => window.clearInterval(timer);
  }, [reduced, visible, engaged, paused, hovered, index]);
  const slide = slides[index];
  return <section ref={root} className={`hero-slideshow ${paused || hovered || engaged || !visible || reduced ? 'is-paused' : ''}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} aria-roledescription="carousel" aria-label="Grocery inspiration" onFocusCapture={() => setEngaged(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setEngaged(false); }}>
    <div className="hero-backdrops" aria-hidden="true">{slides.map((item, position) => <img key={item.image} src={`/images/hero/${item.image}-1280.webp`} srcSet={[640,1280,1920].map(width => `/images/hero/${item.image}-${width}.webp ${width}w`).join(', ')} sizes="100vw" width={1920} height={768} alt="" loading={position === 0 ? 'eager' : 'lazy'} fetchPriority={position === 0 ? 'high' : 'low'} decoding="async" className={position === index ? 'is-active' : ''}/>)}</div>
    <div className="store-container hero-inner">
      <div key={index} className="hero-copy" aria-live="off" aria-atomic="true">
        <p className="hero-topic">{slide.label}</p>
        <h1>{slide.title}</h1>
        <p className="hero-description">{slide.text}</p>
        <div className="flex flex-wrap gap-3"><button className="button-primary" onClick={() => navigate(slide.page)}>Shop Now<ArrowRight className="w-4 h-4"/></button><button className="button-secondary" onClick={() => navigate({name:'deals'})}>Explore deals</button></div>
      </div>
      <div className="hero-bottom">
        <div className="hero-benefits"><span><Wallet size={16}/>Prices in TZS</span><span><ShieldCheck size={16}/>Clear checkout totals</span></div>
        <div className="fc-slide-controls" aria-label="Choose a hero slide">{!reduced && <button aria-label={paused ? "Play slideshow" : "Pause slideshow"} onClick={() => setPaused(value => !value)}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button>}{slides.map((item,position) => <button key={item.image} aria-label={`Show ${item.label}`} aria-pressed={position === index} onClick={() => setIndex(position)}><span/></button>)}</div>
      </div>
    </div>
  </section>;
}
