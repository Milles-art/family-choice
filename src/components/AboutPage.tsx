import { ArrowRight, Phone, Mail, MapPin } from 'lucide-react';
import { useStore } from '../store';

function AboutImage({ name, alt, eager = false }: { name: string; alt: string; eager?: boolean }) {
  return <figure className="about-photo"><img src={`/images/about/${name}-1280.webp`} srcSet={[640,1280,1536].map(width => `/images/about/${name}-${width}.webp ${width}w`).join(', ')} sizes="(min-width: 1024px) 55vw, 100vw" width={1536} height={1024} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'low'} decoding="async"/></figure>;
}

export function AboutPage() {
  const { navigate } = useStore();
  return <div className="about-page store-container">
    <nav className="about-breadcrumb" aria-label="Breadcrumb"><button onClick={() => navigate({name:'home'})}>Home</button><span aria-hidden="true">/</span><span aria-current="page">About us</span></nav>
    <section className="about-hero" aria-labelledby="about-title">
      <div className="about-hero-copy"><p className="about-brand">FAMILY CHOICE SUPERMARKET</p><h1 id="about-title">Groceries for<br/>everyday life.</h1><p>Fresh ingredients, cupboard favourites and the essentials that keep your household going. FAMILY CHOICE SUPERMARKET brings your everyday shop together in one place.</p><button className="about-action" onClick={() => navigate({name:'catalog'})}>Explore the shop <ArrowRight size={18} aria-hidden="true"/></button></div>
      <AboutImage name="family-shopping" alt="Illustrative scene of a family choosing vegetables together in a supermarket" eager/>
    </section>
    <section className="about-principles" aria-label="Shopping with us">
      <div><h2>One place for your list</h2><p>Browse produce, pantry staples, bakery favourites and household essentials.</p></div>
      <div><h2>Clear before checkout</h2><p>Review groceries, delivery and tax separately before ordering.</p></div>
      <div><h2>Your choice, every time</h2><p>Choose delivery or pickup at checkout.</p></div>
    </section>
    <section className="about-story" aria-labelledby="about-story-title">
      <AboutImage name="everyday-essentials" alt="Illustrative still life of fresh produce, bread and pantry essentials beside a reusable grocery bag"/>
      <div><h2 id="about-story-title">From the kitchen cupboard<br/>to the family table.</h2><p>A weekly grocery list. Ingredients for tonight's meal. A few things for the home. Shop the categories you need and review your basket at your own pace.</p><p>Prices are shown in Tanzanian shillings, with pack sizes and stock information alongside each product.</p><button className="about-text-link" onClick={() => navigate({name:'info',section:'how-it-works'})}>See how to order <ArrowRight size={18} aria-hidden="true"/></button></div>
    </section>
    <section className="about-contact" aria-labelledby="about-contact-title"><div><h2 id="about-contact-title">Let's stay in touch.</h2><p>For questions about your shopping, orders or delivery options, get in touch.</p><button className="about-text-link" onClick={() => navigate({name:'info',section:'delivery'})}>Delivery & pickup information <ArrowRight size={18} aria-hidden="true"/></button></div><address><span><MapPin size={20} aria-hidden="true"/>Dar es Salaam, Tanzania</span><a href="tel:+255768641810"><Phone size={20} aria-hidden="true"/>+255 768 641 810</a><a href="mailto:info@familychoicesupermarket.co.tz"><Mail size={20} aria-hidden="true"/>info@familychoicesupermarket.co.tz</a><a href="https://wa.me/255768641810" target="_blank" rel="noopener noreferrer">Chat on WhatsApp <ArrowRight size={18} aria-hidden="true"/></a></address></section>
  </div>;
}
