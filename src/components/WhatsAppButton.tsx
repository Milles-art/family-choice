import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { whatsappLink } from '../storeConfig';
import { useStore } from '../store';

export function WhatsAppButton() {
  const { page, cartOpen } = useStore();
  const [interacted, setInteracted] = useState(false);
  if (cartOpen || page.name === 'checkout' || page.name === 'cart') return null;
  return (
    <a
      className={`fc-whatsapp fc-whatsapp-pulse ${interacted ? 'is-interacted' : ''}`}
      href={whatsappLink('Hello FAMILY CHOICE SUPERMARKET, I need help with an order.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      onPointerDown={() => setInteracted(true)}
    >
      <MessageCircle size={24} aria-hidden="true" /><span>Chat on WhatsApp</span>
    </a>
  );
}
