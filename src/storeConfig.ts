/**
 * Store details used by the WhatsApp, delivery-area and footer features.
 * Edit this file only. Anything left empty is simply hidden on the site,
 * so nothing unconfirmed is ever shown to customers.
 */
export const storeConfig = {
  /** International format, digits only (no +). Used for wa.me links. */
  whatsappNumber: '255768641810',

  /** Opening hours, one line each, e.g. { days: 'Mon - Sat', hours: '8:00 - 21:00' }. Leave [] to hide. */
  openingHours: [] as { days: string; hours: string }[],

  /** Full Google Maps link to the store (the "Share" link). Leave '' to hide. */
  mapUrl: '',

  /** Street address shown next to the map link. Leave '' to hide. */
  address: '',

  /**
   * Areas you CONFIRMED you deliver to. Leave [] to hide the area checker.
   * Example: ['Kinondoni', 'Mikocheni', 'Masaki', 'Sinza']
   */
  deliveryAreas: [] as string[],
};

export function whatsappLink(message: string) {
  return `https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
