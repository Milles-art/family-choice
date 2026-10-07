import { ArrowRight, ChevronRight, Globe, Mail, MapPin, MessageCircle, Phone, ShoppingBag, Truck } from 'lucide-react';
import { useStore } from '../store';
import { EditorialImage } from './EditorialImage';

export function ContactPage() {
  const { navigate } = useStore();
  return <div className="contact-page store-container">
    <nav className="contact-breadcrumb" aria-label="Breadcrumb"><button onClick={() => navigate({name:'home'})}>Home</button><ChevronRight size={14} aria-hidden="true"/><span aria-current="page">Help & contact</span></nav>
    <section className="contact-hero" aria-labelledby="contact-title">
      <div className="contact-intro"><h1 id="contact-title">Let's make your<br/>shopping easier.</h1><p>Have a question about your order, groceries or delivery? Get in touch with FAMILY CHOICE SUPERMARKET.</p><a className="contact-primary" href="https://wa.me/255768641810" target="_blank" rel="noopener noreferrer"><MessageCircle size={20} aria-hidden="true"/>Chat on WhatsApp<ArrowRight size={18} aria-hidden="true"/></a><p className="contact-note">For an existing order, have your order number ready.</p></div>
      <figure className="contact-photo"><EditorialImage name="about-team-produce-concept" alt="Illustrative supermarket scene of people arranging fresh vegetables" eager sizes="(min-width: 768px) 55vw, 100vw"/></figure>
    </section>
    <section className="contact-methods" aria-label="Contact options">
      <div><Phone size={24} aria-hidden="true"/><h2>Give us a call</h2><p>Speak to us about your shopping or order.</p><a href="tel:+255768641810">+255 768 641 810<ArrowRight size={17} aria-hidden="true"/></a></div>
      <div><Mail size={24} aria-hidden="true"/><h2>Send an email</h2><p>Include your order number when asking about an order.</p><a href="mailto:info@familychoicesupermarket.co.tz">info@familychoicesupermarket.co.tz<ArrowRight size={17} aria-hidden="true"/></a></div>
      <div><MapPin size={24} aria-hidden="true"/><h2>Our location</h2><p>Dar es Salaam, Tanzania</p><a href="https://familychoiceminimarket.co.tz"><Globe size={17} aria-hidden="true"/>familychoiceminimarket.co.tz</a></div>
    </section>
    <section className="contact-help" aria-labelledby="contact-help-title"><div><h2 id="contact-help-title">Find what you need</h2><p>Check your order or review delivery information before getting in touch.</p></div><div className="contact-shortcuts">
      <button onClick={() => navigate({name:'account'})}><ShoppingBag size={25} aria-hidden="true"/><span><strong>Orders & account</strong><span>Sign in to see your current and previous orders.</span></span><ArrowRight size={20} aria-hidden="true"/></button>
      <button onClick={() => navigate({name:'info',section:'delivery'})}><Truck size={25} aria-hidden="true"/><span><strong>Delivery & pickup</strong><span>Review delivery fees and checkout options.</span></span><ArrowRight size={20} aria-hidden="true"/></button>
    </div></section>
    <section className="contact-answers" aria-labelledby="contact-answers-title"><figure className="contact-photo"><EditorialImage name="delivery-home-handover-concept" alt="Illustrative scene of a grocery bag being handed over at a home" sizes="(min-width: 768px) 45vw, 100vw"/></figure><div><h2 id="contact-answers-title">A few quick answers</h2>{[
      ['Where can I find my order?', 'Sign in to My Account to see your order number, items, order status and payment status.'],
      ['How do I choose delivery or pickup?', 'Choose your preferred option at checkout, enter the required details and select a time slot. Review the delivery fee and total before placing your order.'],
      ['Has my payment been confirmed?', 'Check the payment status in your account. An order confirmation means your order was saved; mobile-money payments await confirmation by the store. Cash payment is due on delivery or pickup.'],
      ['What should I include when contacting you?', 'Share your order number and a short description of your question. Never send your account password or mobile-money PIN.'],
    ].map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
  </div>;
}
