import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Wallet, ShieldCheck } from 'lucide-react';
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
  const [requested, setRequested] = useState(0);
  const [readySlides, setReadySlides] = useState(() => new Set<number>());
  const [loadedSlides, setLoadedSlides] = useState(() => new Set([0]));
  useEffect(() => { setLoadedSlides(previous => new Set([...previous, requested])); }, [requested]);
  useEffect(() => { if (readySlides.has(requested)) setIndex(requested); }, [readySlides, requested]);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [visible, setVisible] = useState(true);
  const [engaged, setEngaged] = useState(false);
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
    if (reduced || !visible || engaged) return;
    const timer = window.setInterval(() => setRequested(value => (value + 1) % slides.length), 6000);
    return () => window.clearInterval(timer);
  }, [reduced, visible, engaged]);
  const slide = slides[index];
  return <section ref={root} className="hero-slideshow" aria-roledescription="carousel" aria-label="Grocery inspiration" onFocusCapture={() => setEngaged(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setEngaged(false); }}>
    <div className="hero-backdrops" aria-hidden="true">{slides.map((item, position) => (loadedSlides.has(position) || position === requested) && <img key={item.image} src={`/images/hero/${item.image}-1280.webp`} srcSet={[640,1280,1920].map(width => `/images/hero/${item.image}-${width}.webp ${width}w`).join(', ')} sizes="100vw" width={1920} height={768} alt="" loading="eager" fetchPriority={position === 0 ? 'high' : 'low'} decoding="async" onLoad={() => setReadySlides(previous => new Set([...previous, position]))} className={position === index ? 'is-active' : ''}/>)}</div>
    <div className="store-container hero-inner">
      <div
        key={index}
        className="hero-copy"
        aria-live="off"
        aria-atomic="true"
        data-reveal-group
      >
        <p className="hero-topic fc-hero-reveal" data-reveal>
          {slide.label}
        </p>
        <h1 className="fc-hero-reveal" data-reveal>
          {slide.title}
        </h1>
        <p className="hero-description fc-hero-reveal" data-reveal>
          {slide.text}
        </p>
        <div className="flex flex-wrap gap-3 fc-hero-reveal" data-reveal>
          <button className="button-primary" onClick={() => navigate(slide.page)}>
            Shop Now<ArrowRight className="w-4 h-4" />
          </button>
          <button className="button-secondary" onClick={() => navigate({ name: 'deals' })}>
            Explore deals
          </button>
        </div>
      </div>
      <div className="hero-bottom">
        <div className="hero-benefits"><span><Wallet size={16}/>Prices in TZS</span><span><ShieldCheck size={16}/>Clear checkout totals</span></div>
      </div>
    </div>
  </section>;
}
