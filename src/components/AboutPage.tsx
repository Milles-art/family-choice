import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronRight, ClipboardCheck, Home, Mail, MapPin, MessageCircle, Phone, ShoppingBasket, Truck } from 'lucide-react';
import { StoreLink } from './StoreLink';
import { useStore } from '../store';
import { storeConfig } from '../storeConfig';
import { site } from '../site-data';

// Reference facts row — family-choice principles, reference icon-card treatment.
const principles = [
  { Icon: ShoppingBasket, title: 'One place for your list', text: 'Browse produce, pantry staples, bakery favourites and household essentials.' },
  { Icon: ClipboardCheck, title: 'Clear before checkout', text: 'Review groceries, delivery and tax separately before ordering.' },
  { Icon: Truck, title: 'Your choice, every time', text: 'Choose delivery or pickup at checkout.' },
];

function AboutPhoto({ name, alt, eager = false }: { name: string; alt: string; eager?: boolean }) {
  return (
    <motion.figure
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="m-0 aspect-[4/3] w-full overflow-hidden rounded-[2rem] shadow-xl ring-1 ring-border"
    >
      <img src={`/images/about/${name}-1280.webp`} srcSet={[640,1280,1536].map(width => `/images/about/${name}-${width}.webp ${width}w`).join(', ')} sizes="(min-width: 768px) 50vw, 100vw" width={1536} height={1024} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchpriority={eager ? 'high' : 'low'} decoding="async" className="h-full w-full object-cover"/>
    </motion.figure>
  );
}

export function AboutPage() {
  const { navigate } = useStore();
  return <div className="about-page fc-ref">
    {/* Reference hero: yellow canvas, dot pattern, giant display type. */}
    <section className="relative overflow-hidden bg-[#FFE9B0]" aria-labelledby="about-title">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true"/>
      <div className="relative store-container pt-4 pb-12 sm:pb-16">
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
          <button onClick={() => navigate({name:'home'})} className="flex items-center gap-1 hover:text-primary"><Home className="w-3.5 h-3.5"/> Home</button>
          <ChevronRight className="w-3.5 h-3.5"/>
          <span className="font-medium text-[#4A2618]">About us</span>
        </nav>
        <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Our story · Mafiga Shell, Morogoro</p>
        <h1 id="about-title" className="mt-4 font-display text-[15vw] leading-[0.82] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[10vw] lg:text-[7.5vw]">
          {['Groceries for', 'everyday life.'].map((line, i) => (
            <motion.span key={line} initial={{y:'25%'}} animate={{y:0}} transition={{duration:0.8, ease:[0.22, 1, 0.36, 1], delay:i * 0.1}} className={i === 1 ? 'block text-primary' : 'block'}>{line}</motion.span>
          ))}
        </h1>
        <p className="mt-8 max-w-2xl text-[#4A2618]/75 sm:text-lg">
          Fresh ingredients, cupboard favourites and the essentials that keep your household going. FAMILY CHOICE SUPERMARKET brings your everyday shop together in one place.
        </p>
      </div>
    </section>

    <div className="store-container space-y-14 py-16 sm:py-24">
      {/* Who we are — two-column feature with dark CTA pills. */}
      <div className="grid items-center gap-10 md:grid-cols-2">
        <AboutPhoto name="family-shopping" alt="Illustrative scene of a family choosing vegetables together in a supermarket"/>
        <motion.div initial={{opacity:0, y:30}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.6, delay:0.1}} className="space-y-4">
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Who we are</p>
          <h2 className="font-display text-4xl leading-[0.95] font-extrabold tracking-tighter text-[#4A2618] uppercase md:text-5xl">
            From the kitchen cupboard to the family table.
          </h2>
          <p className="text-[#4A2618]/75">A weekly grocery list. Ingredients for tonight's meal. A few things for the home. Shop the categories you need and review your basket at your own pace.</p>
          <p className="text-[#4A2618]/75">Prices are shown in Tanzanian shillings, with pack sizes and stock information alongside each product.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <StoreLink to={{name:'catalog'}} className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#4A2618] px-6 py-3.5 text-sm font-bold tracking-wider text-white uppercase transition-colors hover:bg-[#2E170E]">
              Explore the shop <ArrowUpRight className="size-4"/>
            </StoreLink>
            <StoreLink to={{name:'info', section:'how-it-works'}} className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[#4A2618] px-6 py-3.5 text-sm font-bold tracking-wider text-[#4A2618] uppercase transition-colors hover:bg-[#4A2618] hover:text-white">
              See how to order <ArrowUpRight className="size-4"/>
            </StoreLink>
          </div>
        </motion.div>
      </div>

      {/* Three principles as reference icon cards. */}
      <div className="grid gap-4 sm:grid-cols-3">
        {principles.map(({ Icon, title, text }, i) => (
          <motion.div key={title} initial={{opacity:0, y:40}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{duration:0.5, delay:i * 0.1}} whileHover={{y:-6}} className="space-y-3 rounded-3xl bg-card p-6 ring-1 ring-border">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD9E3] text-[#C2185B]"><Icon className="size-5"/></span>
            <p className="font-display text-xl font-semibold text-[#4A2618]">{title}</p>
            <p className="text-sm text-[#4A2618]/70">{text}</p>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">{site.name} · {site.address} · {site.hours}</p>
    </div>

    {/* Dark contact block — reference find-us card treatment, family-choice contact features. */}
    <section className="store-container pb-16 sm:pb-24" aria-labelledby="about-contact-title">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#4A2618] p-6 text-white sm:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true"/>
        <div className="relative max-w-2xl space-y-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#FFD9E3] text-[#C2185B]"><MessageCircle className="size-5"/></span>
          <div>
            <p className="text-xs font-bold tracking-[0.25em] text-[#FFB3C7] uppercase">Get in touch</p>
            <h2 id="about-contact-title" className="mt-2 font-display text-3xl font-extrabold tracking-tighter uppercase sm:text-4xl">Let's stay in touch.</h2>
          </div>
          <div className="space-y-3 text-white/70">
            <p className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[#FFB3C7]"/>{storeConfig.address}</p>
            <p className="flex items-start gap-3"><Phone className="mt-0.5 size-4 shrink-0 text-[#FFB3C7]"/><a href={site.phoneHref} className="cursor-pointer text-white">{site.phoneDisplay}</a></p>
            {storeConfig.contactEmail && <p className="flex items-start gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-[#FFB3C7]"/><a href={`mailto:${storeConfig.contactEmail}`} className="cursor-pointer text-white">{site.email}</a></p>}
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={site.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold tracking-wider text-[#4A2618] uppercase transition-colors hover:bg-white/90">
              <MessageCircle className="size-4"/> Chat on WhatsApp
            </a>
            <StoreLink to={{name:'info', section:'delivery'}} className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-white/40 px-6 py-3.5 text-sm font-bold tracking-wider text-white uppercase transition-colors hover:bg-white/10">
              Delivery &amp; pickup information
            </StoreLink>
          </div>
        </div>
      </div>
    </section>
  </div>;
}
