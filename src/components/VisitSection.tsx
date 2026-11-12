import { motion } from 'framer-motion';
import { Clock, Mail, MapPin, MessageCircle, Phone, Store, Truck } from 'lucide-react';
import { site } from '../site-data';
import { storeConfig } from '../storeConfig';

const cards = [
  { Icon: MapPin, title: 'Find us', text: site.address },
  { Icon: Clock, title: 'Opening hours', text: site.hours },
  { Icon: Truck, title: 'Delivery', text: storeConfig.deliveryTiming },
  { Icon: Store, title: 'Pickup', text: 'Order ahead and collect from the store.' },
];

export function VisitSection() {
  return (
    <section
      id="visit"
      className="relative overflow-hidden bg-[#4A2618] py-24 text-white md:py-32"
    >
      <div className="pointer-events-none absolute -top-32 right-0 size-[420px] rounded-full bg-primary/40 blur-3xl" />

      <div className="relative mx-auto max-w-6xl space-y-14 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl space-y-4"
        >
          <h2 className="font-display text-4xl font-bold text-balance md:text-6xl">
            Craving a scoop? <span className="text-[#FFB3C7]">Come say hi.</span>
          </h2>
          <p className="text-lg text-white/70">
            Call or WhatsApp to order for delivery, or drop by the store.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={site.phoneHref}
              className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              <Phone className="size-4" /> {site.phoneDisplay}
            </a>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 text-base font-medium text-white transition-colors hover:bg-[#1fb857]"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="space-y-3 rounded-3xl bg-white/10 p-6 backdrop-blur"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD9E3] text-[#C2185B]">
                <Icon className="size-5" />
              </span>
              <p className="font-display text-xl font-semibold">{title}</p>
              <p className="text-sm text-white/70">{text}</p>
            </motion.div>
          ))}
        </div>

        <a
          href={`mailto:${site.email}`}
          className="inline-flex cursor-pointer items-center gap-2 text-white/70 hover:text-white"
        >
          <Mail className="size-4" /> {site.email}
        </a>
      </div>
    </section>
  );
}
