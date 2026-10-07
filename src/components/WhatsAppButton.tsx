import { MessageCircle } from 'lucide-react';
import { whatsappLink } from '../storeConfig';

export function WhatsAppButton() {
  return <a className="fc-whatsapp" href={whatsappLink('Hello FAMILY CHOICE SUPERMARKET, I need help with an order.')} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"><MessageCircle size={24} aria-hidden="true"/><span>Chat on WhatsApp</span></a>;
}
