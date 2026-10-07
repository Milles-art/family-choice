import { ChevronRight, Clock3, Headphones, Leaf, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../store';
import { EditorialImage } from './EditorialImage';
import { settings } from '../api';
import { formatTzs } from '../currency';

type Section = 'delivery' | 'how-it-works' | 'about' | 'help';

const content: Record<Section, { title: string; description: string; icon: typeof Truck; cards: { title: string; text: string; icon: typeof Truck }[] }> = {
  delivery: {
    title: 'Delivery areas',
    description: 'Choose delivery or pickup at checkout, add your address and select a preferred time slot. Review your delivery details and order total before placing your order.',
    icon: MapPin,
    cards: [
      { title: 'Delivery address', text: 'Enter your house, street, landmark and city at checkout. Add clear directions to help with your delivery.', icon: MapPin },
      { title: 'Preferred time slots', text: 'Choose a preferred delivery or pickup time from the checkout options.', icon: Clock3 },
      { title: 'Delivery or pickup', text: 'Review your chosen option and delivery fee before placing your order.', icon: Truck },
    ],
  },
  'how-it-works': {
    title: 'How FAMILY CHOICE SUPERMARKET works',
    description: 'From fresh produce to pantry staples, ordering your household essentials takes only a few steps.',
    icon: PackageCheck,
    cards: [
      { title: '1. Choose your items', text: 'Browse categories or use search to fill your cart.', icon: PackageCheck },
      { title: '2. Select delivery or pickup', text: 'Add your address and select a convenient delivery option.', icon: MapPin },
      { title: '3. Receive your order', text: 'We prepare your shopping and keep you updated on its progress.', icon: Truck },
    ],
  },
  about: {
    title: 'About FAMILY CHOICE SUPERMARKET',
    description: 'FAMILY CHOICE SUPERMARKET brings groceries and household essentials together in one place, with prices in Tanzanian shillings and a clear order summary before checkout.',
    icon: Leaf,
    cards: [
      { title: 'Freshness first', text: 'We focus on everyday essentials and quality fresh products.', icon: Leaf },
      { title: 'Made for Tanzania', text: 'Prices, delivery information and support are tailored for local shoppers.', icon: MapPin },
      { title: 'Shop with confidence', text: 'Your account and checkout information are handled with care.', icon: ShieldCheck },
    ],
  },
  help: {
    title: 'Help & contact',
    description: 'Find help with your FAMILY CHOICE SUPERMARKET orders, delivery preferences and account. Use My Account to review orders.',
    icon: Headphones,
    cards: [
      { title: 'Order support', text: 'View your current and past orders from My Account after signing in.', icon: PackageCheck },
      { title: 'Account help', text: 'Sign in to manage your account details and review your shopping history.', icon: Headphones },
    ],
  },
};

export function StoreInfoPage({ section }: { section: Section }) {
  const { navigate, settingsReady } = useStore();
  const page = content[section];
  const Icon = page.icon;

  return <div className={`store-container fc-info fc-info-${section}`}>
    <div className="fc-breadcrumb"><button onClick={() => navigate({name:'home'})}>Home</button><ChevronRight size={14}/><span>{page.title}</span></div>
    <section className="fc-info-hero"><div><Icon size={36}/><h1>{page.title}</h1><p>{page.description}</p>{section !== 'help' && <button className="button-primary" onClick={() => navigate({name:'catalog'})}>Shop Now <ChevronRight size={18}/></button>}</div>{section === 'about' ? <EditorialImage name="about-store-exterior-concept" alt="A neighbourhood supermarket exterior"/> : section === 'delivery' ? <EditorialImage name="delivery-home-handover-concept" alt="A grocery bag handed over at a home"/> : <div className="fc-info-callout"><Icon size={64}/><h2>{section === 'help' ? 'A little help for your everyday shop.' : 'From your list to your doorstep.'}</h2><p>{section === 'help' ? 'Orders and account details, together in one place.' : 'Choose groceries. Select your preference. Review your order.'}</p></div>}</section>
    {section === 'about' && <section className="fc-about-story"><div className="fc-section-heading"><div><h2>Good food belongs in everyday life.</h2><p>Fresh ingredients, cupboard favourites and the essentials that keep your household going.</p></div></div><div className="fc-about-images">{[
      ['about-store-interior-concept','Shoppers browsing grocery aisles','Room for everything on your list.'],
      ['about-team-produce-concept','A team arranging fresh vegetables','Care in the everyday details.'],
    ].map(([name,alt,title]) => <figure key={name}><EditorialImage name={name} alt={alt}/><figcaption>{title}</figcaption></figure>)}</div></section>}
    {section === 'delivery' && <section className="fc-fee-panel"><div><Truck size={30}/><h2>Review fees before you order</h2></div><p>{settingsReady ? `Delivery costs ${formatTzs(settings.delivery_cents/100)}. Grocery subtotals of ${formatTzs(settings.free_delivery_cents/100)} or more qualify for free delivery. Pickup has no delivery fee.` : 'Review delivery fees in the order summary before placing your order.'}</p></section>}
    <section className="fc-info-features">{page.cards.map((card,i) => {const CardIcon=card.icon;return <article key={card.title}><CardIcon size={28}/><h2>{card.title}</h2><p>{card.text}</p>{section === 'help' && <button className="fc-text-button" onClick={() => navigate({name:'account'})}>{i===0 ? 'View my orders' : 'My Account'}<ChevronRight size={18}/></button>}</article>})}</section>
    {section === 'help' && <section className="fc-help-faq"><h2>Quick answers</h2>{[
      ['Where can I see my orders?','Sign in to My Account to review current and previous orders.'],
      ['How do I choose delivery or pickup?','Choose your preferred option at checkout, then select a time slot and review the order details.'],
    ].map(([question,answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>}
  </div>;
}

