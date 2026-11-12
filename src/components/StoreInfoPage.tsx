import { motion } from 'framer-motion';
import { ChevronRight, Clock3, Headphones, Home, Leaf, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../store';
import { settings } from '../api';
import { formatTzs } from '../currency';

type Section = 'delivery' | 'how-it-works' | 'about' | 'help';

const content: Record<Section, { crumb: string; eyebrow: string; title: string; description: string; icon: typeof Truck; cards: { title: string; text: string; icon: typeof Truck }[] }> = {
  delivery: {
    crumb: 'Delivery areas',
    eyebrow: 'Delivery & pickup',
    title: 'Delivery areas',
    description: 'Choose delivery or pickup at checkout, add your address and select a preferred time slot. Review your delivery details and order total before placing your order.',
    icon: MapPin,
    cards: [
      { title: 'Delivery address', text: 'Enter your house, street, landmark and city at checkout. Add clear directions to help with your delivery.', icon: MapPin },
      { title: 'Preferred time slots', text: 'Choose a preferred delivery or pickup time from the checkout options.', icon: Clock3 },
      { title: 'Delivery or pickup', text: 'Review your chosen option and delivery fee before placing your order.', icon: Truck },
    ],
  },
  'how-it-works': {
    crumb: 'How to order',
    eyebrow: 'How to order · 3 simple steps',
    title: 'How FAMILY CHOICE SUPERMARKET works',
    description: 'From fresh produce to pantry staples, ordering your household essentials takes only a few steps.',
    icon: PackageCheck,
    cards: [
      { title: '1. Choose your items', text: 'Browse categories or use search to fill your cart.', icon: PackageCheck },
      { title: '2. Select delivery or pickup', text: 'Add your address and select a convenient delivery option.', icon: MapPin },
      { title: '3. Receive your order', text: 'We prepare your shopping and keep you updated on its progress.', icon: Truck },
    ],
  },
  about: {
    crumb: 'About us',
    eyebrow: 'About the store',
    title: 'About FAMILY CHOICE SUPERMARKET',
    description: 'FAMILY CHOICE SUPERMARKET brings groceries and household essentials together in one place, with prices in Tanzanian shillings and a clear order summary before checkout.',
    icon: Leaf,
    cards: [
      { title: 'Freshness first', text: 'We focus on everyday essentials and quality fresh products.', icon: Leaf },
      { title: 'Made for Tanzania', text: 'Prices, delivery information and support are tailored for local shoppers.', icon: MapPin },
      { title: 'Shop with confidence', text: 'Your account and checkout information are handled with care.', icon: ShieldCheck },
    ],
  },
  help: {
    crumb: 'Help & contact',
    eyebrow: 'Help & support',
    title: 'Help & contact',
    description: 'Find help with your FAMILY CHOICE SUPERMARKET orders, delivery preferences and account. Use My Account to review orders.',
    icon: Headphones,
    cards: [
      { title: 'Order support', text: 'View your current and past orders from My Account after signing in.', icon: PackageCheck },
      { title: 'Account help', text: 'Sign in to manage your account details and review your shopping history.', icon: Headphones },
    ],
  },
};

export function StoreInfoPage({ section }: { section: Section }) {
  const { navigate, settingsReady } = useStore();
  const page = content[section];
  const Icon = page.icon;
  // Same canvas accents as the sibling shells: ordering flow = pink.
  const heroBg = section === 'how-it-works' ? '#FFD9E3' : section === 'about' ? '#FFE9B0' : '#CFF3E4';

  return (
    <div className="fc-ref">
      {/* Reference hero: colored canvas, dot pattern, giant display type. */}
      <section className="relative overflow-hidden" style={{ backgroundColor: heroBg }} aria-labelledby="info-title">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
        <div className="relative store-container pt-4 pb-12 sm:pb-16">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
            <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-1 hover:text-primary"><Home className="w-3.5 h-3.5" /> Home</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-[#4A2618]">{page.crumb}</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">{page.eyebrow}</p>
          <h1 id="info-title" className="mt-4 max-w-4xl font-display text-[13vw] leading-[0.85] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[9vw] lg:text-[6.5vw]">
            {section === 'how-it-works'
              ? ['How FAMILY CHOICE', 'SUPERMARKET works.'].map((line, i) => (
                  <motion.span key={line} initial={{ y: '25%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }} className={i === 1 ? 'block text-primary' : 'block'}>{line}</motion.span>
                ))
              : <motion.span initial={{ y: '25%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">{page.title}.</motion.span>}
          </h1>
          <p className="mt-8 max-w-2xl text-[#4A2618]/75 sm:text-lg">{page.description}</p>
          {section !== 'help' && (
            <button
              onClick={() => navigate({ name: 'catalog' })}
              className="mt-8 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#4A2618] px-6 py-3.5 text-sm font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#2E170E]"
            >
              Shop now <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      </section>

      <div className="store-container space-y-14 py-14 sm:py-20">
        {section === 'delivery' && (
          <section className="rounded-[2rem] bg-[#FFF0F4] p-6 ring-1 ring-border sm:p-8" aria-labelledby="fee-panel-title">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-primary"><Truck className="size-5" /></span>
              <div>
                <h2 id="fee-panel-title" className="font-display text-2xl font-extrabold tracking-tighter text-[#4A2618] uppercase">Review fees before you order</h2>
                <p className="mt-2 text-[#4A2618]/75">
                  {settingsReady ? `Delivery costs ${formatTzs(settings.delivery_cents / 100)}. Pickup has no delivery fee.` : 'Review delivery fees in the order summary before placing your order.'}
                </p>
              </div>
            </div>
          </section>
        )}

        {section === 'how-it-works' && (
          <section className="grid items-start gap-10 md:grid-cols-3" aria-label="Ordering steps">
            {page.cards.map((card, i) => {
              const CardIcon = card.icon;
              return (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="space-y-3 rounded-3xl bg-card p-6 ring-1 ring-border"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD9E3] text-[#C2185B]"><CardIcon className="size-5" /></span>
                  <h2 className="font-display text-xl font-semibold text-[#4A2618]">{card.title}</h2>
                  <p className="text-sm text-[#4A2618]/70">{card.text}</p>
                </motion.article>
              );
            })}
          </section>
        )}

        {section !== 'how-it-works' && (
          <section className="grid gap-4 sm:grid-cols-3">
            {page.cards.map((card, i) => {
              const CardIcon = card.icon;
              return (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="space-y-3 rounded-3xl bg-card p-6 ring-1 ring-border"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#CFF3E4] text-[#0B7A5A]"><CardIcon className="size-5" /></span>
                  <h2 className="font-display text-xl font-semibold text-[#4A2618]">{card.title}</h2>
                  <p className="text-sm text-[#4A2618]/70">{card.text}</p>
                  {section === 'help' && (
                    <button
                      onClick={() => navigate({ name: 'account' })}
                      className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      {card.title.startsWith('Order') ? 'View my orders' : 'My Account'} <ChevronRight className="size-4" />
                    </button>
                  )}
                </motion.article>
              );
            })}
          </section>
        )}

        {section === 'help' && (
          <section aria-labelledby="faq-title">
            <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Quick answers</p>
            <h2 id="faq-title" className="mt-2 font-display text-3xl font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-4xl">Frequently asked</h2>
            <div className="mt-6 divide-y divide-border border-y border-border">
              {[
                ['Where can I see my orders?', 'Sign in to My Account to review current and previous orders.'],
                ['How do I choose delivery or pickup?', 'Choose your preferred option at checkout, then select a time slot and review the order details.'],
              ].map(([question, answer]) => (
                <details key={question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold text-[#4A2618]">
                    {question}
                    <ChevronRight className="size-4 shrink-0 text-primary transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
