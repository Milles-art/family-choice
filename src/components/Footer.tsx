import { IceCreamCone } from 'lucide-react';
import { site } from '../site-data';

/** Minimal dark footer from the ice-cream-hub reference design. */
export function Footer() {
  return (
    <footer className="mt-auto bg-[#2E170E] py-8 pb-24 text-white/60 md:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-sm sm:flex-row">
        <p className="flex items-center gap-2 font-display text-base text-white">
          <IceCreamCone className="size-4 text-[#FFB3C7]" />
          {site.name}
        </p>
        <p>
          © {new Date().getFullYear()} {site.name}. Mafiga Shell, Morogoro.
        </p>
      </div>
    </footer>
  );
}
