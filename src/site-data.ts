import { storeConfig } from './storeConfig';

/** Site copy and asset paths — family-choice's equivalent of ice-cream-hub's src/lib/site.js. */

const digits = storeConfig.whatsappNumber;

export const site = {
  name: 'Family Choice Supermarket',
  tagline:
    'Ice creams, fresh produce and household essentials at Mafiga Shell, Morogoro. Local delivery or store pickup.',
  address: storeConfig.address,
  hours: storeConfig.openingHours.map(entry => entry.hours).join(' · '),
  phoneDisplay: `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`,
  phoneHref: `tel:+${digits}`,
  whatsappHref: `https://wa.me/${digits}`,
  email: storeConfig.contactEmail,
};

export const images = {
  sundae: '/images/sundae.jpg',
  strawberry: '/images/strawberry.jpg',
  chocolate: '/images/chocolate.jpg',
  mintchip: '/images/mintchip.jpg',
  mango: '/images/mango.jpg',
  veg: '/images/veg.jpg',
};

export type Flavor = { name: string; tagline: string; image: string; bg: string; ink: string };

export const flavors: Flavor[] = [
  {
    name: 'Strawberry',
    tagline: 'Sweet, pink and full of berries',
    image: images.strawberry,
    bg: '#FFD9E3',
    ink: '#C2185B',
  },
  {
    name: 'Chocolate',
    tagline: 'Rich, deep and dripping with sauce',
    image: images.chocolate,
    bg: '#F3D9C2',
    ink: '#6B3A1E',
  },
  {
    name: 'Mint Chip',
    tagline: 'Cool mint with dark chocolate chips',
    image: images.mintchip,
    bg: '#CFF3E4',
    ink: '#0F7A55',
  },
  {
    name: 'Mango',
    tagline: 'Sunny, tropical and bright',
    image: images.mango,
    bg: '#FFE9B0',
    ink: '#B45309',
  },
];

/** Sticky gallery row — flavour photos sit between the sundae and the produce shot. */
export const galleryItems = [
  { src: images.sundae, title: 'Sundae ya leo', caption: "Today's sundae" },
  ...flavors.map(f => ({ src: f.image, title: f.name, caption: f.tagline })),
  { src: images.veg, title: 'Mboga freshi', caption: 'Fresh produce every day' },
];

/** Hero floating product cards appear one after another near the end of the scroll story. */
export const heroCards = [
  {
    name: flavors[0].name,
    tagline: flavors[0].tagline,
    image: flavors[0].image,
    className: 'lg:absolute lg:left-[6%] lg:bottom-[10%] lg:-rotate-6',
  },
  {
    name: flavors[1].name,
    tagline: flavors[1].tagline,
    image: flavors[1].image,
    className: 'lg:absolute lg:right-[6%] lg:top-[18%] lg:rotate-3',
  },
  {
    name: flavors[2].name,
    tagline: flavors[2].tagline,
    image: flavors[2].image,
    className: 'lg:absolute lg:right-[18%] lg:bottom-[8%] lg:-rotate-2',
  },
];
