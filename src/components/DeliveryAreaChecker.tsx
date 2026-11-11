import { useState } from 'react';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { settings } from '../api';
import { useStore } from '../store';
import { formatTzs } from '../currency';
import { storeConfig, whatsappLink } from '../storeConfig';

const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

/** Renders nothing until real areas are added in storeConfig.ts. */
export function DeliveryAreaChecker() {
  const { settingsReady } = useStore();
  const [query, setQuery] = useState('');
  const areas = storeConfig.deliveryAreas;
  if (!areas.length) return null;
  const q = norm(query);
  const match = q ? areas.find(area => norm(area) === q) : undefined;
  return <section className="fc-area-checker" aria-labelledby="area-checker-title">
    <div><h2 id="area-checker-title">Delivery in Morogoro</h2><p>We deliver within Morogoro only. Enter your city to check coverage. For neighbourhood directions, contact the store.</p></div>
    <div>
      <label className="sr-only" htmlFor="area-input">Your area</label>
      <div className="fc-area-input"><Search size={18} aria-hidden="true"/><input id="area-input" list="area-options" autoComplete="off" value={query} placeholder="e.g. Morogoro" onChange={e => setQuery(e.target.value)}/></div>
      <datalist id="area-options">{areas.map(area => <option key={area} value={area}/>)}</datalist>
      <div role="status" aria-live="polite" className="fc-area-result">
        {q && match && <p className="is-yes"><CheckCircle2 size={20} aria-hidden="true"/><span><strong>Yes, we deliver to {match}.</strong>{settingsReady ? ` Delivery is ${formatTzs(settings.delivery_cents/100)}.` : ''}</span></p>}
        {q && !match && <p className="is-no"><XCircle size={20} aria-hidden="true"/><span><strong>We could not find that area.</strong> <a href={whatsappLink(`Hello, do you deliver to ${query.trim()}?`)} target="_blank" rel="noopener noreferrer">Ask us on WhatsApp</a> or choose pickup.</span></p>}
      </div>
    </div>
  </section>;
}
