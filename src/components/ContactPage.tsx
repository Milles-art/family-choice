import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown, ChevronRight, Clock, Globe, Home, Mail, MapPin, MessageCircle, Phone, Send, ShoppingBag, Truck } from 'lucide-react';
import { useStore } from '../store';
import { EditorialImage } from './EditorialImage';
import { storeConfig, whatsappLink } from '../storeConfig';
import { site } from '../site-data';

// shadcn input/textarea/button as the reference renders them, adapted to Tailwind v3
// (no ring-3/shadow-xs in v3 — ring-2/shadow-sm are the equivalents).
const INPUT = 'w-full min-w-0 border border-input bg-card px-5 text-base shadow-sm transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 h-11 rounded-full';
const TEXTAREA = INPUT.replace('h-11 rounded-full', 'min-h-36 rounded-3xl py-3');
const BUTTON_BASE = 'group/button inline-flex shrink-0 items-center justify-center gap-2 border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0';
const BUTTON_PRIMARY = `${BUTTON_BASE} bg-primary text-primary-foreground hover:bg-primary/80 h-11 rounded-full px-6 text-sm`;
const BUTTON_MUTED = `${BUTTON_BASE} bg-muted text-foreground hover:bg-secondary h-11 rounded-full px-6 text-sm`;
const BUTTON_SUBMIT = `${BUTTON_BASE} bg-primary text-primary-foreground hover:bg-primary/80 h-12 rounded-full px-7 text-base`;

type Method = { Icon: typeof Phone; title: string; text: string; href: string; external?: boolean };

const methods: Method[] = [
  { Icon: Phone, title: 'Call us', text: site.phoneDisplay, href: site.phoneHref },
  { Icon: MessageCircle, title: 'WhatsApp', text: 'Quickest way to order', href: site.whatsappHref, external: true },
  ...(storeConfig.contactEmail ? [{ Icon: Mail, title: 'Email', text: storeConfig.contactEmail, href: `mailto:${storeConfig.contactEmail}` }] : []),
  { Icon: MapPin, title: 'Visit the store', text: storeConfig.address, href: storeConfig.mapUrl, external: true },
];

const shortcuts = [
  { Icon: ShoppingBag, title: 'Orders & account', text: 'Sign in to see your current and previous orders.', go: { name: 'account' } as const },
  { Icon: Truck, title: 'Delivery & pickup', text: 'Review delivery fees and checkout options.', go: { name: 'info', section: 'delivery' } as const },
];

const faqs: [string, string][] = [
  ['Where can I find my order?', 'Sign in to My Account to see your order number, items, order status and payment status.'],
  ['How do I choose delivery or pickup?', 'Choose your preferred option at checkout, enter the required details and select a time slot. Review the delivery fee and total before placing your order.'],
  ['Has my payment been confirmed?', 'Check the payment status in your account. Your order confirmation means we have received your order; it does not confirm payment. Cash payment is due on delivery or pickup.'],
  ['What should I include when contacting you?', 'Share your order number and a short description of your question. Never send your account password or mobile-money PIN.'],
];

