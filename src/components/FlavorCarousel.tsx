import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { flavors } from '../site-data';

const AUTO_ADVANCE_MS = 4500;

export function FlavorCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const flavor = flavors[index];

  const step = (delta: number) =>
    setIndex((current) => (current + delta + flavors.length) % flavors.length);

  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(
      () => setIndex((current) => (current + 1) % flavors.length),
      AUTO_ADVANCE_MS,
    );
    return () => clearTimeout(timer);
  }, [index, paused]);

  return (
    <motion.section
      id="flavors"
      initial={false}
      animate={{ backgroundColor: flavor.bg }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden py-24 md:py-32"
      style={{ backgroundColor: flavors[0].bg }}
    >
      {/* oversized background flavour name — static wrapper holds the centreing */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
        <AnimatePresence initial={false} mode="wait">
          <motion.p
            key={flavor.name}
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 0.12 }}
            exit={{ x: -120, opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ color: flavor.ink }}
            className="text-center font-display text-[22vw] leading-none font-bold whitespace-nowrap select-none"
          >
            {flavor.name}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 md:grid-cols-[1fr_1.1fr_1fr]">
        {/* copy */}
        <div className="space-y-4 text-center md:text-left">
          <p
            className="text-sm font-semibold tracking-[0.2em] uppercase"
            style={{ color: flavor.ink }}
          >
            Pick your flavor
          </p>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={flavor.name}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="space-y-3"
            >
              <h2
                className="font-display text-5xl font-bold md:text-6xl"
                style={{ color: flavor.ink }}
              >
                {flavor.name}
              </h2>
              <p className="text-lg text-[#4A2618]/80">{flavor.tagline}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* photo */}
        <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={flavor.name}
              src={flavor.image}
              alt={`${flavor.name} ice cream cone`}
              initial={{ y: 200, rotate: 25, scale: 0.6, opacity: 0 }}
              animate={{ y: 0, rotate: 0, scale: 1, opacity: 1 }}
              exit={{ y: -200, rotate: -25, scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 110, damping: 16 }}
              className="absolute inset-0 size-full rounded-[3rem] object-cover shadow-2xl"
            />
          </AnimatePresence>
        </div>

        {/* controls */}
        <div className="flex flex-col items-center gap-6 md:items-end">
          <div className="flex gap-3">
            {[
              { Icon: ChevronLeft, delta: -1, label: 'Previous flavor' },
              { Icon: ChevronRight, delta: 1, label: 'Next flavor' },
            ].map(({ Icon, delta, label }) => (
              <motion.button
                key={label}
                aria-label={label}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => step(delta)}
                style={{ color: flavor.ink }}
                className="grid size-14 cursor-pointer place-items-center rounded-full bg-white shadow-lg"
              >
                <Icon className="size-6" />
              </motion.button>
            ))}
          </div>

          <div className="flex gap-2">
            {flavors.map((item, i) => (
              <button
                key={item.name}
                aria-label={`Show ${item.name}`}
                onClick={() => setIndex(i)}
                style={{ backgroundColor: flavor.ink }}
                className={`h-2.5 min-h-[10px] cursor-pointer rounded-full transition-all ${
                  i === index ? 'w-8' : 'w-2.5 opacity-40'
                }`}
              />
            ))}
          </div>

          <p className="text-sm font-medium text-[#4A2618]/70">
            {String(index + 1).padStart(2, '0')} / {String(flavors.length).padStart(2, '0')}
          </p>
        </div>
      </div>
    </motion.section>
  );
}
