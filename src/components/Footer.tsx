import { StoreLink } from './StoreLink';
import { Phone, MessageCircle } from 'lucide-react';
import type { Page } from '../types';

const links: { label: string; destination: Page }[] = [
  { label: 'Shop', destination: { name: 'catalog' } },
  { label: 'Deals', destination: { name: 'deals' } },
  { label: 'Delivery', destination: { name: 'info', section: 'delivery' } },
  { label: 'Contact', destination: { name: 'info', section: 'help' } },
  { label: 'About us', destination: { name: 'info', section: 'about' } },
  { label: 'Account', destination: { name: 'account' } },
];

export function Footer() {
  return <footer className="fc-footer fc-footer-compact mt-auto">
    <div className="store-container">
      <div className="footer-main">
        <StoreLink to={{name:'home'}} className="footer-home" aria-label="FAMILY CHOICE SUPERMARKET home">
          <img src="/images/brand/family-choice-logo.svg" width={1547} height={325} alt="FAMILY CHOICE SUPERMARKET" loading="lazy" decoding="async"/>
        </StoreLink>
        <nav aria-label="Footer navigation">
          <ul className="footer-links">{links.map(link => <li key={link.label}><StoreLink to={link.destination}>{link.label}</StoreLink></li>)}</ul>
        </nav>
        <address className="footer-contact" aria-label="Contact the supermarket">
          <a href="tel:+255768641810"><Phone size={17} aria-hidden="true"/><span>+255 768 641 810</span></a>
          <a href="https://wa.me/255768641810" target="_blank" rel="noopener noreferrer"><MessageCircle size={17} aria-hidden="true"/><span>WhatsApp</span></a>
        </address>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} FAMILY CHOICE SUPERMARKET</p>
        <StoreLink to={{name:'privacy'}}>Privacy notice</StoreLink>
      </div>
    </div>
  </footer>;
}