export function ContactPage() {
  const { navigate } = useStore();
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const update = (field: 'name' | 'contact' | 'message') => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(current => ({ ...current, [field]: event.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.contact.trim() || !form.message.trim()) {
      setError('Please fill in your name, contact details and message.');
      return;
    }
    setError('');
    const text = ['Hello Family Choice!', `Name: ${form.name.trim()}`, `Contact: ${form.contact.trim()}`, `Message: ${form.message.trim()}`].join('\n');
    window.open(whatsappLink(text), '_blank', 'noopener');
    setSent(true);
  };

  return <div className="contact-page fc-ref">
    {/* Reference hero: mint canvas, dot pattern, giant display type. */}
    <section className="relative overflow-hidden bg-[#CFF3E4]" aria-labelledby="contact-title">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true"/>
      <div className="relative store-container pt-4 pb-12 sm:pb-16">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
          <button onClick={() => navigate({name:'home'})} className="flex items-center gap-1 hover:text-primary"><Home className="w-3.5 h-3.5"/> Home</button>
          <ChevronRight className="w-3.5 h-3.5"/>
          <span className="font-medium text-[#4A2618]">Help &amp; contact</span>
        </nav>
        <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Contact · We reply during opening hours</p>
        <h1 id="contact-title" className="mt-4 font-display text-[15vw] leading-[0.82] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[10vw] lg:text-[7.5vw]">
          {["Let's make your", 'shopping easier.'].map((line, i) => (
            <motion.span key={line} initial={{y:'25%'}} animate={{y:0}} transition={{duration:0.8, ease:[0.22, 1, 0.36, 1], delay:i * 0.1}} className={i === 1 ? 'block text-primary' : 'block'}>{line}</motion.span>
          ))}
        </h1>
        <div className="mt-8 max-w-2xl space-y-3">
          <p className="text-[#4A2618]/75 sm:text-lg">Have a question about your order, groceries or delivery? Get in touch with FAMILY CHOICE SUPERMARKET.</p>
          <p className="text-sm text-[#4A2618]/70">For an existing order, have your order number ready.</p>
        </div>
      </div>
    </section>

    <div className="store-container space-y-6 py-12 sm:py-16">
      {/* Reference method cards — call / WhatsApp / email (conditional) / visit. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Contact options">
        {methods.map(({ Icon, title, text, href, external }, i) => (
          <motion.a key={title} href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} initial={{opacity:0, y:40}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5, delay:i * 0.1}} whileHover={{y:-6}} className="space-y-3 rounded-3xl bg-card p-6 ring-1 ring-border transition-shadow hover:shadow-xl">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD9E3] text-[#C2185B]"><Icon className="size-5"/></span>
            <p className="font-display text-xl font-semibold text-[#4A2618]">{title}</p>
            <p className="break-words text-sm text-[#4A2618]/70">{text}</p>
          </motion.a>
        ))}
      </div>

      {/* WhatsApp compose form + dark find-us card. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-card p-6 ring-1 ring-border sm:p-10">
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Send a message</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-4xl">Drop us a line</h2>

          {sent ? (
            <div className="mt-8 space-y-4 rounded-3xl bg-[#DDF5D0] p-6 text-[#2F6B1F]">
              <span className="grid size-11 place-items-center rounded-2xl bg-white"><Check className="size-5"/></span>
              <p className="font-display text-xl font-bold">Message ready in WhatsApp!</p>
              <p className="text-sm">We reply during opening hours — {site.hours}. If WhatsApp did not open, tap the button below.</p>
              <div className="flex flex-wrap gap-3">
                <a href={site.whatsappHref} target="_blank" rel="noreferrer" className={BUTTON_PRIMARY}><MessageCircle className="size-4"/> Open WhatsApp</a>
                <button type="button" onClick={() => { setSent(false); setForm({ name: '', contact: '', message: '' }); }} className={BUTTON_MUTED}>Send another</button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-sm font-medium">Your name</label>
                <input id="contact-name" value={form.name} onChange={update('name')} placeholder="e.g. Amina" data-slot="input" className={INPUT}/>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-detail" className="text-sm font-medium">Phone or email</label>
                <input id="contact-detail" value={form.contact} onChange={update('contact')} placeholder="So we can reply to you" data-slot="input" className={INPUT}/>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-sm font-medium">Message</label>
                <textarea id="contact-message" value={form.message} onChange={update('message')} placeholder="How can we help?" data-slot="textarea" className={TEXTAREA}/>
              </div>
              {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
              <button type="submit" data-slot="button" className={BUTTON_SUBMIT}><Send className="size-4"/> Send on WhatsApp</button>
            </form>
          )}
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[#4A2618] p-6 text-white sm:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true"/>
          <div className="relative space-y-6">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD9E3] text-[#C2185B]"><MapPin className="size-5"/></span>
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-[#FFB3C7] uppercase">Find us</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tighter uppercase sm:text-4xl">Mafiga Shell, Morogoro.</h2>
            </div>
            <div className="space-y-3 text-white/70">
              <p className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[#FFB3C7]"/>{storeConfig.address}</p>
              <p className="flex items-start gap-3"><Clock className="mt-0.5 size-4 shrink-0 text-[#FFB3C7]"/>{site.hours}</p>
              <p className="flex items-start gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-[#FFB3C7]"/><a href={site.phoneHref} className="cursor-pointer py-2 text-white">{site.phoneDisplay}</a></p>
              {storeConfig.contactEmail && <p className="flex items-start gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-[#FFB3C7]"/><a href={`mailto:${storeConfig.contactEmail}`} className="cursor-pointer py-2 text-white">{site.email}</a></p>}
              <p className="flex items-start gap-3"><Globe className="mt-0.5 size-4 shrink-0 text-[#FFB3C7]"/><a href="https://familychoiceminimarket.co.tz" target="_blank" rel="noreferrer" className="cursor-pointer py-2 text-white">familychoiceminimarket.co.tz</a></p>
            </div>
            <a href={storeConfig.mapUrl} target="_blank" rel="noreferrer" className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold tracking-wider text-[#4A2618] uppercase transition-colors hover:bg-white/90">
              <MapPin className="size-4"/> Open in Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* Self-service shortcuts. */}
      <section aria-labelledby="contact-help-title">
        <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Help centre</p>
        <h2 id="contact-help-title" className="mt-2 font-display text-3xl font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-4xl">Find what you need</h2>
        <p className="mt-3 max-w-2xl text-[#4A2618]/75">Check your order or review delivery information before getting in touch.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {shortcuts.map(({ Icon, title, text, go }) => (
            <button key={title} onClick={() => navigate(go)} className="group flex items-center gap-4 rounded-3xl bg-card p-5 text-left ring-1 ring-border transition-shadow hover:shadow-xl">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#FFD9E3] text-[#C2185B]"><Icon className="size-5"/></span>
              <span className="min-w-0 flex-1">
                <strong className="block font-display text-lg font-semibold text-[#4A2618]">{title}</strong>
                <span className="mt-1 block text-sm text-[#4A2618]/70">{text}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-[#4A2618]/50 transition-transform group-hover:translate-x-1"/>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ photo + answers. */}
      <section className="grid items-start gap-10 lg:grid-cols-2" aria-labelledby="contact-answers-title">
        <figure className="m-0 aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-border">
          <EditorialImage name="delivery-home-handover-concept" alt="Illustrative scene of a grocery bag being handed over at a home" className="h-full w-full object-cover" sizes="(min-width: 1024px) 50vw, 100vw"/>
        </figure>
        <div>
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Good to know</p>
          <h2 id="contact-answers-title" className="mt-2 font-display text-3xl font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-4xl">A few quick answers</h2>
          <div className="mt-6">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group border-b border-[#efd9cd]">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-[#4A2618] [&::-webkit-details-marker]:hidden">
                  {question}
                  <ChevronDown className="size-4 shrink-0 text-[#4A2618]/50 transition-transform group-open:rotate-180" aria-hidden="true"/>
                </summary>
                <p className="pb-4 text-sm leading-relaxed text-[#4A2618]/75">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  </div>;
}
