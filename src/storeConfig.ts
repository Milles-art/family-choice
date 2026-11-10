/**
 * Store details used by the WhatsApp, delivery-area and footer features.
 * Edit this file only. Anything left empty is simply hidden on the site,
 * so nothing unconfirmed is ever shown to customers.
 */
export const storeConfig = {
  /** International format, digits only (no +). Used for wa.me links. */
  whatsappNumber: '255768641810',

  /** Opening hours, one line each, e.g. { days: 'Mon - Sat', hours: '8:00 - 21:00' }. Leave [] to hide. */
  openingHours: [{ days: 'Opening hours', hours: '8:00 AM–9:00 PM' }] as { days: string; hours: string }[],

  /** Full Google Maps link to the store (the "Share" link). Leave '' to hide. */
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Mafiga%20Shell%2C%20Morogoro%2C%20Tanzania',

  /** Street address shown next to the map link. Leave '' to hide. */
  address: 'Mafiga Shell, Morogoro, Tanzania',

  /** Publish only after the domain mailbox is created and tested in cPanel. */
  contactEmail: 'info@familychoiceminimarket.co.tz',

  deliveryTiming: 'Delivery times are flexible and arranged with the store. Contact us to agree a suitable time.',

  /**
   * Areas you CONFIRMED you deliver to. Leave [] to hide the area checker.
   * Example: ['Kinondoni', 'Mikocheni', 'Masaki', 'Sinza']
   */
  deliveryAreas: ['Morogoro'] as string[],
};

export function whatsappLink(message: string) {
  return `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
