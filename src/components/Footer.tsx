import { useStore } from '../store';
import { Leaf, Phone, Mail, MapPin, MessageCircle, Globe, Clock } from 'lucide-react';
import type { Page } from '../types';
import { storeConfig } from '../storeConfig';

const linkGroups: { title: string; links: { label: string; destination: Page }[] }[] = [
  { title: 'Shop', links: [
    { label: 'All groceries', destination: { name: 'catalog' } },
    { label: 'Deals', destination: { name: 'deals' } },
    { label: 'New arrivals', destination: { name: 'new-arrivals' } },
    { label: 'Recipes', destination: { name: 'recipes' } },
  ] },
  { title: 'Help & information', links: [
    { label: 'Help & contact', destination: { name: 'info', section: 'help' } },
    { label: 'Delivery & pickup', destination: { name: 'info', section: 'delivery' } },
    { label: 'How to order', destination: { name: 'info', section: 'how-it-works' } },
    { label: 'About us', destination: { name: 'info', section: 'about' } },
  ] },
  { title: 'Your account', links: [
    { label: 'Account & orders', destination: { name: 'account' } },
    { label: 'Wishlist', destination: { name: 'wishlist' } },
  ] },
];

export function Footer() {
  const { navigate } = useStore();
  return <footer className="fc-footer mt-auto">
    <div className="store-container">
      <div className="fc-footer-grid">
        <div className="fc-footer-brand">
          <button className="fc-footer-home" onClick={() => navigate({ name: 'home' })} aria-label="FAMILY CHOICE SUPERMARKET home">
            <Leaf size={25} aria-hidden="true"/><strong>FAMILY CHOICE SUPERMARKET</strong>
          </button>
          <p className="fc-footer-description">Everyday groceries and household essentials, in one place.</p>
          <address className="fc-footer-contact" aria-label="Contact us">
            <a href="tel:+255768641810"><Phone size={15} aria-hidden="true"/>+255 768 641 810</a>
            <a href="https://wa.me/255768641810" target="_blank" rel="noopener noreferrer"><MessageCircle size={15} aria-hidden="true"/>Chat on WhatsApp</a>
            <a href="mailto:info@familychoicesupermarket.co.tz"><Mail size={15} aria-hidden="true"/><span>info@familychoicesupermarket.co.tz</span></a>
            <a href="https://familychoiceminimarket.co.tz"><Globe size={15} aria-hidden="true"/><span>familychoiceminimarket.co.tz</span></a>
            {storeConfig.mapUrl ? <a href={storeConfig.mapUrl} target="_blank" rel="noopener noreferrer"><MapPin size={15} aria-hidden="true"/><span>{storeConfig.address || 'Find us on Google Maps'}</span></a> : <span><MapPin size={15} aria-hidden="true"/>{storeConfig.address || 'Dar es Salaam, Tanzania'}</span>}
            {storeConfig.openingHours.length > 0 && <span><Clock size={15} aria-hidden="true"/><span>{storeConfig.openingHours.map(row => `${row.days}: ${row.hours}`).join(' · ')}</span></span>}
          </address>
          <p className="fc-footer-currency">All prices in TZS.</p>
        </div>
        {linkGroups.map(group => <nav key={group.title} aria-label={`Footer ${group.title}`}>
          <h2>{group.title}</h2>
          <ul>{group.links.map(link => <li key={link.label}><button onClick={() => navigate(link.destination)}>{link.label}</button></li>)}</ul>
        </nav>)}
      </div>
      <div className="fc-footer-bottom">
        <p>© {new Date().getFullYear()} FAMILY CHOICE SUPERMARKET. All rights reserved.</p>
        <button onClick={() => navigate({ name: 'privacy' })}>Privacy notice</button>
      </div>
    </div>
  </footer>;
}
