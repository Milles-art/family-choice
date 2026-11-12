import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Home, MapPin, ShoppingBag, Truck } from 'lucide-react';
import { useStore } from '../store';
import { settings } from '../api';
import { formatTzs } from '../currency';
import { EditorialImage } from './EditorialImage';
import { DeliveryAreaChecker } from './DeliveryAreaChecker';
import { storeConfig } from '../storeConfig';

const options = [
  { Icon: Truck, title: 'Delivery to your address', text: 'We deliver within Morogoro only. Add your house, street and landmark at checkout so we can find you.', span: null as string | null, cta: null as null | { label: string; onClick: () => void } },
  { Icon: ShoppingBag, title: 'Collect your groceries', text: 'Choose pickup at checkout. Pickup arrangements are confirmed by the store.', span: 'No delivery fee for pickup.', cta: null },
  { Icon: MapPin, title: 'Check your area', text: 'Our delivery area is Morogoro. Contact us with your neighbourhood and directions to arrange delivery.', span: null, cta: { label: 'Ask about your address', onClick: () => {} } },
];

const steps = [
  { title: 'Choose your groceries', text: 'Browse the shop, select your quantities and add items to your cart.' },
  { title: 'Arrange delivery or pickup', text: `${storeConfig.deliveryTiming} Your checkout time slot is a preference, confirmed by the store.` },
  { title: 'Review and place your order', text: 'Check your items, fees and payment method. Once your order is received, you can find its details in your account. Payment status is shown separately.' },
  { title: 'Follow your order', text: 'Check your account for order and payment status. Cash is due on delivery or pickup; a mobile-money reference awaits staff confirmation.' },
];

