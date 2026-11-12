import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { galleryItems } from '../site-data';

export function PhotoGallery() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-62%']);

  return (
    <section
      id="gallery"
      ref={ref}
      aria-label="Store photos"
      className="relative h-[300vh] bg-background"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1400px] px-6 sm:px-12">
          <p className="text-xs font-bold tracking-[0.25em] text-primary uppercase">
            Real treats. Real Morogoro.
          </p>
          <h2 className="mt-3 max-w-3xl font-display text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl">
            Something sweet for every moment of the day.
          </h2>
        </div>

        <motion.div
          style={{ x }}
          className="mt-10 flex w-max gap-5 pl-6 sm:gap-8 sm:pl-12"
        >
          {galleryItems.map((item, i) => (
            <figure
              key={item.title}
              style={{ marginTop: i % 2 === 1 ? '4vh' : 0 }}
              className="group relative h-[52vh] w-[70vw] shrink-0 overflow-hidden rounded-3xl bg-secondary shadow-xl sm:w-[34vh] lg:h-[58vh] lg:w-[46vh]"
            >
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 px-4 py-3">
                <p className="font-display text-sm font-bold text-[#4A2618]">{item.title}</p>
                <p className="text-xs text-[#4A2618]/60">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
