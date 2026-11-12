import { ShoppingBasket } from 'lucide-react';

/** Rotated pink band that scrolls between the hero and the departments. */
const items = [
  'Fresh produce',
  'Pantry favourites',
  'Dairy & eggs',
  'Household essentials',
  'Delivery in Morogoro',
  'Open till 9pm',
];

/** Duplicated once so the −50% translate loops seamlessly. */
const loop = [...items, ...items];

export function Marquee() {
  return (
    <div className="fc-marquee" aria-hidden="true">
      <div className="fc-marquee-track">
        {loop.map((label, index) => (
          <span key={`${label}-${index}`} className="fc-marquee-item">
            {label}
            <ShoppingBasket className="w-6 h-6 sm:w-8 sm:h-8" />
          </span>
        ))}
      </div>
    </div>
  );
}