export function DeliveryPage() {
  const { navigate, settingsReady, settingsError, retrySettings } = useStore();
  return (
    <div className="fc-ref delivery-page">
      {/* Reference hero: mint canvas, dot pattern, giant display type. */}
      <section className="relative overflow-hidden bg-[#CFF3E4]" aria-labelledby="delivery-title">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
        <div className="relative store-container pt-4 pb-12 sm:pb-16">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
            <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-1 hover:text-primary"><Home className="w-3.5 h-3.5" /> Home</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-[#4A2618]">Delivery &amp; pickup</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Delivery &amp; pickup · Morogoro only</p>
          <h1 id="delivery-title" className="mt-4 font-display text-[15vw] leading-[0.82] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[10vw] lg:text-[7.5vw]">
            {['Your groceries.', 'Your way.'].map((line, i) => (
              <motion.span key={line} initial={{ y: '25%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 }} className={i === 1 ? 'block text-primary' : 'block'}>{line}</motion.span>
            ))}
          </h1>
          <p className="mt-8 max-w-2xl text-[#4A2618]/75 sm:text-lg">
            Order online with FAMILY CHOICE SUPERMARKET. Choose delivery or pickup, then review your details and total before placing your order.
          </p>
        </div>
      </section>

      <div className="store-container space-y-14 py-14 sm:py-20">
        {/* Photo + start CTA — reference two-column feature. */}
        <div className="grid items-center gap-10 md:grid-cols-2">
          <motion.figure
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="m-0 aspect-[3/2] w-full overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-border"
          >
            <EditorialImage name="delivery-home-handover-concept" alt="Illustrative scene of groceries being handed over at a home" eager sizes="(min-width: 768px) 50vw, 100vw" className="h-full" />
          </motion.figure>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="space-y-4">
            <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Start your order</p>
            <h2 className="font-display text-4xl leading-[0.95] font-extrabold tracking-tighter text-[#4A2618] uppercase md:text-5xl">
              We bring the shop to your door.
            </h2>
            <p className="text-[#4A2618]/75">Build your basket at your own pace, pick a time slot and review groceries, delivery and tax separately before you order.</p>
            <button
              onClick={() => navigate({ name: 'catalog' })}
              className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#4A2618] px-6 py-3.5 text-sm font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#2E170E]"
            >
              Start your order <ArrowRight className="size-4" />
            </button>
          </motion.div>
        </div>

        {/* Three options — reference icon cards. */}
        <section aria-label="Delivery and pickup options" className="grid gap-4 sm:grid-cols-3">
          {options.map(({ Icon, title, text, span, cta }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="space-y-3 rounded-3xl bg-card p-6 ring-1 ring-border"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-[#CFF3E4] text-[#0B7A5A]"><Icon className="size-5" /></span>
              <h2 className="font-display text-xl font-semibold text-[#4A2618]">{title}</h2>
              <p className="text-sm text-[#4A2618]/70">{text}</p>
              {span && <p className="text-sm font-semibold text-primary">{span}</p>}
              {cta && (
                <button
                  onClick={() => navigate({ name: 'info', section: 'help' })}
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 text-left text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  {cta.label} <ArrowRight className="size-4" />
                </button>
              )}
            </motion.div>
          ))}
        </section>

        <DeliveryAreaChecker />

        {/* Fees — reference two-column, display headings. */}
        <section className="grid items-start gap-10 md:grid-cols-2" aria-labelledby="delivery-fees-title">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-4">
            <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Transparent pricing</p>
            <h2 id="delivery-fees-title" className="font-display text-4xl leading-[0.95] font-extrabold tracking-tighter text-[#4A2618] uppercase md:text-5xl">
              Clear fees.<br />Before you order.
            </h2>
            <p className="max-w-md text-[#4A2618]/75">Your checkout shows groceries, delivery, tax and the total separately.</p>
          </motion.div>
          <div>
            {settingsError && (
              <div className="delivery-setting-error mb-4 rounded-2xl border border-border bg-[#FFF9F2] p-4" role="status">
                <p>Delivery information could not be refreshed.{settingsReady ? ' Showing the last available fees.' : ''}</p>
                <button className="min-h-[44px] font-semibold text-primary underline" onClick={retrySettings}>Retry delivery information</button>
              </div>
            )}
            {settingsReady ? (
              <dl className="border-y border-border">
                <div className="flex items-center justify-between gap-6 border-b border-border py-5 last:border-b-0">
                  <dt className="text-muted-foreground">Delivery fee</dt>
                  <dd className="font-display text-xl font-bold whitespace-nowrap text-[#4A2618]">{formatTzs(settings.delivery_cents / 100)}</dd>
                </div>
                <div className="flex items-center justify-between gap-6 py-5">
                  <dt className="text-muted-foreground">Pickup delivery fee</dt>
                  <dd className="font-display text-xl font-bold whitespace-nowrap text-[#4A2618]">{formatTzs(0)}</dd>
                </div>
              </dl>
            ) : !settingsError && (
              <div className="delivery-fee-skeleton grid gap-4" role="status" aria-label="Loading delivery fees">
                <div className="skeleton h-12 rounded-lg" />
                <div className="skeleton h-12 rounded-lg" />
                <div className="skeleton h-12 rounded-lg" />
              </div>
            )}
          </div>
        </section>

        {/* Ordering steps — reference numbered list. */}
        <section className="grid items-start gap-10 md:grid-cols-2" aria-labelledby="delivery-ordering-title">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-4">
            <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">How it works</p>
            <h2 id="delivery-ordering-title" className="font-display text-4xl leading-[0.95] font-extrabold tracking-tighter text-[#4A2618] uppercase md:text-5xl">
              Online ordering,<br />step by step.
            </h2>
            <p className="max-w-md text-[#4A2618]/75">Build your basket at your own pace. Sign in to place your order and follow it from your account.</p>
            <button
              onClick={() => navigate({ name: 'account' })}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 font-semibold text-primary transition-colors hover:text-primary/80"
            >
              View your orders <ArrowRight className="size-4" />
            </button>
          </motion.div>
          <ol className="space-y-0">
            {steps.map((step, i) => (
              <motion.li
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="relative flex gap-4 pb-6 last:pb-0"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[#efd9cd] bg-[#FFF0F4] font-display text-sm font-bold text-primary">{i + 1}</span>
                <div className="pt-1">
                  <h3 className="font-display text-lg font-bold text-[#4A2618]">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* Help CTA — reference dark block treatment. */}
        <section aria-labelledby="delivery-question-title">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#4A2618] p-6 text-white sm:p-10">
            <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold tracking-[0.25em] text-[#FFB3C7] uppercase">We're here to help</p>
                <h2 id="delivery-question-title" className="mt-2 font-display text-3xl font-extrabold tracking-tighter uppercase sm:text-4xl">Need help arranging your order?</h2>
                <p className="mt-3 text-white/70">Contact the store with your address or order number.</p>
              </div>
              <button
                onClick={() => navigate({ name: 'info', section: 'help' })}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold tracking-wider text-[#4A2618] uppercase transition-colors hover:bg-white/90"
              >
                Help &amp; contact <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
