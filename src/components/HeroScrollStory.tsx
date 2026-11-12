import { useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { ArrowDown, ArrowUpRight, Check, IceCreamCone } from 'lucide-react';
import { heroCards, images, site } from '../site-data';

/** Scroll windows for each of the four hero stages: [enter, hold-until]. */
const STAGES: [number, number][] = [
  [0, 0.22],
  [0.26, 0.48],
  [0.52, 0.74],
  [0.78, 1],
];

/**
 * Reproduces the original stage interpolation: content eases in from y=60,
 * holds, then leaves through y=-60 — except the first stage which starts
 * already visible and the last which never leaves.
 *
 * Tailwind v3 compiles translate utilities into `transform`, which an inline
 * framer-motion transform would clobber — so every stage is wrapped in a
 * static positioning div and only the animated layer lives on the motion node.
 */
function useStageStyle(progress: MotionValue<number>, index: number) {
  const [n, r] = STAGES[index];
  const isFirst = index === 0;
  const isLast = index === STAGES.length - 1;

  const input = isFirst
    ? [0, r - 0.02, r + 0.04]
    : isLast
      ? [n - 0.04, n + 0.02, 1]
      : [n - 0.04, n + 0.02, r - 0.02, r + 0.04];
  const opacityRange = isFirst ? [1, 1, 0] : isLast ? [0, 1, 1] : [0, 1, 1, 0];
  const yRange = isFirst ? [0, 0, -60] : isLast ? [60, 0, 0] : [60, 0, 0, -60];

  const opacity = useTransform(progress, input, opacityRange);
  const y = useTransform(progress, input, yRange);
  const pointerEvents = useTransform(opacity, (value): CSSProperties['pointerEvents'] =>
    value > 0.5 ? 'auto' : 'none',
  );

  return { opacity, y, pointerEvents };
}

function FloatingCard({ index, progress, item }: { index: number; progress: MotionValue<number>; item: (typeof heroCards)[number] }) {
  const start = 0.76 + index * 0.03;
  const y = useTransform(progress, [start, start + 0.06], [120, 0]);

  return (
    <motion.div style={{ y }} className={`shrink-0 ${item.className}`}>
      <a
        href="#flavors"
        className="group block w-40 cursor-pointer overflow-hidden rounded-2xl bg-card shadow-2xl shadow-primary/15 ring-1 ring-border transition-transform hover:-translate-y-1 sm:w-48 lg:w-60"
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={item.image}
            alt={`${item.name} ice cream`}
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-3 lg:p-4">
          <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
            Ice cream
          </span>
          <p className="mt-1 line-clamp-1 font-display text-sm font-bold lg:text-base">
            {item.name}
          </p>
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-muted-foreground">
            {item.tagline}
          </p>
        </div>
      </a>
    </motion.div>
  );
}

function RoundBadge({ text, center, className, id }: { text: string; center: string; className: string; id: string }) {
  return (
    <div className={`size-28 place-items-center rounded-full ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      >
        <defs>
          <path
            id={id}
            d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"
          />
        </defs>
        <text className="fill-current text-[10px] font-bold tracking-[0.18em] uppercase">
          <textPath href={`#${id}`}>
            {text} • {text} •{' '}
          </textPath>
        </text>
      </motion.svg>
      <span className="font-display text-2xl leading-none font-extrabold">{center}</span>
    </div>
  );
}

export function HeroScrollStory() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const [activeStage, setActiveStage] = useState(0);

  const stage0 = useStageStyle(scrollYProgress, 0);
  const stage1 = useStageStyle(scrollYProgress, 1);
  const stage2 = useStageStyle(scrollYProgress, 2);
  const stage3 = useStageStyle(scrollYProgress, 3);

  // Background washes through cream → pink → yellow → mint → cream.
  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    ['#FFF5EC', '#FFD9E3', '#FFE9B0', '#CFF3E4', '#FFF5EC'],
  );
  const imageScale = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [1, 1.25, 1.1, 0.9, 0.85]);
  const imageRotate = useTransform(scrollYProgress, [0, 0.25, 0.5, 0.75, 1], [-6, 6, -4, 0, -3]);
  const imageX = useTransform(scrollYProgress, [0, 0.5, 0.75, 1], ['0%', '0%', '-35%', '0%']);
  const shineX = useTransform(scrollYProgress, [0.2, 0.35], ['-120%', '220%']);
  const progressBar = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const index = STAGES.findIndex(([, end]) => value <= end + 0.02);
    setActiveStage(index === -1 ? STAGES.length - 1 : index);
  });

  return (
    <section
      ref={ref}
      aria-label="Why our ice cream is the best seller"
      className="relative h-[480vh]"
    >
      <motion.div
        style={{ backgroundColor }}
        className="sticky top-0 h-[100svh] overflow-hidden"
      >
        {/* dotted paper texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#4A2618_1px,transparent_1px)] [background-size:22px_22px]" />
        {/* centre glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.6),transparent_60%)]" />

        {/* stage 1 — outline word */}
        <motion.div
          style={stage1}
          className="pointer-events-none absolute inset-0 grid place-items-center"
        >
          <p className="font-display text-[26vw] leading-none font-extrabold tracking-tighter whitespace-nowrap text-transparent uppercase [-webkit-text-stroke:2px_rgba(194,24,91,0.35)] lg:text-[20vw]">
            Scoop it
          </p>
        </motion.div>

        {/* the sundae — static wrapper holds the centreing, motion layer holds scale/rotate/x */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[min(58vh,560px)] -translate-x-1/2 -translate-y-1/2 max-lg:top-[54%] max-lg:h-[40vh]">
          <motion.div
            style={{ scale: imageScale, rotate: imageRotate, x: imageX }}
            className="relative h-full"
          >
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative h-full"
            >
              <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.75),transparent_65%)]" />
              <img
                src={images.sundae}
                alt="Strawberry, vanilla and chocolate ice cream sundae"
                decoding="async"
                width="560"
                height="560"
                className="relative h-full w-auto mix-blend-multiply [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_72%)]"
              />
              <div className="absolute inset-0 overflow-hidden rounded-full opacity-60">
                <div className="h-full w-1/2 -skew-x-12">
                  <motion.div
                    style={{ x: shineX }}
                    className="h-full w-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* stage 0 — headline */}
        <div className="absolute inset-x-5 top-24 sm:inset-x-10 lg:top-1/2 lg:right-auto lg:max-w-[40vw] lg:-translate-y-1/2">
          <motion.div style={stage0}>
            <p className="mb-4 flex items-center gap-2 text-xs font-bold tracking-[0.25em] text-primary uppercase">
              <IceCreamCone className="size-4" /> Our #1 best seller
            </p>
            <h1 className="font-display text-[13vw] leading-[0.85] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[10vw] lg:text-[7vw]">
              {['Cold.', 'Creamy.', 'Morogoro.'].map((word, i) => (
                <span key={word} className="block">
                  <motion.span
                    initial={{ y: '30%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 + i * 0.12 }}
                    className={i === 2 ? 'block text-primary' : 'block'}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>
          </motion.div>
        </div>

        {/* stage 0 — intro copy + CTA */}
        <div className="absolute inset-x-5 bottom-8 sm:inset-x-10 lg:top-1/2 lg:bottom-auto lg:left-auto lg:max-w-[22rem] lg:-translate-y-1/2">
          <motion.div style={stage0}>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-start">
              <p className="max-w-xs text-sm leading-relaxed text-[#4A2618]/75 sm:text-base">
                Ice cream is what Morogoro buys most at Family Choice Supermarket. Plus fresh
                groceries and essentials at Mafiga Shell.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={site.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold tracking-wider text-primary-foreground uppercase shadow-lg shadow-primary/25 transition-all hover:gap-3"
                >
                  Order now <ArrowUpRight className="size-4" />
                </a>
                <span className="hidden items-center gap-1.5 text-xs font-semibold text-[#4A2618]/60 sm:inline-flex">
                  <motion.span animate={{ y: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <ArrowDown className="size-3.5" />
                  </motion.span>
                  Scroll for a scoop
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* stage 1 — step caption */}
        <motion.div
          style={stage1}
          className="absolute bottom-10 left-5 max-w-xs sm:left-10 lg:bottom-16"
        >
          <span className="text-xs font-bold tracking-[0.25em] text-primary uppercase">Step 01</span>
          <p className="mt-3 font-display text-2xl leading-tight font-bold text-[#4A2618] sm:text-3xl">
            Open the freezer. Pick your favourite flavor.
          </p>
        </motion.div>

        {/* stage 1 — flavour note */}
        <motion.div
          style={stage1}
          className="absolute top-24 right-5 hidden max-w-[16rem] text-right text-sm text-[#4A2618]/70 sm:right-10 sm:block lg:top-28"
        >
          Strawberry, chocolate, vanilla, mint, mango and more. Always cold, always stocked.
        </motion.div>

        {/* stage 2 — headline */}
        <motion.div style={stage2} className="absolute top-24 left-5 sm:left-10 lg:top-28">
          <p className="font-display text-[17vw] leading-[0.85] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[12vw] lg:text-[8vw]">
            Top
            <br />
            it<span className="text-primary">.</span>
          </p>
        </motion.div>

        {/* stage 2 — sundae spec card */}
        <div className="absolute right-5 bottom-10 sm:right-10 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2">
          <motion.div style={stage2}>
            <div className="rounded-3xl bg-white/80 p-5 shadow-xl ring-1 ring-white sm:p-6">
              <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">The sundae</p>
              <p className="mt-2 font-display text-5xl leading-none font-extrabold text-[#4A2618] sm:text-6xl">
                Triple
              </p>
              <p className="mt-1 text-sm text-[#4A2618]/70">Three scoops, one happy day</p>
              <ul className="mt-5 hidden space-y-2 text-sm text-[#4A2618] sm:block">
                {['Chocolate sauce', 'Whipped cream', 'Sprinkles and a cherry'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="size-4 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* stage 3 — headline */}
        <motion.div style={stage3} className="absolute top-24 left-5 sm:left-10 lg:top-28">
          <p className="font-display text-[15vw] leading-[0.85] font-extrabold tracking-tighter text-[#4A2618] uppercase sm:text-[11vw] lg:text-[6.5vw]">
            Treat
            <br />
            <span className="text-primary">yourself.</span>
          </p>
          <p className="mt-4 hidden max-w-xs text-sm leading-relaxed text-[#4A2618]/70 lg:block">
            Grab a cone on the way home, or call and we&apos;ll bring the freezer to you in Morogoro.
          </p>
        </motion.div>

        {/* stage 3 — rotating stamps */}
        <motion.div style={stage3} className="absolute inset-0">
          <RoundBadge
            id="badge-FC"
            text="Open daily 8am – 9pm"
            center="FC"
            className="absolute top-[18%] left-[38%] hidden bg-primary text-primary-foreground lg:grid"
          />
          <RoundBadge
            id="badge-TZ"
            text="Made for Morogoro"
            center="TZ"
            className="absolute bottom-[10%] left-[34%] hidden bg-[#4A2618] text-white lg:grid"
          />
        </motion.div>

        {/* stage 3 — floating product cards */}
        <motion.div
          style={stage3}
          className="absolute inset-x-0 bottom-6 flex gap-3 overflow-x-auto px-5 [scrollbar-width:none] lg:inset-0 lg:block lg:overflow-visible lg:px-0"
        >
          {heroCards.map((item, i) => (
            <FloatingCard key={item.name} index={i} progress={scrollYProgress} item={item} />
          ))}
        </motion.div>

        {/* scroll rail */}
        <div className="absolute top-1/2 right-4 hidden -translate-y-1/2 flex-col items-center gap-3 sm:flex">
          <span className="text-[10px] font-bold tracking-[0.3em] text-[#4A2618]/50 [writing-mode:vertical-rl]">
            SCROLL
          </span>
          <div className="h-24 w-px bg-[#4A2618]/15">
            <motion.div
              style={{ scaleY: progressBar }}
              className="h-full w-full origin-top bg-primary"
            />
          </div>
        </div>

        {/* stage dots */}
        <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 gap-2 lg:flex">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === activeStage ? 'w-8 bg-primary' : 'w-1.5 bg-[#4A2618]/20'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
