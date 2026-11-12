import { HeroScrollStory } from './HeroScrollStory';
import { Marquee } from './Marquee';
import { FlavorCarousel } from './FlavorCarousel';
import { PhotoGallery } from './PhotoGallery';
import { Groceries } from './Groceries';
import { VisitSection } from './VisitSection';

/** Home composition in the ice-cream-hub reference order. */
export function HomePage() {
  return (
    <div id="top" className="fc-ref bg-background">
      <HeroScrollStory />
      <Marquee />
      <FlavorCarousel />
      <PhotoGallery />
      <Groceries />
      <VisitSection />
    </div>
  );
}
