import { motion } from 'framer-motion';
import { ChevronRight, Home, ShieldCheck } from 'lucide-react';
import { useStore } from '../store';

export function PrivacyPage() {
  const { navigate } = useStore();

  return (
    <div className="fc-ref">
      {/* Reference hero: pink canvas, dot pattern, giant display type. */}
      <section className="relative overflow-hidden bg-[#FFD9E3]" aria-labelledby="privacy-title">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
        <div className="relative store-container pt-4 pb-12 sm:pb-16">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
            <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-1 hover:text-primary"><Home className="w-3.5 h-3.5" /> Home</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-[#4A2618]">Privacy Notice</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Privacy · Your data, your choices</p>
          <h1 id="privacy-title" className="mt-4 font-display text-[15vw] leading-[0.82] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[10vw] lg:text-[7.5vw]">
            <motion.span initial={{ y: '25%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">Privacy notice.</motion.span>
          </h1>
          <p className="mt-8 max-w-2xl text-[#4A2618]/75 sm:text-lg">
            We use only what we need to create your account, fulfil orders and support you — and we tell you exactly how.
          </p>
        </div>
      </section>

      <div className="reading-container py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[2rem] bg-card p-6 ring-1 ring-border sm:p-10"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#FFD9E3] text-primary"><ShieldCheck className="size-5" /></div>
            <div>
              <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Last updated</p>
              <p className="text-sm text-muted-foreground">8 October 2026</p>
            </div>
          </div>
          <div className="space-y-8">
            {[
              { title: 'Information we use', paras: ['We use your name, email address, phone number, delivery details and order history to create your account, fulfill orders, handle payments and provide customer support.'] },
              { title: 'Who can access it', paras: ['Authorised store staff can access the information needed to prepare, deliver and support your order. Administrative changes to products and orders are recorded for accountability.', 'When you pay using Selcom mobile money, your name, email address, payment phone number and order amount are shared with Selcom to process the payment. The saved payment phone number is masked in our payment records. Your delivery contact number is kept separately for fulfilling your order.'] },
              { title: 'How long we keep it', paras: ['We retain order and payment records only for as long as required for operations, tax, accounting and legal obligations.'] },
              { title: 'Your choices', paras: ['You can ask about your account information or request erasure from My Account. Some order records may need to be retained where the law requires it. We will verify requests before taking action.'] },
              { title: 'Contact', paras: ['Manage your account information and submit a data-erasure request from My Account.'] },
            ].map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-xl font-bold tracking-tight text-[#4A2618]">{section.title}</h2>
                {section.paras.map((para) => (
                  <p key={para} className="mt-2 text-sm leading-relaxed text-[#4A2618]/75">{para}</p>
                ))}
              </section>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
