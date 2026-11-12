import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, Home, MessageCircle, Minus, Plus, ShoppingBasket, Tag, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import { formatTzs } from '../currency';
import { whatsappLink } from '../storeConfig';
import { site } from '../site-data';
import { imageUrl } from '../images';
import { StoreLink } from './StoreLink';
import { ProductImage } from './ProductImage';

/** Reference EmptyBasket treatment — shared with CheckoutPage's empty state. */
export function EmptyBasket() {
  const { navigate } = useStore();
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 rounded-lg border border-dashed border-border p-12 text-center">
      <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
        <ShoppingBasket className="size-6" aria-hidden="true" />
      </div>
      <div className="max-w-sm space-y-2">
        <p className="font-display text-lg font-medium tracking-tight text-[#4A2618]">Your basket is empty</p>
        <p className="text-sm/relaxed text-muted-foreground">Add products from the shop and send everything in one order.</p>
      </div>
      <div className="flex w-full max-w-sm flex-row justify-center gap-4 text-sm">
        <button onClick={() => navigate({ name: 'catalog' })} className="inline-flex h-11 cursor-pointer items-center rounded-[10px] bg-primary px-5 font-semibold text-primary-foreground transition-colors hover:bg-primary/80">
          Browse products
        </button>
        <a href={site.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 cursor-pointer items-center rounded-[10px] bg-secondary px-5 font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">
          Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}

export function CartPage() {
  const { cart, cartSubtotal, cartSavings, updateQuantity, removeFromCart, navigate } = useStore();

  const requiresConfirmation = cart.some(item => item.product.orderable === false || item.product.stockStatus === 'unverified');
  const whatsappMessage = `Hello FAMILY CHOICE SUPERMARKET, I would like to order:\n${cart.map(item => `- ${item.quantity} x ${item.product.name} (${item.product.unit})`).join('\n')}\nSubtotal: ${formatTzs(cartSubtotal)}\nPlease confirm availability and delivery.`;

  return (
    <div className="fc-ref">
      {/* Reference cart hero: pink canvas, dot pattern, giant display type. */}
      <section className="relative overflow-hidden bg-[#FFD9E3]" aria-labelledby="cart-title">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
        <div className="relative store-container pt-4 pb-12 sm:pb-16">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-1.5 text-sm text-[#4A2618]/70">
            <button onClick={() => navigate({ name: 'home' })} className="flex items-center gap-1 hover:text-primary"><Home className="w-3.5 h-3.5" /> Home</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-[#4A2618]">Basket</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Your basket · Review before checkout</p>
          <h1 id="cart-title" className="mt-4 font-display text-[15vw] leading-[0.82] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[10vw] lg:text-[7.5vw]">
            <motion.span initial={{ y: '25%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="block">Your basket.</motion.span>
          </h1>
          <p className="mt-8 max-w-2xl text-[#4A2618]/75 sm:text-lg">
            Review your items and quantities, then continue to checkout to choose delivery or pickup, a time slot and how you'd like to pay.
          </p>
        </div>
      </section>

      <div className="store-container py-12 sm:py-16">
        {cart.length === 0 ? (
          <EmptyBasket />
        ) : (
          <>
            {requiresConfirmation && (
              <p role="status" className="mb-6 rounded-3xl bg-[#FFF0F4] p-4 text-sm text-[#4A2618] ring-1 ring-border">
                Store prices approved. Availability must be confirmed before ordering or payment.
              </p>
            )}
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <div className="min-w-0 space-y-3">
                {cart.map(({ product, quantity }) => (
                  <motion.article
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-4 rounded-3xl bg-card p-4 ring-1 ring-border"
                  >
                    <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-border">
                      <ProductImage src={imageUrl(product.image, 160)} width={64} height={64} alt={product.imageAlt ?? product.name} loading="lazy" decoding="async" className="h-full w-full object-contain" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-base leading-tight font-bold text-[#4A2618]" title={product.name}>{product.name}</h3>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">{product.unit}</p>
                      <p className="mt-1 font-display text-sm font-bold text-primary">{formatTzs(product.price * quantity)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Decrease ${product.name} quantity`}
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span aria-label={`Quantity of ${product.name}`} className="w-6 text-center font-display text-sm font-bold">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${product.name} quantity`}
                          disabled={quantity >= (product.stock ?? 100)}
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${product.name} from cart`}
                        onClick={() => removeFromCart(product.id)}
                        className="flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </button>
                    </div>
                  </motion.article>
                ))}
              </div>

              <div className="space-y-6 rounded-[2rem] bg-card p-6 ring-1 ring-border lg:sticky lg:top-36">
                <div>
                  <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Summary</p>
                  {cartSavings > 0 && (
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-1.5 text-primary"><Tag className="size-4" /> You're saving</span>
                      <span className="font-semibold text-primary">-{formatTzs(cartSavings)}</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="font-display text-2xl font-extrabold text-[#4A2618]">{formatTzs(cartSubtotal)}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {requiresConfirmation
                      ? 'Availability must be confirmed before ordering or payment. Delivery and taxes are calculated at checkout.'
                      : 'Delivery and taxes are calculated at checkout.'}
                  </p>
                </div>
                <div className="space-y-3 border-t border-border pt-5">
                  <StoreLink
                    to={{ name: 'checkout' }}
                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/80"
                  >
                    Proceed to checkout <ArrowRight className="size-4" />
                  </StoreLink>
                  <a
                    href={whatsappLink(whatsappMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-[#25D366] text-sm font-bold text-[#128C4A] transition-colors hover:bg-[#25D366] hover:text-white"
                  >
                    <MessageCircle className="size-4" /> Send this order on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
